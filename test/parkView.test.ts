import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { _clearStorage, listCards, getLatestParked, saveCard } from '../src/storage';
import { clearDraft, getDraft } from '../src/storage/draftStorage';
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

describe('Park Flow Core & Persistence Logic', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.stubGlobal('window', { localStorage: mockStorage });
    _clearStorage();
    clearDraft();
  });

  afterEach(() => {
    _clearStorage();
    clearDraft();
    vi.unstubAllGlobals();
  });

  it('draft saves, retrieves, and clears reliably across interruptions', () => {
    expect(getDraft()).toBe('');
    mockStorage.setItem('pickup_draft_v1', 'Interrupted during calculus homework');
    expect(getDraft()).toBe('Interrupted during calculus homework');
  });

  it('preserves parked cards across storage reads and identifies latest parked card', () => {
    expect(getLatestParked()).toBeNull();

    const card = createCard({
      rawText: 'Solving issue #12 in compiler',
      whereIWas: '',
      nextAction: '',
      status: 'parked',
      source: 'manual',
    });

    saveCard(card);

    const latest = getLatestParked();
    expect(latest).not.toBeNull();
    expect(latest?.rawText).toBe('Solving issue #12 in compiler');
    expect(latest?.status).toBe('parked');

    const allCards = listCards();
    expect(allCards).toHaveLength(1);
    expect(allCards[0].rawText).toBe('Solving issue #12 in compiler');
  });
});
