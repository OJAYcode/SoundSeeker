import { describe, expect, it } from 'vitest';
import { buildPlatformLinks } from './platform-links.js';

describe('buildPlatformLinks', () => {
  it('keeps direct links and creates search fallbacks', () => {
    const result = buildPlatformLinks('Pink Moon', ['Nick Drake'], {
      spotify: 'https://open.spotify.com/track/123',
    });
    expect(result.platformLinks.spotify).toBe('https://open.spotify.com/track/123');
    expect(result.platformLinks.audiomack).toBe(
      'https://audiomack.com/search?q=Pink%20Moon%20Nick%20Drake',
    );
    expect(result.directPlatforms).toEqual(['spotify']);
  });
});
