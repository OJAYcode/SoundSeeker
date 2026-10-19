import { describe, expect, it } from 'vitest';
import { createAcrSignature, normalizeAcrMatch } from './acrcloud-provider.js';

describe('ACRCloud provider helpers', () => {
  it('creates the documented HMAC-SHA1 signature', () => {
    expect(createAcrSignature('key', 'secret', 1_700_000_000)).toBe('tWbqxXkbyadGeaHIJS/OzfF+KdU=');
  });

  it('normalizes a provider match and creates search fallbacks', () => {
    const track = normalizeAcrMatch({
      title: 'Pink Moon',
      artists: [{ name: 'Nick Drake' }],
      album: { name: 'Pink Moon' },
      release_date: '1972-02-25',
      external_ids: { isrc: 'GBAYE7200011' },
    });
    expect(track).toMatchObject({ title: 'Pink Moon', releaseYear: 1972, isrc: 'GBAYE7200011' });
    expect(track?.platformLinks.youtubeMusic).toContain('Pink%20Moon');
  });
});
