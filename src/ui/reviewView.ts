/**
 * Review Card Screen (Phase 3)
 *
 * Provides a calm, accessible review screen where all three cues
 * (Where I was, Next 5-minute action, Waiting on) are editable before saving.
 *
 * Adheres to rule: Do not claim the tool "understands" the text.
 * Clearly labels cues as a deterministic heuristic draft.
 */

import { announce } from '../lib/announce';
import { ExtractedCues } from '../lib/cardBuilder';
import { createCard } from '../model/card';
import { saveCard } from '../storage';
import { clearDraft } from '../storage/draftStorage';

export interface ReviewProps {
  container: HTMLElement;
  rawText: string;
  cues: ExtractedCues;
  onBackToCapture: () => void;
  onCardSaved: (cardId: string) => void;
}

export function renderReviewView({
  container,
  rawText,
  cues,
  onBackToCapture,
  onCardSaved,
}: ReviewProps): void {
  container.innerHTML = `
    <section class="card review-card" aria-labelledby="review-heading">
      <header class="review-header">
        <h1 id="review-heading" class="review-title">Review your PickUp card</h1>
        <p class="review-subtitle">
          We extracted three cues using simple rules. Edit anything to match your exact train of thought.
        </p>
        <div class="rules-badge-row">
          <span class="badge badge-rules">Rule-based draft</span>
          <span class="rules-disclaimer">Heuristic breakdown — adjust freely before parking</span>
        </div>
      </header>

      <form id="review-form" class="review-form" novalidate>
        <!-- 1. Where I was -->
        <div class="form-field">
          <label for="review-where" class="field-label">
            1. Where was I?
          </label>
          <span id="desc-where" class="field-desc">
            The context or file/page you were working on right before the interruption.
          </span>
          <textarea
            id="review-where"
            name="whereIWas"
            class="review-textarea"
            rows="2"
            aria-describedby="desc-where"
            required
          >${escapeHtml(cues.whereIWas)}</textarea>
        </div>

        <!-- 2. Next 5-minute action -->
        <div class="form-field">
          <label for="review-next" class="field-label">
            2. Next 5-minute action
          </label>
          <span id="desc-next" class="field-desc">
            One small, concrete step you can do in five minutes to restart flow.
          </span>
          <textarea
            id="review-next"
            name="nextAction"
            class="review-textarea"
            rows="2"
            aria-describedby="desc-next"
            required
          >${escapeHtml(cues.nextAction)}</textarea>
        </div>

        <!-- 3. Waiting on (Optional) -->
        <div class="form-field">
          <label for="review-waiting" class="field-label">
            3. Waiting on <span class="label-optional">(optional)</span>
          </label>
          <span id="desc-waiting" class="field-desc">
            Anyone or anything you are waiting for before you can proceed.
          </span>
          <input
            type="text"
            id="review-waiting"
            name="waitingOn"
            class="review-input"
            value="${escapeHtml(cues.waitingOn)}"
            placeholder="e.g., Email reply from Sarah, CI build to pass"
            aria-describedby="desc-waiting"
          />
        </div>

        <!-- Action Buttons -->
        <div class="review-actions">
          <button
            type="button"
            id="btn-back-to-capture"
            class="button button-secondary"
          >
            ← Back to Note
          </button>
          <button
            type="submit"
            id="btn-save-reviewed-card"
            class="button button-primary button-large"
          >
            Save Card
          </button>
        </div>
      </form>
    </section>
  `;

  const form = container.querySelector<HTMLFormElement>('#review-form');
  const whereInput = container.querySelector<HTMLTextAreaElement>('#review-where');
  const nextInput = container.querySelector<HTMLTextAreaElement>('#review-next');
  const waitingInput = container.querySelector<HTMLInputElement>('#review-waiting');
  const backBtn = container.querySelector<HTMLButtonElement>('#btn-back-to-capture');

  if (!form || !whereInput || !nextInput || !waitingInput) return;

  // Autofocus the first field for immediate keyboard editing
  whereInput.focus();
  whereInput.setSelectionRange(whereInput.value.length, whereInput.value.length);

  // Handle Back
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      onBackToCapture();
    });
  }

  // Handle Submit
  form.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault();

    const whereVal = whereInput.value.trim();
    const nextVal = nextInput.value.trim();
    const waitingVal = waitingInput.value.trim();

    if (!whereVal) {
      whereInput.focus();
      announce('Please enter where you were before saving.');
      return;
    }

    if (!nextVal) {
      nextInput.focus();
      announce('Please enter your next 5-minute action before saving.');
      return;
    }

    const savedCard = createCard({
      rawText,
      whereIWas: whereVal,
      nextAction: nextVal,
      waitingOn: waitingVal || undefined,
      status: 'parked',
      source: 'rules',
    });

    saveCard(savedCard);
    clearDraft();

    announce('Card saved. Your spot is parked.');
    onCardSaved(savedCard.id);
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
