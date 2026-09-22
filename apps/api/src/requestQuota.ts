/** Small process-local request quotas for the single-user demo. Login cooldowns
 * live in SQLite separately; no Redis or background cleanup worker is needed. */
export class RequestQuota {
  private readonly windows = new Map<string, { count: number; expires: number }>();

  consume(ip: string, now = Date.now()): number | null {
    for (const [key, window] of this.windows) {
      if (window.expires <= now) this.windows.delete(key);
    }
    const buckets = [
      { key: 'shared-account', limit: 300 },
      { key: `ip:${ip}`, limit: 120 },
    ];
    for (const { key, limit } of buckets) {
      const window = this.windows.get(key);
      if (window !== undefined && window.count >= limit) {
        return Math.ceil((window.expires - now) / 1000);
      }
    }
    for (const { key } of buckets) {
      const window = this.windows.get(key) ?? { count: 0, expires: now + 60_000 };
      window.count += 1;
      this.windows.set(key, window);
    }
    return null;
  }
}
