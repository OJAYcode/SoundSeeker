import type { TrackInfo } from '@soundseeker/shared';

export type RecognitionOutcome =
  | { status: 'match'; track: TrackInfo }
  | { status: 'no_match' }
  | { status: 'quota_exceeded' }
  | { status: 'error'; message: string };

export interface RecognitionProvider {
  identify(audio: Buffer, mimeType: string): Promise<RecognitionOutcome>;
}
