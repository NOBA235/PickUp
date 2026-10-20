import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCard } from '../src/model/card';
import {
  saveCard,
  listCards,
  getLatestParked,
  updateCard,
  deleteCard,
  _clearStorage,
  _forceStorageBlocked,
  STORAGE_KEY,
  MAX_CARDS,
} from '../src/storage';

// In-memory mock localStorage implementation for Node test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('Storage Module', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    // Assign mock window.localStorage
    vi.stubGlobal('window', { localStorage: mockStorage });
    _clearStorage();
  });

  afterEach(() => {
    _clearStorage();
    vi.unstubAllGlobals();
  });

  describe('Empty storage', () => {
    it('returns an empty array when storage is empty', () => {
      const cards = listCards();
      expect(cards).toEqual([]);
      expect(getLatestParked()).toBeNull();
    });
  });

  describe('Corrupted JSON', () => {
    it('gracefully handles invalid JSON in storage without throwing', () => {
      mockStorage.setItem(STORAGE_KEY, '{ this is not valid json : [ }');

      const cards = listCards();
      expect(cards).toEqual([]);
      expect(getLatestParked()).toBeNull();
    });

    it('gracefully handles non-array stored data by resetting to empty', () => {
      mockStorage.setItem(STORAGE_KEY, JSON.stringify({ some: 'object' }));

      const cards = listCards();
      expect(cards).toEqual([]);
    });
  });

  describe('Blocked storage & In-memory fallback', () => {
    it('operates via in-memory store when storage throws access denied errors', () => {
      // Mock localStorage throwing errors as in private mode / strict sandbox
      const throwingStorage = {
        getItem: vi.fn(() => {
          throw new Error('SecurityError: Access is denied.');
        }),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError: Storage quota exceeded.');
        }),
        removeItem: vi.fn(() => {
          throw new Error('SecurityError: Access is denied.');
        }),
      };

      vi.stubGlobal('window', { localStorage: throwingStorage });

      const card = createCard({
        whereIWas: 'Blocked test',
        nextAction: 'Verify fallback works',
      });

      expect(() => saveCard(card)).not.toThrow();

      const cards = listCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].whereIWas).toBe('Blocked test');
      expect(getLatestParked()?.id).toBe(card.id);
    });

    it('falls back to memory store when window.localStorage is undefined', () => {
      vi.stubGlobal('window', {});

      const card = createCard({
        whereIWas: 'No window.localStorage',
        nextAction: 'Verify node environment fallback',
      });

      saveCard(card);
      const cards = listCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].nextAction).toBe('Verify node environment fallback');
    });

    it('handles explicit _forceStorageBlocked toggle', () => {
      _forceStorageBlocked(true);

      const card = createCard({
        whereIWas: 'Forced blocked test',
        nextAction: 'Ensure memory store is active',
      });

      saveCard(card);
      const cards = listCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].whereIWas).toBe('Forced blocked test');
    });
  });

  describe('20-card cap', () => {
    it('keeps at most 20 cards, discarding the oldest cards', () => {
      const baseTime = 100000;

      // Save 25 cards with increasing timestamps
      for (let i = 1; i <= 25; i++) {
        const card = createCard({
          id: `card-${i}`,
          whereIWas: `Task ${i}`,
          nextAction: `Action ${i}`,
          createdAt: baseTime + i * 1000,
        });
        saveCard(card);
      }

      const storedCards = listCards();
      expect(storedCards).toHaveLength(MAX_CARDS);
      expect(storedCards).toHaveLength(20);

      // Most recent card should be card-25
      expect(storedCards[0].id).toBe('card-25');
      // 20th card should be card-6
      expect(storedCards[19].id).toBe('card-6');

      // The oldest 5 cards (card-1 through card-5) should have been pruned
      const ids = storedCards.map((c) => c.id);
      expect(ids).not.toContain('card-1');
      expect(ids).not.toContain('card-2');
      expect(ids).not.toContain('card-3');
      expect(ids).not.toContain('card-4');
      expect(ids).not.toContain('card-5');
    });
  });

  describe('CRUD Functions', () => {
    it('saves and updates an existing card by ID without creating a duplicate', () => {
      const card = createCard({
        id: 'card-abc',
        whereIWas: 'Debugging unit tests',
        nextAction: 'Check assertion',
      });

      saveCard(card);
      expect(listCards()).toHaveLength(1);

      // Update card content with the same ID
      const updatedCard = {
        ...card,
        whereIWas: 'Tests are passing',
      };
      saveCard(updatedCard);

      const cards = listCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].whereIWas).toBe('Tests are passing');
    });

    it('retrieves the latest parked card ignoring done and resumed cards', () => {
      const cardDone = createCard({
        id: 'c-1',
        whereIWas: 'Finished task',
        nextAction: 'Relax',
        status: 'done',
        createdAt: 1000,
      });

      const cardParkedOld = createCard({
        id: 'c-2',
        whereIWas: 'Old parked task',
        nextAction: 'Old action',
        status: 'parked',
        createdAt: 2000,
      });

      const cardParkedNew = createCard({
        id: 'c-3',
        whereIWas: 'Newest parked task',
        nextAction: 'Immediate next step',
        status: 'parked',
        createdAt: 3000,
      });

      const cardResumed = createCard({
        id: 'c-4',
        whereIWas: 'Active task',
        nextAction: 'Currently doing this',
        status: 'resumed',
        createdAt: 4000,
      });

      saveCard(cardDone);
      saveCard(cardParkedOld);
      saveCard(cardParkedNew);
      saveCard(cardResumed);

      const latest = getLatestParked();
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe('c-3');
      expect(latest?.whereIWas).toBe('Newest parked task');
    });

    it('updates specific card fields via updateCard', () => {
      const card = createCard({
        id: 'card-update-test',
        whereIWas: 'Working on Chapter 1',
        nextAction: 'Draft conclusion',
        status: 'parked',
      });

      saveCard(card);

      const result = updateCard('card-update-test', {
        status: 'resumed',
        nextAction: 'Review drafted conclusion',
      });

      expect(result).not.toBeNull();
      expect(result?.status).toBe('resumed');
      expect(result?.nextAction).toBe('Review drafted conclusion');
      expect(result?.whereIWas).toBe('Working on Chapter 1');

      const reloaded = listCards().find((c) => c.id === 'card-update-test');
      expect(reloaded?.status).toBe('resumed');
      expect(reloaded?.nextAction).toBe('Review drafted conclusion');
    });

    it('returns null when updating a non-existent card', () => {
      const result = updateCard('non-existent-id', { status: 'done' });
      expect(result).toBeNull();
    });

    it('deletes an existing card and returns true', () => {
      const card = createCard({
        id: 'card-delete-me',
        whereIWas: 'Temporary note',
        nextAction: 'Delete soon',
      });

      saveCard(card);
      expect(listCards()).toHaveLength(1);

      const deleted = deleteCard('card-delete-me');
      expect(deleted).toBe(true);
      expect(listCards()).toHaveLength(0);
    });

    it('returns false when deleting a non-existent card', () => {
      const deleted = deleteCard('missing-id');
      expect(deleted).toBe(false);
    });
  });
});
