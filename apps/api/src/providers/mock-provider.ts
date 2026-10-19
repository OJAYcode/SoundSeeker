import type { RecognitionOutcome, RecognitionProvider } from './recognition-provider.js';

export class MockRecognitionProvider implements RecognitionProvider {
  async identify(audio: Buffer, mimeType: string): Promise<RecognitionOutcome> {
    void audio;
    void mimeType;
    return {
      status: 'match',
      track: {
        title: 'Pink Moon',
        artists: ['Nick Drake'],
        album: 'Pink Moon',
        releaseYear: 1972,
        platformLinks: {
          spotify: 'https://open.spotify.com/search/Pink%20Moon%20Nick%20Drake',
          appleMusic: 'https://music.apple.com/search?term=Pink%20Moon%20Nick%20Drake',
          youtubeMusic: 'https://music.youtube.com/search?q=Pink%20Moon%20Nick%20Drake',
          audiomack: 'https://audiomack.com/search?q=Pink%20Moon%20Nick%20Drake',
        },
        directPlatforms: [],
      },
    };
  }
}
