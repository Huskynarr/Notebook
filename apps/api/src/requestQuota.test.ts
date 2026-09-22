import { describe, expect, it } from 'vitest';
import { RequestQuota } from './requestQuota.ts';

describe('Anfragenkontingent', () => {
  it('begrenzt eine IP auf 120 Anfragen pro Minute und gibt Restwartezeit zurück', () => {
    const quota = new RequestQuota();
    for (let index = 0; index < 120; index++) expect(quota.consume('192.0.2.1', 1000)).toBeNull();
    expect(quota.consume('192.0.2.1', 2000)).toBe(59);
    expect(quota.consume('192.0.2.2', 2000)).toBeNull();
    expect(quota.consume('192.0.2.1', 61_000)).toBeNull();
  });

  it('begrenzt auch rotierende IPs gemeinsam auf 300 Anfragen pro Minute', () => {
    const quota = new RequestQuota();
    for (let index = 0; index < 300; index++) expect(quota.consume(`ip-${index}`, 1000)).toBeNull();
    expect(quota.consume('new-ip', 1000)).toBe(60);
    expect(quota.consume('new-ip', 61_000)).toBeNull();
  });
});
