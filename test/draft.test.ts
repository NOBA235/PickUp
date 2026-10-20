import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDraft, saveDraft, clearDraft } from '../src/storage/draftStorage';

class MockStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, val: string) {
    this.data.set(key, val);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe('Draft Storage', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.stubGlobal('window', { localStorage: mockStorage });
    clearDraft();
  });

  afterEach(() => {
    clearDraft();
    vi.unstubAllGlobals();
  });

  it('saves, retrieves, and clears draft text in localStorage', () => {
    expect(getDraft()).toBe('');

    saveDraft('Draft content in progress');
    expect(getDraft()).toBe('Draft content in progress');

    clearDraft();
    expect(getDraft()).toBe('');
  });

  it('falls back to memory store when storage operations throw errors', () => {
    const errorStorage = {
      getItem: vi.fn(() => {
        throw new Error('QuotaExceeded');
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceeded');
      }),
      removeItem: vi.fn(() => {
        throw new Error('QuotaExceeded');
      }),
    };

    vi.stubGlobal('window', { localStorage: errorStorage });

    saveDraft('Draft in fallback memory');
    expect(getDraft()).toBe('Draft in fallback memory');

    clearDraft();
    expect(getDraft()).toBe('');
  });
});
