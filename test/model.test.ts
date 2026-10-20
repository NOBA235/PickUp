import { describe, it, expect } from 'vitest';
import { createCard } from '../src/model/card';

describe('Card Model', () => {
  it('creates a card with required fields and sensible defaults', () => {
    const card = createCard({
      whereIWas: 'Reviewing PR #42',
      nextAction: 'Leave review comment on auth flow',
    });

    expect(card.id).toBeDefined();
    expect(card.whereIWas).toBe('Reviewing PR #42');
    expect(card.nextAction).toBe('Leave review comment on auth flow');
    expect(card.waitingOn).toBeUndefined();
    expect(card.status).toBe('parked');
    expect(card.source).toBe('manual');
    expect(card.rawText).toBe('');
    expect(card.createdAt).toBeGreaterThan(0);
  });

  it('trims whitespace and populates optional waitingOn, rawText, status, and source', () => {
    const card = createCard({
      id: 'custom-id',
      rawText: 'Spoken transcript text',
      whereIWas: '  Writing essay intro  ',
      nextAction: '  Find citation for claim  ',
      waitingOn: '  Email from librarian  ',
      status: 'resumed',
      source: 'rules',
      createdAt: 1700000000000,
    });

    expect(card.id).toBe('custom-id');
    expect(card.rawText).toBe('Spoken transcript text');
    expect(card.whereIWas).toBe('Writing essay intro');
    expect(card.nextAction).toBe('Find citation for claim');
    expect(card.waitingOn).toBe('Email from librarian');
    expect(card.status).toBe('resumed');
    expect(card.source).toBe('rules');
    expect(card.createdAt).toBe(1700000000000);
  });
});
