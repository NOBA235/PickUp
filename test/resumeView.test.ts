import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { _clearStorage, saveCard, listCards, getLatestParked, updateCard } from '../src/storage';
import { createCard } from '../src/model/card';

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, val: string) {
    this.store.set(key, val);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

describe('Resume Screen Logic & State Transitions (Phase 4)', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.stubGlobal('window', { localStorage: mockStorage });
    _clearStorage();
  });

  afterEach(() => {
    _clearStorage();
    vi.unstubAllGlobals();
  });

  it('identifies when no cards are parked for empty state', () => {
    expect(getLatestParked()).toBeNull();
    const all = listCards();
    expect(all).toEqual([]);
  });

  it('correctly retrieves latest parked card and isolates earlier cards capped at 3', () => {
    // Save 5 cards with different statuses and times
    for (let i = 1; i <= 5; i++) {
      saveCard(
        createCard({
          id: `card-${i}`,
          whereIWas: `Task ${i}`,
          nextAction: `Next ${i}`,
          waitingOn: i === 5 ? 'Waiting for review' : undefined,
          status: i === 5 ? 'parked' : 'done',
          createdAt: 1000 + i * 100,
        })
      );
    }

    const latest = getLatestParked();
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe('card-5');
    expect(latest?.whereIWas).toBe('Task 5');
    expect(latest?.nextAction).toBe('Next 5');
    expect(latest?.waitingOn).toBe('Waiting for review');

    // Earlier cards excluding the latest active card, capped at 3
    const allCards = listCards();
    const earlierCards = allCards.filter((c) => c.id !== latest!.id).slice(0, 3);

    expect(earlierCards).toHaveLength(3);
    expect(earlierCards.map((c) => c.id)).toEqual(['card-4', 'card-3', 'card-2']);
    expect(earlierCards.some((c) => c.id === 'card-5')).toBe(false);
  });

  it('transitions card from parked to resumed when "I\'m back at it" is triggered', () => {
    const card = createCard({
      id: 'task-to-resume',
      whereIWas: 'Working on Chapter 2',
      nextAction: 'Write paragraph on working memory',
      status: 'parked',
    });
    saveCard(card);
    expect(getLatestParked()?.id).toBe('task-to-resume');

    // Simulate "I'm back at it"
    updateCard('task-to-resume', { status: 'resumed' });

    // No longer returned as latest parked card
    expect(getLatestParked()).toBeNull();

    // Still accessible in card list with resumed status
    const resumed = listCards().find((c) => c.id === 'task-to-resume');
    expect(resumed?.status).toBe('resumed');
  });

  it('transitions card from parked to done when "Done" is triggered', () => {
    const card = createCard({
      id: 'task-to-finish',
      whereIWas: 'Replying to support email',
      nextAction: 'Hit send',
      status: 'parked',
    });
    saveCard(card);

    // Simulate "Done"
    updateCard('task-to-finish', { status: 'done' });

    expect(getLatestParked()).toBeNull();
    const done = listCards().find((c) => c.id === 'task-to-finish');
    expect(done?.status).toBe('done');
  });
});
