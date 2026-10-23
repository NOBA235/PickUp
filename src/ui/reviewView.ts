/**
 * Review Card Screen (Phases 3 & 8)
 *
 * Provides a calm, accessible review screen where all three cues
 * (Where I was, Next 5-minute action, Waiting on) are editable before saving.
 *
 * Phase 8 Enhancement:
 * - Shows "Made without AI" (default) or "Polished with AI" badge
 * - Clear privacy note when AI polish is requested
 * - Silently falls back to rule-based card if polish fails
 */

import { announce } from '../lib/announce';
import { polishCardWithAI } from '../lib/aiPolish';
import { ExtractedCues } from '../lib/cardBuilder';
import { CardSource, createCard } from '../model/card';
import { saveCard } from '../storage';
import { clearDraft } from '../storage/draftStorage';

export interface ReviewProps {
  container: HTMLElement;
  rawText: string;
  cues: ExtractedCues;
  source?: CardSource;
  onBackToCapture: () => void;
  onCardSaved: (cardId: string) => void;
}

export function renderReviewView({
  container,
  rawText,
  cues,
  source = 'rules',
  onBackToCapture,
  onCardSaved,
}: ReviewProps): void {
  let currentSource: CardSource = source;
  let currentCues = { ...cues };

  function renderContent(): void {
    const isAi = currentSource === 'ai';

    container.innerHTML = `
      <section class="card review-card" aria-labelledby="review-heading">
        <header class="review-header">
          <h1 id="review-heading" class="review-title">Review your PickUp card</h1>
          <p class="review-subtitle">
            ${
              isAi
                ? 'Your cues were polished with AI for maximum clarity. Adjust anything before parking.'
                : 'We extracted three cues using simple rules. Edit anything to match your exact train of thought.'
            }
          </p>
          <div class="rules-badge-row">
            <span id="review-badge-source" class="badge ${isAi ? 'badge-ai' : 'badge-rules'}">
              ${isAi ? 'Polished with AI' : 'Made without AI'}
            </span>
            <span id="review-badge-disclaimer" class="rules-disclaimer">
              ${
                isAi
                  ? 'AI-assisted phrasing &mdash; adjust freely before parking'
                  : 'Rule-based draft &mdash; 100% local on your device'
              }
            </span>
            ${
              !isAi
                ? `
              <button
                type="button"
                id="btn-try-ai-polish"
                class="btn btn-ghost"
                style="font-size: var(--text-xs); padding: var(--space-1) var(--space-2); min-height: 30px; text-decoration: underline;"
                title="Optional: Sends raw text to serverless endpoint to refine phrasing"
              >
                Polish with AI
              </button>
            `
                : ''
            }
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
            >${escapeHtml(currentCues.whereIWas)}</textarea>
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
            >${escapeHtml(currentCues.nextAction)}</textarea>
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
              value="${escapeHtml(currentCues.waitingOn || '')}"
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

    attachListeners();
  }

  function attachListeners(): void {
    const form = container.querySelector<HTMLFormElement>('#review-form');
    const whereInput = container.querySelector<HTMLTextAreaElement>('#review-where');
    const nextInput = container.querySelector<HTMLTextAreaElement>('#review-next');
    const waitingInput = container.querySelector<HTMLInputElement>('#review-waiting');
    const backBtn = container.querySelector<HTMLButtonElement>('#btn-back-to-capture');
    const tryPolishBtn = container.querySelector<HTMLButtonElement>('#btn-try-ai-polish');

    if (!form || !whereInput || !nextInput || !waitingInput) return;

    whereInput.focus();
    whereInput.setSelectionRange(whereInput.value.length, whereInput.value.length);

    if (backBtn) {
      backBtn.addEventListener('click', onBackToCapture);
    }

    if (tryPolishBtn) {
      tryPolishBtn.addEventListener('click', async () => {
        tryPolishBtn.disabled = true;
        tryPolishBtn.textContent = 'Polishing with AI...';
        announce('Polishing card with AI (sends text to server)...');

        const result = await polishCardWithAI(rawText, {
          whereIWas: whereInput.value.trim(),
          nextAction: nextInput.value.trim(),
          waitingOn: waitingInput.value.trim(),
        });

        currentCues = result.cues;
        currentSource = result.source;

        // Re-render to reflect new cues and source badge
        renderContent();

        if (result.source === 'ai') {
          announce('Card polished with AI.');
        } else {
          announce('AI polish unavailable. Kept rule-based card (Made without AI).');
        }
      });
    }

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
        source: currentSource,
      });

      saveCard(savedCard);
      clearDraft();

      announce('Card saved. Your spot is parked.');
      onCardSaved(savedCard.id);
    });
  }

  renderContent();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
