import type { PlatformLinks } from '@soundseeker/shared';

export type PlatformName = keyof PlatformLinks;
const platformSearchUrls: Record<PlatformName, (query: string) => string> = {
  spotify: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
  appleMusic: (query) => `https://music.apple.com/search?term=${encodeURIComponent(query)}`,
  youtubeMusic: (query) => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
  audiomack: (query) => `https://audiomack.com/search?q=${encodeURIComponent(query)}`,
};

export function buildPlatformLinks(
  title: string,
  artists: string[],
  direct: Partial<PlatformLinks> = {},
) {
  const query = `${title} ${artists.join(' ')}`;
  const platformLinks = {} as Required<PlatformLinks>;
  const directPlatforms: PlatformName[] = [];
  for (const platform of Object.keys(platformSearchUrls) as PlatformName[]) {
    const link = direct[platform];
    platformLinks[platform] = link ?? platformSearchUrls[platform](query);
    if (link) directPlatforms.push(platform);
  }
  return { platformLinks, directPlatforms };
}
