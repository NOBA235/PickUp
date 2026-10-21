/**
 * Resume Screen Component (Phase 4)
 *
 * Implements:
 * - Single-purpose screen showing only the latest parked card in large, clearly labelled sections
 * - 2-minute warm-up timer with the copy "Just start for 2 minutes. You can stop after."
 * - Start, pause, and reset timer controls
 * - Announce via aria-live ONLY at start and end, never every second
 * - No audio by default
 * - Actions: "I'm back at it", "Done", "Park again"
 * - Earlier cards in a collapsed list (max 3 visible)
 * - Friendly empty state when no cards are parked
 */

import { announce } from '../lib/announce';
import { createWarmupTimer, WarmupTimer } from '../lib/timer';
import { Card } from '../model/card';
import { getLatestParked, listCards, updateCard } from '../storage';

export interface ResumeViewOptions {
  container: HTMLElement;
  onNavigateToPark: () => void;
}

let activeTimer: WarmupTimer | null = null;

export function renderResumeView({ container, onNavigateToPark }: ResumeViewOptions): void {
  // Clean up any previously running timer
  if (activeTimer) {
    activeTimer.destroy();
    activeTimer = null;
  }

  const latestCard = getLatestParked();
  const allCards = listCards();
  const earlierCards = latestCard
    ? allCards.filter((c) => c.id !== latestCard.id).slice(0, 3)
    : allCards.slice(0, 3);

  if (!latestCard) {
    renderEmptyState(container, earlierCards, onNavigateToPark);
    return;
  }

  renderActiveResume(container, latestCard, earlierCards, onNavigateToPark);
}

function renderEmptyState(
  container: HTMLElement,
  earlierCards: Card[],
  onNavigateToPark: () => void
): void {
  container.innerHTML = `
    <section class="card empty-state-card" aria-labelledby="empty-heading">
      <div class="empty-icon" aria-hidden="true">🌱</div>
      <h1 id="empty-heading" class="empty-title">Nothing parked right now</h1>
      <p class="empty-description">
        When you get interrupted or need to step away, park your task here so you can pick it right back up without losing context.
      </p>

      <div class="empty-actions">
        <button type="button" id="btn-empty-park" class="button button-primary button-large">
          Park a Task
        </button>
      </div>

      ${renderEarlierCardsAccordion(earlierCards)}
    </section>
  `;

  const parkBtn = container.querySelector<HTMLButtonElement>('#btn-empty-park');
  if (parkBtn) {
    parkBtn.addEventListener('click', onNavigateToPark);
  }
}

function renderActiveResume(
  container: HTMLElement,
  card: Card,
  earlierCards: Card[],
  onNavigateToPark: () => void
): void {
  const timeFormatted = new Date(card.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  container.innerHTML = `
    <section class="resume-screen" aria-labelledby="resume-heading">
      <!-- Header -->
      <header class="resume-header">
        <div class="resume-title-row">
          <h1 id="resume-heading" class="resume-title">Resume your spot</h1>
          <span class="badge badge-parked">Parked at ${timeFormatted}</span>
        </div>
        <p class="resume-subtitle">
          PickUp held your place. Review your 3 cues and warm up your focus below.
        </p>
      </header>

      <!-- Large Clearly Labelled Cues -->
      <div class="card resume-card">
        <!-- 1. Where I was -->
        <div class="cue-block">
          <span class="cue-heading">1. Where I was</span>
          <p class="cue-content cue-content-where">${escapeHtml(card.whereIWas || card.rawText)}</p>
        </div>

        <!-- 2. Next 5-minute action -->
        <div class="cue-block cue-block-next">
          <span class="cue-heading cue-heading-next">2. Next 5-minute action</span>
          <p class="cue-content cue-content-next">${escapeHtml(card.nextAction || 'Spend 5 minutes re-reading notes')}</p>
        </div>

        <!-- 3. Waiting on -->
        ${
          card.waitingOn
            ? `
          <div class="cue-block">
            <span class="cue-heading">3. Waiting on</span>
            <p class="cue-content cue-content-waiting">${escapeHtml(card.waitingOn)}</p>
          </div>
        `
            : ''
        }

        ${
          card.rawText && card.rawText !== card.whereIWas
            ? `
          <details class="raw-note-toggle">
            <summary class="raw-note-summary">Inspect original note</summary>
            <p class="raw-note-text">${escapeHtml(card.rawText)}</p>
          </details>
        `
            : ''
        }
      </div>

      <!-- 2-Minute Warm-up Timer -->
      <div class="card warmup-card" aria-labelledby="timer-title">
        <div class="warmup-header">
          <h2 id="timer-title" class="warmup-title">2-Minute Warm-Up</h2>
          <p class="warmup-copy">"Just start for 2 minutes. You can stop after."</p>
        </div>

        <div class="timer-wrapper">
          <div
            id="timer-display"
            class="timer-digits"
            role="timer"
            aria-label="2-minute warm-up countdown"
          >
            02:00
          </div>
          <div class="timer-controls">
            <button
              type="button"
              id="btn-timer-toggle"
              class="button button-primary button-timer"
              aria-label="Start 2-minute warm-up timer"
            >
              Start 2 Minutes
            </button>
            <button
              type="button"
              id="btn-timer-reset"
              class="button button-secondary button-timer"
              aria-label="Reset timer to 2 minutes"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="resume-actions-group">
        <button
          type="button"
          id="btn-back-at-it"
          class="button button-primary button-large"
        >
          ✓ I'm back at it
        </button>

        <button
          type="button"
          id="btn-mark-done"
          class="button button-secondary button-large"
        >
          Done
        </button>

        <button
          type="button"
          id="btn-park-again"
          class="button button-secondary"
        >
          Park again
        </button>
      </div>

      <!-- Earlier Cards Collapsed List (Max 3) -->
      ${renderEarlierCardsAccordion(earlierCards)}
    </section>
  `;

  setupTimerAndActions(container, card, onNavigateToPark);
}

function setupTimerAndActions(
  container: HTMLElement,
  card: Card,
  onNavigateToPark: () => void
): void {
  const timerDisplay = container.querySelector<HTMLElement>('#timer-display');
  const timerToggleBtn = container.querySelector<HTMLButtonElement>('#btn-timer-toggle');
  const timerResetBtn = container.querySelector<HTMLButtonElement>('#btn-timer-reset');

  const backAtItBtn = container.querySelector<HTMLButtonElement>('#btn-back-at-it');
  const markDoneBtn = container.querySelector<HTMLButtonElement>('#btn-mark-done');
  const parkAgainBtn = container.querySelector<HTMLButtonElement>('#btn-park-again');

  if (!timerDisplay || !timerToggleBtn || !timerResetBtn) return;

  activeTimer = createWarmupTimer(120, {
    onTick: (_secs, formatted) => {
      timerDisplay.textContent = formatted;
      // Do NOT announce every tick on aria-live as required
    },
    onComplete: () => {
      timerDisplay.textContent = '00:00';
      timerToggleBtn.textContent = 'Start 2 Minutes';
      timerToggleBtn.setAttribute('aria-label', 'Start 2-minute warm-up timer');
      announce("Two minutes are up. You've officially restarted. Keep going or take a break!");
    },
    onStateChange: (isRunning) => {
      timerToggleBtn.textContent = isRunning ? 'Pause' : 'Start 2 Minutes';
      timerToggleBtn.setAttribute(
        'aria-label',
        isRunning ? 'Pause warm-up timer' : 'Start 2-minute warm-up timer'
      );
      if (isRunning) {
        announce('2-minute warm-up timer started. Just start for 2 minutes. You can stop after.');
      }
    },
  });

  timerToggleBtn.addEventListener('click', () => {
    activeTimer?.toggle();
  });

  timerResetBtn.addEventListener('click', () => {
    activeTimer?.reset();
  });

  // Action: "I'm back at it"
  if (backAtItBtn) {
    backAtItBtn.addEventListener('click', () => {
      activeTimer?.pause();
      updateCard(card.id, { status: 'resumed' });
      announce("Welcome back! Task marked as resumed.");
      renderResumeView({ container, onNavigateToPark });
    });
  }

  // Action: "Done"
  if (markDoneBtn) {
    markDoneBtn.addEventListener('click', () => {
      activeTimer?.pause();
      updateCard(card.id, { status: 'done' });
      announce('Task marked as complete.');
      renderResumeView({ container, onNavigateToPark });
    });
  }

  // Action: "Park again"
  if (parkAgainBtn) {
    parkAgainBtn.addEventListener('click', () => {
      activeTimer?.pause();
      onNavigateToPark();
    });
  }
}

function renderEarlierCardsAccordion(cards: Card[]): string {
  if (!cards || cards.length === 0) {
    return '';
  }

  return `
    <details class="earlier-cards-accordion">
      <summary class="earlier-summary">
        Earlier cards (${cards.length})
      </summary>
      <div class="earlier-cards-list">
        ${cards
          .map((c) => {
            const dateStr = new Date(c.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });
            const statusLabel =
              c.status === 'done' ? 'Done' : c.status === 'resumed' ? 'Resumed' : 'Parked';
            const statusBadgeClass = `badge-status-${c.status}`;

            return `
            <div class="earlier-card-item">
              <div class="earlier-card-header">
                <span class="badge ${statusBadgeClass}">${statusLabel}</span>
                <span class="earlier-date">${dateStr}</span>
              </div>
              <p class="earlier-where">${escapeHtml(c.whereIWas || c.rawText)}</p>
              ${
                c.nextAction
                  ? `<p class="earlier-next"><strong>Next:</strong> ${escapeHtml(c.nextAction)}</p>`
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </div>
    </details>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
