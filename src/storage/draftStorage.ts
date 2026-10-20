/**
 * Draft Autosave Storage Wrapper
 *
 * Saves unsubmitted raw text in localStorage so users never lose their notes
 * if the browser tab is accidentally reloaded or closed.
 */

const DRAFT_KEY = 'pickup_draft_v1';
let memoryDraftFallback = '';

export function getDraft(): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryDraftFallback;
    }
    const val = window.localStorage.getItem(DRAFT_KEY);
    return val !== null ? val : memoryDraftFallback;
  } catch (error) {
    console.warn('[PickUp:DraftStorage] Failed to read draft:', error);
    return memoryDraftFallback;
  }
}

export function saveDraft(text: string): void {
  memoryDraftFallback = text;
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(DRAFT_KEY, text);
  } catch (error) {
    console.warn('[PickUp:DraftStorage] Failed to save draft:', error);
  }
}

export function clearDraft(): void {
  memoryDraftFallback = '';
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn('[PickUp:DraftStorage] Failed to clear draft:', error);
  }
}
