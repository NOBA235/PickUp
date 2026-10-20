/**
 * Defensive local storage wrapper.
 * Every operation is wrapped in try/catch to ensure the application
 * gracefully functions when storage is empty, corrupted, quota-limited, or blocked.
 */

const STORAGE_PREFIX = 'pickup_v1_';

export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[PickUp:Storage] Failed to read key "${key}":`, error);
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(STORAGE_PREFIX + key, serialized);
    return true;
  } catch (error) {
    console.warn(`[PickUp:Storage] Failed to write key "${key}":`, error);
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.warn(`[PickUp:Storage] Failed to remove key "${key}":`, error);
    return false;
  }
}
