/**
 * Accessible Settings Dialog (Phase 6)
 * Modal settings controller allowing users to configure and immediately preview:
 * - Text size: normal (100%), large (112.5%), xlarge (125%)
 * - Dyslexia-friendly font & spacing stack
 * - Color theme: system default, light, dark, high-contrast (WCAG AAA)
 * - Motion preferences: follow system, reduce motion, allow motion
 *
 * Full keyboard navigation, focus trap, Escape to close, and polite live region feedback.
 */

import { announce } from '../lib/announce';
import {
  AppSettings,
  getSettings,
  saveSettings,
  TextSize,
  Theme,
  MotionPreference,
} from '../storage/settingsStorage';

let dialogElement: HTMLDialogElement | null = null;
let lastFocusedElement: HTMLElement | null = null;

/**
 * Creates and injects the accessible settings dialog into the DOM if not already present.
 */
export function initSettingsDialog(): HTMLDialogElement {
  if (dialogElement && document.body.contains(dialogElement)) {
    return dialogElement;
  }

  const existing = document.getElementById('settings-dialog') as HTMLDialogElement | null;
  if (existing) {
    dialogElement = existing;
    return dialogElement;
  }

  const dialog = document.createElement('dialog');
  dialog.id = 'settings-dialog';
  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-dialog-title');
  dialog.setAttribute('aria-modal', 'true');

  dialog.innerHTML = `
    <div class="settings-header">
      <h2 id="settings-dialog-title" class="settings-title">Display & Accessibility</h2>
      <button type="button" id="btn-close-settings-x" class="btn btn-ghost" aria-label="Close settings dialog">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    <form method="dialog" id="settings-form" class="settings-form">
      <!-- 1. Text Size -->
      <fieldset class="settings-fieldset">
        <legend class="settings-legend">Text Size</legend>
        <div class="settings-options-group" role="radiogroup" aria-label="Text size scale">
          <label class="settings-radio-label">
            <input type="radio" name="text-size" value="normal" />
            <span>Normal (100%)</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="text-size" value="large" />
            <span>Large (112.5%)</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="text-size" value="xlarge" />
            <span>Extra Large (125%)</span>
          </label>
        </div>
      </fieldset>

      <!-- 2. Reading Comfort (Dyslexia-friendly stack) -->
      <fieldset class="settings-fieldset">
        <legend class="settings-legend">Reading Comfort</legend>
        <label class="settings-checkbox-label">
          <input type="checkbox" id="setting-dyslexic-font" name="dyslexic-font" />
          <span>Dyslexia-friendly font & spacing</span>
        </label>
        <p class="settings-hint">
          Increases letter spacing, word spacing, and line height with high-legibility letterforms. Zero external network requests.
        </p>
      </fieldset>

      <!-- 3. Color Theme -->
      <fieldset class="settings-fieldset">
        <legend class="settings-legend">Color Theme</legend>
        <div class="settings-options-group" role="radiogroup" aria-label="Color theme">
          <label class="settings-radio-label">
            <input type="radio" name="color-theme" value="system" />
            <span>Follow system</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="color-theme" value="light" />
            <span>Light</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="color-theme" value="dark" />
            <span>Dark</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="color-theme" value="high-contrast" />
            <span>High Contrast (WCAG AAA)</span>
          </label>
        </div>
      </fieldset>

      <!-- 4. Motion Preference -->
      <fieldset class="settings-fieldset">
        <legend class="settings-legend">Motion & Transitions</legend>
        <div class="settings-options-group" role="radiogroup" aria-label="Motion preference">
          <label class="settings-radio-label">
            <input type="radio" name="motion-pref" value="system" />
            <span>Follow system setting</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="motion-pref" value="reduce" />
            <span>Reduce motion (turn off animations)</span>
          </label>
          <label class="settings-radio-label">
            <input type="radio" name="motion-pref" value="no-preference" />
            <span>Allow animations</span>
          </label>
        </div>
      </fieldset>

      <div class="settings-actions">
        <button type="submit" id="btn-close-settings-done" class="btn btn-primary">Done</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);
  dialogElement = dialog;

  // Wire events
  wireDialogEvents(dialog);

  return dialog;
}

/**
 * Syncs the form inputs with currently persisted settings.
 */
function syncFormWithSettings(dialog: HTMLDialogElement, settings: AppSettings): void {
  // Text size radios
  const textSizeInputs = dialog.querySelectorAll<HTMLInputElement>('input[name="text-size"]');
  textSizeInputs.forEach((input) => {
    input.checked = input.value === settings.textSize;
  });

  // Dyslexic font checkbox
  const dyslexicCheckbox = dialog.querySelector<HTMLInputElement>('#setting-dyslexic-font');
  if (dyslexicCheckbox) {
    dyslexicCheckbox.checked = settings.dyslexicFont;
  }

  // Color theme radios
  const themeInputs = dialog.querySelectorAll<HTMLInputElement>('input[name="color-theme"]');
  themeInputs.forEach((input) => {
    input.checked = input.value === settings.theme;
  });

  // Motion preference radios
  const motionInputs = dialog.querySelectorAll<HTMLInputElement>('input[name="motion-pref"]');
  motionInputs.forEach((input) => {
    input.checked = input.value === settings.reduceMotion;
  });
}

function wireDialogEvents(dialog: HTMLDialogElement): void {
  const form = dialog.querySelector<HTMLFormElement>('#settings-form');
  const btnCloseX = dialog.querySelector<HTMLButtonElement>('#btn-close-settings-x');

  // Live change updates
  if (form) {
    form.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (!target) return;

      if (target.name === 'text-size') {
        saveSettings({ textSize: target.value as TextSize });
      } else if (target.id === 'setting-dyslexic-font') {
        saveSettings({ dyslexicFont: target.checked });
      } else if (target.name === 'color-theme') {
        saveSettings({ theme: target.value as Theme });
      } else if (target.name === 'motion-pref') {
        saveSettings({ reduceMotion: target.value as MotionPreference });
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeSettingsDialog();
    });
  }

  if (btnCloseX) {
    btnCloseX.addEventListener('click', () => {
      closeSettingsDialog();
    });
  }

  // Native cancel (Escape key)
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeSettingsDialog();
  });

  // Close when clicking outside on backdrop
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeSettingsDialog();
    }
  });
}

/**
 * Opens the settings modal dialog with proper focus management and accessibility attributes.
 */
export function openSettingsDialog(triggerButton?: HTMLElement | null): void {
  const dialog = initSettingsDialog();
  lastFocusedElement = triggerButton || (document.activeElement as HTMLElement | null);

  syncFormWithSettings(dialog, getSettings());

  if (triggerButton) {
    triggerButton.setAttribute('aria-expanded', 'true');
  }

  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }

  // Focus the first radio input or close button
  const firstInput = dialog.querySelector<HTMLInputElement>('input[type="radio"]:checked') ||
    dialog.querySelector<HTMLInputElement>('input');
  if (firstInput) {
    firstInput.focus();
  }
}

/**
 * Closes the settings modal dialog, returns focus, and announces saved state.
 */
export function closeSettingsDialog(): void {
  if (!dialogElement) return;

  if (dialogElement.hasAttribute('open')) {
    if (typeof dialogElement.close === 'function') {
      dialogElement.close();
    } else {
      dialogElement.removeAttribute('open');
    }
  }

  // Reset trigger button aria-expanded
  const navBtnSettings = document.getElementById('nav-btn-settings');
  if (navBtnSettings) {
    navBtnSettings.setAttribute('aria-expanded', 'false');
  }

  // Restore focus to opener
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }

  announce('Settings saved.');
}
