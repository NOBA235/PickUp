/**
 * Settings Storage & DOM Applicator (Phase 6)
 * Manages persistence and immediate DOM application of user accessibility preferences:
 * - Text size (normal, large, xlarge)
 * - Dyslexia-friendly typography & spacing
 * - Color theme (system, light, dark, high-contrast)
 * - Motion preferences (system, reduce, no-preference)
 */

export type TextSize = 'normal' | 'large' | 'xlarge';
export type Theme = 'system' | 'light' | 'dark' | 'high-contrast';
export type MotionPreference = 'system' | 'reduce' | 'no-preference';

export interface AppSettings {
  textSize: TextSize;
  dyslexicFont: boolean;
  theme: Theme;
  reduceMotion: MotionPreference;
}

export const SETTINGS_STORAGE_KEY = 'pickup_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  textSize: 'normal',
  dyslexicFont: false,
  theme: 'system',
  reduceMotion: 'system',
};

// In-memory fallback if localStorage is disabled or throws
let memorySettingsFallback: AppSettings = { ...DEFAULT_SETTINGS };

/**
 * Resets in-memory settings state for unit test isolation.
 */
export function _resetMemorySettingsForTesting(): void {
  memorySettingsFallback = { ...DEFAULT_SETTINGS };
}

/**
 * Validates and normalizes raw untrusted settings data.
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  const textSize: TextSize =
    obj.textSize === 'large' || obj.textSize === 'xlarge' ? obj.textSize : 'normal';

  const dyslexicFont = Boolean(obj.dyslexicFont);

  const theme: Theme =
    obj.theme === 'light' || obj.theme === 'dark' || obj.theme === 'high-contrast'
      ? obj.theme
      : 'system';

  const reduceMotion: MotionPreference =
    obj.reduceMotion === 'reduce' || obj.reduceMotion === 'no-preference'
      ? obj.reduceMotion
      : 'system';

  return {
    textSize,
    dyslexicFont,
    theme,
    reduceMotion,
  };
}

/**
 * Retrieves persisted settings defensively from localStorage.
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...memorySettingsFallback };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSettings(parsed);
    memorySettingsFallback = { ...sanitized };
    return sanitized;
  } catch (err) {
    console.warn('[PickUp:Settings] Error reading settings from storage, using fallback:', err);
    return { ...memorySettingsFallback };
  }
}

/**
 * Persists user settings defensively to localStorage.
 */
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = sanitizeSettings({
    ...current,
    ...settings,
  });

  memorySettingsFallback = { ...updated };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PickUp:Settings] Failed to write settings to storage:', err);
    }
  }

  applySettingsToDOM(updated);
  return updated;
}

/**
 * Applies active settings directly to the DOM root element (e.g. <html>)
 * via explicit data-attributes for instant CSS token response.
 */
export function applySettingsToDOM(
  settings: AppSettings,
  rootElement?: HTMLElement | null
): void {
  const root =
    rootElement ??
    (typeof document !== 'undefined' ? document.documentElement : null);

  if (!root) return;

  root.setAttribute('data-text-size', settings.textSize);
  root.setAttribute('data-font', settings.dyslexicFont ? 'dyslexic' : 'default');
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-reduce-motion', settings.reduceMotion);
}
