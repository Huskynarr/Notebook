import { describe, it, expect } from 'vitest';
import { openDatabase } from './db/database.ts';
import { AskBudget } from './askBudget.ts';

describe('AI request budget', () => {
  it('limits concurrent work, releases once and preserves limits across instances', () => {
    const db = openDatabase(':memory:');
    try {
      const budget = new AskBudget(db);
      const first = budget.acquire(1_000);
      const second = budget.acquire(1_000);
      expect(budget.acquire(1_000)).toEqual({ retryAfterSeconds: 5 });
      if (!('release' in first) || !('release' in second)) throw new Error('Admission failed');
      first.release();
      first.release();
      second.release();
      for (let index = 0; index < 8; index += 1) {
        const admitted = budget.acquire(1_000);
        if (!('release' in admitted)) throw new Error('Admission failed');
        admitted.release();
      }
      expect(new AskBudget(db).acquire(1_000)).toEqual({ retryAfterSeconds: 60 });
      expect(new AskBudget(db).acquire(61_000)).toHaveProperty('release');
    } finally {
      db.close();
    }
  });

  it('caps daily requests even when the process and minute window change', () => {
    const db = openDatabase(':memory:');
    try {
      for (let index = 0; index < 100; index += 1) {
        const result = new AskBudget(db).acquire(index * 60_000);
        expect(result).toHaveProperty('release');
        if ('release' in result) result.release();
      }
      expect(new AskBudget(db).acquire(6_000_000)).toEqual({ retryAfterSeconds: 80_400 });
      expect(new AskBudget(db).acquire(86_400_000)).toHaveProperty('release');
    } finally {
      db.close();
    }
  });
});
