import { describe, expect, it } from 'vitest';
import { identifyResponseSchema } from './index.js';

describe('identifyResponseSchema', () => {
  it('accepts a normalized match response', () => {
    const response = identifyResponseSchema.parse({
      status: 'match',
      track: { title: 'Pink Moon', artists: ['Nick Drake'], platformLinks: {} },
    });
    expect(response.status).toBe('match');
  });
});
