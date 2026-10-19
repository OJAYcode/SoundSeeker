import { z } from 'zod';

export const platformLinksSchema = z.object({
  spotify: z.url().optional(),
  appleMusic: z.url().optional(),
  youtubeMusic: z.url().optional(),
  audiomack: z.url().optional(),
});

export const trackInfoSchema = z.object({
  title: z.string().min(1),
  artists: z.array(z.string().min(1)).min(1),
  album: z.string().min(1).optional(),
  releaseYear: z.number().int().min(1800).max(3000).optional(),
  coverArtUrl: z.url().optional(),
  isrc: z.string().min(1).optional(),
  platformLinks: platformLinksSchema,
  directPlatforms: z
    .array(z.enum(['spotify', 'appleMusic', 'youtubeMusic', 'audiomack']))
    .default([]),
});

export type PlatformLinks = z.infer<typeof platformLinksSchema>;
export type TrackInfo = z.infer<typeof trackInfoSchema>;

export const identifyResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('match'), track: trackInfoSchema }),
  z.object({ status: z.literal('no_match') }),
  z.object({ status: z.literal('quota_exceeded') }),
  z.object({ status: z.literal('error'), message: z.string().min(1) }),
]);

export type IdentifyResponse = z.infer<typeof identifyResponseSchema>;
