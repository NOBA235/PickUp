import { describe, it, expect } from 'vitest';
import { createEmptyCard } from '../src/model/card';

describe('PickupCard Model', () => {
  it('creates an empty card with valid default timestamps and empty fields', () => {
    const card = createEmptyCard('test-card-1');

    expect(card.id).toBe('test-card-1');
    expect(card.whereIWas).toBe('');
    expect(card.nextAction).toBe('');
    expect(card.waitingOn).toBe('');
    expect(card.createdAt).toBeGreaterThan(0);
    expect(card.updatedAt).toBe(card.createdAt);
  });
});
