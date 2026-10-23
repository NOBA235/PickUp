/**
 * Park It Capture View Component (Phases 2 & 3)
 *
 * Implements:
 * - Single capture screen with one large "Park it" primary action
 * - Properly labelled textarea with draft autosave
 * - Feature-detected Web Speech API with plain-text fallback explanation
 * - Keyboard shortcuts (Ctrl+Enter / Cmd+Enter)
 * - Deterministic cue extraction and Review screen before saving
 * - aria-live announcements and full card confirmation
 */

import { announce } from '../lib/announce';
import { polishCardWithAI } from '../lib/aiPolish';
import { extractCardCues } from '../lib/cardBuilder';
import { createSpeechRecognizer, isSpeechRecognitionSupported, SpeechRecognizer } from '../lib/speech';
import { Card, CardSource } from '../model/card';
import { getLatestParked } from '../storage';
import { getDraft, saveDraft } from '../storage/draftStorage';
import { renderReviewView } from './reviewView';

export function renderParkView(container: HTMLElement): void {
  // Check if a parked note exists to show persistent state across refresh
  const latestParked = getLatestParked();

  // If a parked card exists and user didn't request a fresh capture, show parked confirmation
  const isFreshCaptureRequested = container.dataset.viewState === 'capture';

  if (latestParked && !isFreshCaptureRequested) {
    renderConfirmation(container, latestParked);
    return;
  }

  renderCaptureForm(container);
}

function renderCaptureForm(container: HTMLElement): void {
  const speechSupported = isSpeechRecognitionSupported();
  const savedDraft = getDraft();

  container.innerHTML = `
    <section class="card park-card" aria-labelledby="park-heading">
      <header class="park-card-header">
        <h1 id="park-heading" class="park-title">Park what you're doing</h1>
        <p class="park-subtitle">
          Take 10 seconds to dump your thoughts before switching tasks. No need to make it neat.
        </p>
      </header>

      <form id="park-form" class="park-form" novalidate>
        <div class="form-field">
          <label for="park-textarea" class="field-label">
            What's on your mind right now?
          </label>
          <div class="textarea-container">
            <textarea
              id="park-textarea"
              name="rawText"
              class="park-textarea"
              rows="5"
              placeholder="e.g., Reading chapter 4 on page 82. Next step is taking notes on synaptic plasticity..."
              aria-describedby="park-hint speech-status"
              required
            >${escapeHtml(savedDraft)}</textarea>
          </div>
          <div class="field-footer">
            <span id="park-hint" class="field-hint">
              Press <kbd class="kbd-badge">Ctrl</kbd>+<kbd class="kbd-badge">Enter</kbd> (or <kbd class="kbd-badge">Cmd</kbd>+<kbd class="kbd-badge">Enter</kbd>) to review & park
            </span>
            <span id="speech-status" class="speech-status" role="status" aria-live="polite"></span>
          </div>
        </div>

        <div class="ai-polish-toggle-box" style="margin-top: var(--space-3); margin-bottom: var(--space-4); padding: var(--space-2) var(--space-3); background-color: var(--color-bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--color-border-subtle);">
          <label class="settings-checkbox-label" for="toggle-ai-polish" style="min-height: auto; padding: 0;">
            <input type="checkbox" id="toggle-ai-polish" name="useAiPolish" />
            <span style="font-weight: 600;">Use AI to polish (sends your text to a server)</span>
          </label>
          <p class="settings-hint" style="margin-left: 28px; margin-top: var(--space-1);">
            Optional: When checked, your note is sent to a serverless endpoint to refine phrasing. When unchecked, your card is built 100% locally on this device using deterministic rules.
          </p>
        </div>

        <div class="actions-group">
          ${
            speechSupported
              ? `
            <button
              type="button"
              id="btn-voice-input"
              class="button button-secondary button-voice"
              aria-label="Start voice dictation"
              aria-pressed="false"
            >
              <span class="mic-icon" aria-hidden="true">🎙️</span>
              <span id="voice-btn-label">Speak</span>
            </button>
          `
              : `
            <p class="speech-fallback-note" id="speech-unsupported-note">
              Voice input is not supported in this browser. You can type directly into the box.
            </p>
          `
          }

          <button
            type="submit"
            id="btn-park-submit"
            class="button button-primary button-large"
          >
            Park It
          </button>
        </div>
      </form>
    </section>
  `;

  attachFormHandlers(container);
}

function attachFormHandlers(container: HTMLElement): void {
  const form = container.querySelector<HTMLFormElement>('#park-form');
  const textarea = container.querySelector<HTMLTextAreaElement>('#park-textarea');
  const voiceBtn = container.querySelector<HTMLButtonElement>('#btn-voice-input');
  const voiceLabel = container.querySelector<HTMLElement>('#voice-btn-label');
  const speechStatus = container.querySelector<HTMLElement>('#speech-status');

  if (!form || !textarea) return;

  // Autofocus textarea for immediate keyboard usability
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  // Autosave draft on typing
  textarea.addEventListener('input', () => {
    saveDraft(textarea.value);
  });

  // Ctrl+Enter / Cmd+Enter submission shortcut
  textarea.addEventListener('keydown', (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      // Guard against IME composition
      if (event.isComposing) {
        return;
      }
      event.preventDefault();
      form.requestSubmit();
    }
  });

  // Setup Web Speech API if supported
  let recognizer: SpeechRecognizer | null = null;

  if (voiceBtn && voiceLabel && speechStatus) {
    recognizer = createSpeechRecognizer({
      onTranscript: (transcript: string, isFinal: boolean) => {
        const currentVal = textarea.value.trim();
        const prefix = currentVal ? currentVal + ' ' : '';
        textarea.value = prefix + transcript;
        saveDraft(textarea.value);
        if (isFinal) {
          speechStatus.textContent = 'Voice captured.';
        }
      },
      onListeningChange: (isListening: boolean) => {
        voiceBtn.setAttribute('aria-pressed', isListening ? 'true' : 'false');
        voiceBtn.classList.toggle('is-listening', isListening);
        voiceLabel.textContent = isListening ? 'Listening...' : 'Speak';
        speechStatus.textContent = isListening ? 'Listening... Speak your thought.' : '';
        announce(isListening ? 'Microphone listening. Speak now.' : 'Microphone stopped.');
      },
      onError: (errorMessage: string) => {
        speechStatus.textContent = errorMessage;
        announce(errorMessage);
      },
    });

    voiceBtn.addEventListener('click', () => {
      recognizer?.toggle();
    });
  }

  // Handle Form Submission -> Transitions to Review Screen (Phase 3 & Phase 8)
  form.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();

    const rawText = textarea.value.trim();
    if (!rawText) {
      textarea.focus();
      if (speechStatus) {
        speechStatus.textContent = 'Please enter what you were doing before parking.';
      }
      announce('Please enter what you were doing before parking.');
      return;
    }

    // Stop microphone if still active
    if (recognizer?.isListening) {
      recognizer.stop();
    }

    const useAiToggle = form.querySelector<HTMLInputElement>('#toggle-ai-polish');
    const isAiRequested = Boolean(useAiToggle?.checked);

    // Initial deterministic extraction via rules
    const ruleCues = extractCardCues(rawText);

    let finalCues = ruleCues;
    let source: CardSource = 'rules';

    if (isAiRequested) {
      const submitBtn = form.querySelector<HTMLButtonElement>('#btn-park-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Polishing with AI...';
      }
      announce('Polishing card with AI (sends text to server)...');

      const polishResult = await polishCardWithAI(rawText, ruleCues);
      finalCues = polishResult.cues;
      source = polishResult.source;
    } else {
      announce('Note parsed using rules. Please review your card before saving.');
    }

    // Transition to Review View where all 3 fields are editable
    renderReviewView({
      container,
      rawText,
      cues: finalCues,
      source,
      onBackToCapture: () => {
        renderCaptureForm(container);
      },
      onCardSaved: () => {
        delete container.dataset.viewState;
        const latest = getLatestParked();
        if (latest) {
          renderConfirmation(container, latest);
        }
      },
    });
  });
}

function renderConfirmation(container: HTMLElement, card: Card): void {
  const timeFormatted = new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <section class="card confirmation-card" aria-labelledby="confirmation-heading" tabindex="-1">
      <div class="confirmation-icon-container" aria-hidden="true">
        <span class="confirmation-check">✓</span>
      </div>

      <header class="confirmation-header">
        <h1 id="confirmation-heading" class="confirmation-title">Parked! Your spot is saved.</h1>
        <p class="confirmation-subtitle">
          You can safely step away or switch tasks. PickUp has bookmarked your place.
        </p>
      </header>

      <div class="parked-spot-card">
        <div class="parked-badge-row">
          <span class="badge ${card.source === 'ai' ? 'badge-ai' : 'badge-rules'}">
            ${card.source === 'ai' ? 'Polished with AI' : 'Made without AI'}
          </span>
          <span class="badge badge-parked">Parked Card</span>
          <time class="parked-time" datetime="${new Date(card.createdAt).toISOString()}">${timeFormatted}</time>
        </div>

        <!-- 3 Structured Cues -->
        <div class="card-cues-display">
          <div class="cue-item">
            <span class="cue-label">Where I was:</span>
            <p class="cue-value">${escapeHtml(card.whereIWas || card.rawText)}</p>
          </div>

          <div class="cue-item cue-item-next">
            <span class="cue-label">Next 5-minute action:</span>
            <p class="cue-value cue-value-next">${escapeHtml(card.nextAction || 'Spend 5 minutes re-reading notes')}</p>
          </div>

          ${
            card.waitingOn
              ? `
            <div class="cue-item">
              <span class="cue-label">Waiting on:</span>
              <p class="cue-value cue-value-waiting">${escapeHtml(card.waitingOn)}</p>
            </div>
          `
              : ''
          }
        </div>

        ${
          card.rawText && card.rawText !== card.whereIWas
            ? `
          <details class="raw-note-toggle">
            <summary class="raw-note-summary">View original note</summary>
            <p class="raw-note-text">${escapeHtml(card.rawText)}</p>
          </details>
        `
            : ''
        }
      </div>

      <div class="confirmation-actions">
        <button type="button" id="btn-resume-now" class="button button-primary button-large">
          Resume with 2-Min Warm-Up →
        </button>
        <button type="button" id="btn-park-another" class="button button-secondary">
          Park Another Task
        </button>
      </div>
    </section>
  `;

  // Focus the confirmation card for screen readers and keyboard users
  const cardEl = container.querySelector<HTMLElement>('.confirmation-card');
  if (cardEl) {
    cardEl.focus();
  }

  // Handle "Resume Now" action
  const resumeNowBtn = container.querySelector<HTMLButtonElement>('#btn-resume-now');
  if (resumeNowBtn) {
    resumeNowBtn.addEventListener('click', () => {
      const resumeNavBtn = document.getElementById('nav-btn-resume');
      if (resumeNavBtn) {
        resumeNavBtn.click();
      }
    });
  }

  // Handle "Park Another Task" action
  const parkAnotherBtn = container.querySelector<HTMLButtonElement>('#btn-park-another');
  if (parkAnotherBtn) {
    parkAnotherBtn.addEventListener('click', () => {
      container.dataset.viewState = 'capture';
      renderCaptureForm(container);
      announce('Capture form ready. Enter what you were doing.');
    });
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

