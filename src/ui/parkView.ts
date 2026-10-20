/**
 * Park It Capture View Component (Phase 2)
 *
 * Implements:
 * - Single capture screen with one large "Park it" primary action
 * - Properly labelled textarea with draft autosave
 * - Feature-detected Web Speech API with plain-text fallback explanation
 * - Keyboard shortcuts (Ctrl+Enter / Cmd+Enter)
 * - aria-live announcements and stub confirmation
 */

import { announce } from '../lib/announce';
import { createSpeechRecognizer, isSpeechRecognitionSupported, SpeechRecognizer } from '../lib/speech';
import { createCard } from '../model/card';
import { getLatestParked, saveCard } from '../storage';
import { clearDraft, getDraft, saveDraft } from '../storage/draftStorage';

export function renderParkView(container: HTMLElement): void {
  // Check if a parked note exists to show persistent state across refresh
  const latestParked = getLatestParked();

  // If a parked card exists and user didn't request a fresh capture, show parked confirmation
  const isFreshCaptureRequested = container.dataset.viewState === 'capture';

  if (latestParked && !isFreshCaptureRequested) {
    renderConfirmation(container, latestParked.rawText, latestParked.createdAt);
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
              Press <kbd class="kbd-badge">Ctrl</kbd>+<kbd class="kbd-badge">Enter</kbd> (or <kbd class="kbd-badge">Cmd</kbd>+<kbd class="kbd-badge">Enter</kbd>) to park
            </span>
            <span id="speech-status" class="speech-status" role="status" aria-live="polite"></span>
          </div>
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
  let usedVoice = false;
  let recognizer: SpeechRecognizer | null = null;

  if (voiceBtn && voiceLabel && speechStatus) {
    recognizer = createSpeechRecognizer({
      onTranscript: (transcript: string, isFinal: boolean) => {
        usedVoice = true;
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

  // Handle Form Submission
  form.addEventListener('submit', (event: SubmitEvent) => {
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

    // Create card with empty fields for now as per Phase 2 requirements
    const newCard = createCard({
      rawText,
      whereIWas: '',
      nextAction: '',
      waitingOn: '',
      source: usedVoice ? 'rules' : 'manual',
      status: 'parked',
    });

    saveCard(newCard);
    clearDraft();

    // Announce confirmation via aria-live
    announce('Task parked successfully. Your note has been saved.');

    // Transition to confirmation view
    delete container.dataset.viewState;
    renderConfirmation(container, rawText, newCard.createdAt);
  });
}

function renderConfirmation(container: HTMLElement, rawText: string, createdAt: number): void {
  const timeFormatted = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <section class="card confirmation-card" aria-labelledby="confirmation-heading" tabindex="-1">
      <div class="confirmation-icon-container" aria-hidden="true">
        <span class="confirmation-check">✓</span>
      </div>

      <header class="confirmation-header">
        <h1 id="confirmation-heading" class="confirmation-title">Parked! Your spot is saved.</h1>
        <p class="confirmation-subtitle">
          You can safely close this tab or step away. PickUp has bookmarked your place.
        </p>
      </header>

      <div class="parked-spot-card">
        <div class="parked-badge-row">
          <span class="badge badge-parked">Parked Spot</span>
          <time class="parked-time" datetime="${new Date(createdAt).toISOString()}">${timeFormatted}</time>
        </div>
        <div class="parked-text-content">
          <p class="parked-raw-text">${escapeHtml(rawText)}</p>
        </div>
      </div>

      <div class="confirmation-actions">
        <button type="button" id="btn-park-another" class="button button-primary button-large">
          Park Another Task
        </button>
      </div>
    </section>
  `;

  // Focus the confirmation card for screen readers and keyboard users
  const card = container.querySelector<HTMLElement>('.confirmation-card');
  if (card) {
    card.focus();
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
