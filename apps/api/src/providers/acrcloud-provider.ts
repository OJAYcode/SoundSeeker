import { createHmac } from 'node:crypto';
import type { TrackInfo } from '@soundseeker/shared';
import { buildPlatformLinks } from '../platform-links.js';
import type { RecognitionOutcome, RecognitionProvider } from './recognition-provider.js';

type AcrTrack = {
  title?: string;
  artists?: Array<{ name?: string }>;
  album?: { name?: string };
  release_date?: string;
  external_ids?: { isrc?: string };
  external_metadata?: Record<string, unknown>;
};
type AcrResponse = { status?: { code?: number }; metadata?: { music?: AcrTrack[] } };

export function createAcrSignature(
  accessKey: string,
  accessSecret: string,
  timestamp: number,
): string {
  return createHmac('sha1', accessSecret)
    .update(['POST', '/v1/identify', accessKey, 'audio', '1', String(timestamp)].join('\n'))
    .digest('base64');
}

function asLink(value: unknown): string | undefined {
  return typeof value === 'string' && value.startsWith('https://') ? value : undefined;
}
function directLinks(
  metadata: Record<string, unknown> | undefined,
): Partial<TrackInfo['platformLinks']> {
  const spotify = metadata?.spotify as { link?: unknown; track?: { id?: unknown } } | undefined;
  const appleMusic = metadata?.applemusic as { link?: unknown } | undefined;
  const youtube = metadata?.youtube as { link?: unknown; vid?: unknown } | undefined;
  return {
    spotify:
      asLink(spotify?.link) ??
      (typeof spotify?.track?.id === 'string'
        ? `https://open.spotify.com/track/${spotify.track.id}`
        : undefined),
    appleMusic: asLink(appleMusic?.link),
    youtubeMusic:
      asLink(youtube?.link) ??
      (typeof youtube?.vid === 'string'
        ? `https://music.youtube.com/watch?v=${youtube.vid}`
        : undefined),
  };
}

export function normalizeAcrMatch(match: AcrTrack): TrackInfo | undefined {
  const title = match.title?.trim();
  const artists = match.artists
    ?.map((artist) => artist.name?.trim())
    .filter((name): name is string => Boolean(name));
  if (!title || !artists?.length) return undefined;
  const releaseYear = /^\d{4}/.exec(match.release_date ?? '')?.[0];
  return {
    title,
    artists,
    album: match.album?.name?.trim() || undefined,
    releaseYear: releaseYear ? Number(releaseYear) : undefined,
    isrc: match.external_ids?.isrc,
    ...buildPlatformLinks(title, artists, directLinks(match.external_metadata)),
  };
}

export class AcrCloudProvider implements RecognitionProvider {
  constructor(
    private readonly credentials: { host: string; accessKey: string; accessSecret: string },
  ) {}
  async identify(audio: Buffer, mimeType: string): Promise<RecognitionOutcome> {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new FormData();
    body.set('access_key', this.credentials.accessKey);
    body.set('data_type', 'audio');
    body.set('signature_version', '1');
    body.set('timestamp', String(timestamp));
    body.set(
      'signature',
      createAcrSignature(this.credentials.accessKey, this.credentials.accessSecret, timestamp),
    );
    body.set('sample_bytes', String(audio.length));
    body.set('sample', new Blob([Uint8Array.from(audio)], { type: mimeType }), 'recording');
    try {
      const response = await fetch(`https://${this.credentials.host}/v1/identify`, {
        method: 'POST',
        body,
      });
      if (!response.ok)
        return { status: 'error', message: 'Recognition is temporarily unavailable.' };
      const payload = (await response.json()) as AcrResponse;
      if (payload.status?.code === 1001) return { status: 'no_match' };
      if (payload.status?.code === 3003 || payload.status?.code === 3015)
        return { status: 'quota_exceeded' };
      if (payload.status?.code !== 0)
        return { status: 'error', message: 'Recognition is temporarily unavailable.' };
      const track = normalizeAcrMatch(payload.metadata?.music?.[0] ?? {});
      return track ? { status: 'match', track } : { status: 'no_match' };
    } catch {
      return { status: 'error', message: 'Recognition is temporarily unavailable.' };
    }
  }
}
