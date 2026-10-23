import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  sanitizeSettings,
  applySettingsToDOM,
  SETTINGS_STORAGE_KEY,
  _resetMemorySettingsForTesting,
} from '../src/storage/settingsStorage';

// Safely access Node APIs if available during test execution
declare const require: any;
declare const process: any;

describe('Settings & Accessibility Storage (Phase 6)', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    _resetMemorySettingsForTesting();
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, val: string) => {
        mockStore[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
  });

  describe('Sanitization & Defaults', () => {
    it('returns default settings for null or non-object input', () => {
      expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
      expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
      expect(sanitizeSettings('invalid')).toEqual(DEFAULT_SETTINGS);
      expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
    });

    it('preserves valid custom settings', () => {
      const custom = {
        textSize: 'xlarge' as const,
        dyslexicFont: true,
        theme: 'high-contrast' as const,
        reduceMotion: 'reduce' as const,
      };
      expect(sanitizeSettings(custom)).toEqual(custom);
    });

    it('falls back to safe defaults for invalid field values', () => {
      const malformed = {
        textSize: 'gigantic',
        dyslexicFont: 'yes',
        theme: 'neon-green',
        reduceMotion: 'always',
      };
      const sanitized = sanitizeSettings(malformed);
      expect(sanitized.textSize).toBe('normal');
      expect(sanitized.dyslexicFont).toBe(true);
      expect(sanitized.theme).toBe('system');
      expect(sanitized.reduceMotion).toBe('system');
    });
  });

  describe('Storage Persistence', () => {
    it('reads default settings when storage is empty', () => {
      const settings = getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('persists and updates settings across save calls', () => {
      saveSettings({ textSize: 'large', theme: 'dark' });
      const current = getSettings();
      expect(current.textSize).toBe('large');
      expect(current.theme).toBe('dark');
      expect(current.dyslexicFont).toBe(false);
      expect(current.reduceMotion).toBe('system');

      const raw = mockStore[SETTINGS_STORAGE_KEY];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed.textSize).toBe('large');
      expect(parsed.theme).toBe('dark');
    });

    it('recovers gracefully from corrupted JSON in localStorage', () => {
      mockStore[SETTINGS_STORAGE_KEY] = '{{corrupted json';
      const settings = getSettings();
      expect(settings).toBeDefined();
      expect(settings.textSize).toBe('normal');
    });

    it('handles localStorage throwing exceptions defensively without crashing', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Storage disabled');
          },
          setItem: () => {
            throw new Error('Storage disabled');
          },
        },
        writable: true,
        configurable: true,
      });

      expect(() => getSettings()).not.toThrow();
      expect(() => saveSettings({ textSize: 'xlarge' })).not.toThrow();
    });
  });

  describe('DOM Attribute Applicator', () => {
    it('sets correct data-attributes on the provided root element', () => {
      const mockAttrs: Record<string, string> = {};
      const mockElement = {
        setAttribute(name: string, val: string) {
          mockAttrs[name] = val;
        },
      } as unknown as HTMLElement;

      applySettingsToDOM(
        {
          textSize: 'large',
          dyslexicFont: true,
          theme: 'high-contrast',
          reduceMotion: 'reduce',
        },
        mockElement
      );

      expect(mockAttrs['data-text-size']).toBe('large');
      expect(mockAttrs['data-font']).toBe('dyslexic');
      expect(mockAttrs['data-theme']).toBe('high-contrast');
      expect(mockAttrs['data-reduce-motion']).toBe('reduce');
    });

    it('sets data-font="default" when dyslexicFont is false', () => {
      const mockAttrs: Record<string, string> = {};
      const mockElement = {
        setAttribute(name: string, val: string) {
          mockAttrs[name] = val;
        },
      } as unknown as HTMLElement;

      applySettingsToDOM(
        {
          textSize: 'normal',
          dyslexicFont: false,
          theme: 'light',
          reduceMotion: 'no-preference',
        },
        mockElement
      );

      expect(mockAttrs['data-font']).toBe('default');
      expect(mockAttrs['data-theme']).toBe('light');
      expect(mockAttrs['data-reduce-motion']).toBe('no-preference');
    });
  });

  describe('Web App Manifest Verification', () => {
    it('provides a valid web manifest with required PWA metadata and icons', () => {
      const fs = typeof require !== 'undefined' ? require('fs') : null;
      const path = typeof require !== 'undefined' ? require('path') : null;

      if (!fs || !path) {
        // In pure browser runner without fs
        return;
      }

      const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      expect(manifest.name).toContain('PickUp');
      expect(manifest.short_name).toBe('PickUp');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('./');
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

      const has192 = manifest.icons.some((icon: any) => icon.sizes === '192x192');
      const has512 = manifest.icons.some((icon: any) => icon.sizes === '512x512');
      expect(has192).toBe(true);
      expect(has512).toBe(true);
    });
  });
});
