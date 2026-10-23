/**
 * Study Storage Module (Phase 7)
 * Manages local persistence for researcher study trials under `pickup_study_trials_v1`.
 * Fully defensive with memory fallback. All data strictly stays on-device.
 */

import { StudyTrial } from '../model/study';

export const STUDY_STORAGE_KEY = 'pickup_study_trials_v1';

let memoryTrialsFallback: StudyTrial[] = [];

/**
 * Resets the in-memory fallback array for isolated unit testing.
 */
export function _resetMemoryTrialsForTesting(): void {
  memoryTrialsFallback = [];
}

/**
 * Retrieves all stored study trials.
 */
export function getStudyTrials(): StudyTrial[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...memoryTrialsFallback];
  }

  try {
    const raw = window.localStorage.getItem(STUDY_STORAGE_KEY);
    if (!raw) {
      return [...memoryTrialsFallback];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[PickUp:Study] Stored trials are not an array. Resetting.');
      return [];
    }
    memoryTrialsFallback = [...parsed];
    return parsed;
  } catch (err) {
    console.warn('[PickUp:Study] Error reading study trials from storage:', err);
    return [...memoryTrialsFallback];
  }
}

/**
 * Adds and persists a new study trial.
 */
export function saveStudyTrial(
  data: Omit<StudyTrial, 'id' | 'timestamp'>
): StudyTrial {
  const trials = getStudyTrials();

  const newTrial: StudyTrial = {
    ...data,
    id: `trial_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    participantCode: (data.participantCode || 'P_ANON').trim().toUpperCase(),
    timestamp: new Date().toISOString(),
  };

  const updated = [newTrial, ...trials];
  memoryTrialsFallback = [...updated];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PickUp:Study] Failed to write study trial to storage:', err);
    }
  }

  return newTrial;
}

/**
 * Deletes a single study trial by its unique ID.
 */
export function deleteStudyTrial(id: string): void {
  const trials = getStudyTrials();
  const updated = trials.filter((t) => t.id !== id);
  memoryTrialsFallback = [...updated];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PickUp:Study] Failed to update storage after trial deletion:', err);
    }
  }
}

/**
 * Clears all study trial records.
 */
export function clearAllStudyTrials(): void {
  memoryTrialsFallback = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STUDY_STORAGE_KEY);
    } catch (err) {
      console.warn('[PickUp:Study] Failed to clear study storage:', err);
    }
  }
}
