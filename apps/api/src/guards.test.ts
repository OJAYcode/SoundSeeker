import { describe, expect, it, vi } from 'vitest';
import { DailyQuota, GuardedRecognitionProvider } from './guards.js';

describe('DailyQuota', () => {
  it('limits usage and resets the next UTC day', () => {
    const quota = new DailyQuota(1);
    expect(quota.consume(new Date('2026-10-19T12:00:00Z'))).toBe(true);
    expect(quota.consume(new Date('2026-10-19T13:00:00Z'))).toBe(false);
    expect(quota.consume(new Date('2026-10-20T00:00:00Z'))).toBe(true);
  });
});

describe('GuardedRecognitionProvider', () => {
  it('returns cached results without consuming another provider lookup', async () => {
    const identify = vi.fn().mockResolvedValue({ status: 'no_match' as const });
    const provider = new GuardedRecognitionProvider({ identify }, new DailyQuota(1));
    await provider.identify(Buffer.from('sample'), 'audio/webm');
    await provider.identify(Buffer.from('sample'), 'audio/webm');
    expect(identify).toHaveBeenCalledTimes(1);
  });
});
