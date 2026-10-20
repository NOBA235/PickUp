/**
 * PickUp Card Storage Module
 *
 * Implements resilient local-first persistence:
 * - Versioned key: 'pickup_cards_v1'
 * - Wrapped in try/catch to gracefully handle empty, corrupted, or blocked storage
 * - Transparent in-memory fallback when localStorage is disabled or throws
 * - Maximum capacity: 20 cards (keeps newest cards, discards oldest)
 */

import { Card } from '../model/card';

export const STORAGE_KEY = 'pickup_cards_v1';
export const MAX_CARDS = 20;

// Transparent in-memory store for environments where localStorage is blocked or throws
let memoryFallbackStore: Card[] | null = null;
let forceBlockedForTesting = false;

/**
 * Checks if localStorage is available and writable.
 */
function isLocalStorageAvailable(): boolean {
  if (forceBlockedForTesting) {
    return false;
  }
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const probeKey = '__pickup_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely reads raw cards array from storage or in-memory fallback.
 */
function readCards(): Card[] {
  if (forceBlockedForTesting || !isLocalStorageAvailable()) {
    if (memoryFallbackStore === null) {
      memoryFallbackStore = [];
    }
    return [...memoryFallbackStore];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[PickUp:Storage] Stored cards data is not an array. Resetting.');
      return [];
    }
    // Return array of valid objects
    return parsed.filter((item): item is Card => Boolean(item && typeof item === 'object' && 'id' in item));
  } catch (error) {
    console.warn('[PickUp:Storage] Error reading or parsing cards from storage:', error);
    // If storage is corrupted or blocked, fall back to in-memory store
    if (memoryFallbackStore === null) {
      memoryFallbackStore = [];
    }
    return [...memoryFallbackStore];
  }
}

/**
 * Safely persists cards array to storage or in-memory fallback.
 */
function writeCards(cards: Card[]): boolean {
  // Always keep in-memory fallback synchronized
  memoryFallbackStore = [...cards];

  if (forceBlockedForTesting || !isLocalStorageAvailable()) {
    return true; // Gracefully handled via memory fallback
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch (error) {
    console.warn('[PickUp:Storage] Failed to write cards to localStorage, using in-memory store:', error);
    return true; // Still succeeds via memory store
  }
}

/**
 * Lists all stored cards, sorted newest first by createdAt.
 */
export function listCards(): Card[] {
  const cards = readCards();
  return cards.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Saves a card. If card already exists by ID, updates it.
 * Otherwise prepends the card and enforces the 20-card cap.
 */
export function saveCard(card: Card): Card {
  const current = readCards();
  const existingIndex = current.findIndex((c) => c.id === card.id);

  let updatedList: Card[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = {
      ...card,
      updatedAt: Date.now(),
    };
  } else {
    updatedList = [card, ...current];
  }

  // Sort newest first
  updatedList.sort((a, b) => b.createdAt - a.createdAt);

  // Enforce 20-card cap
  if (updatedList.length > MAX_CARDS) {
    updatedList = updatedList.slice(0, MAX_CARDS);
  }

  writeCards(updatedList);
  return card;
}

/**
 * Retrieves the most recent card with 'parked' status.
 */
export function getLatestParked(): Card | null {
  const cards = listCards();
  const parked = cards.find((c) => c.status === 'parked');
  return parked ? { ...parked } : null;
}

/**
 * Updates an existing card by ID.
 * Returns the updated card, or null if not found.
 */
export function updateCard(
  id: string,
  updates: Partial<Omit<Card, 'id' | 'createdAt'>>
): Card | null {
  const current = readCards();
  const index = current.findIndex((c) => c.id === id);

  if (index === -1) {
    return null;
  }

  const existing = current[index];
  const updated: Card = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  current[index] = updated;
  writeCards(current);
  return { ...updated };
}

/**
 * Deletes a card by ID.
 * Returns true if deleted, false if not found.
 */
export function deleteCard(id: string): boolean {
  const current = readCards();
  const filtered = current.filter((c) => c.id !== id);

  if (filtered.length === current.length) {
    return false;
  }

  writeCards(filtered);
  return true;
}

/**
 * Testing & Reset Utilities
 */
export function _clearStorage(): void {
  memoryFallbackStore = null;
  forceBlockedForTesting = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore error in blocked environment
  }
}

export function _forceStorageBlocked(blocked: boolean): void {
  forceBlockedForTesting = blocked;
}
