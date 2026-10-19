import { createHash } from 'node:crypto';
import type { RecognitionOutcome, RecognitionProvider } from './providers/recognition-provider.js';

export class DailyQuota {
  private day = '';
  private used = 0;
  constructor(private readonly limit: number) {}
  consume(now = new Date()): boolean {
    const day = now.toISOString().slice(0, 10);
    if (day !== this.day) {
      this.day = day;
      this.used = 0;
    }
    if (this.used >= this.limit) return false;
    this.used += 1;
    return true;
  }
}
export class LruResultCache {
  private readonly entries = new Map<string, RecognitionOutcome>();
  constructor(private readonly maxEntries = 200) {}
  get(key: string) {
    const value = this.entries.get(key);
    if (value) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }
  set(key: string, value: RecognitionOutcome) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.maxEntries)
      this.entries.delete(this.entries.keys().next().value as string);
  }
}
export class GuardedRecognitionProvider implements RecognitionProvider {
  constructor(
    private readonly provider: RecognitionProvider,
    private readonly quota: DailyQuota,
    private readonly cache = new LruResultCache(),
  ) {}
  async identify(audio: Buffer, mimeType: string): Promise<RecognitionOutcome> {
    const key = createHash('sha256').update(mimeType).update(audio).digest('hex');
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (!this.quota.consume()) return { status: 'quota_exceeded' };
    const result = await this.provider.identify(audio, mimeType);
    this.cache.set(key, result);
    return result;
  }
}
