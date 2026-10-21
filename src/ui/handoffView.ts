/**
 * Handoff Import View (Phase 5)
 *
 * Displays a read-only "Handed off to you" card from untrusted URL hash.
 * Security:
 * - All untrusted fields are rendered STRICTLY using .textContent
 * - Immunity to HTML injection and XSS
 * - "Make it mine" button imports into local storage
 */

import { announce } from '../lib/announce';
import { decodeCardFromHash, HandoffPayload } from '../lib/handoff';
import { createCard } from '../model/card';
import { saveCard } from '../storage';

export interface HandoffViewProps {
  container: HTMLElement;
  hash: string;
  onImportSuccess: () => void;
  onDismiss: () => void;
}

export function renderHandoffView({
  container,
  hash,
  onImportSuccess,
  onDismiss,
}: HandoffViewProps): void {
  container.innerHTML = '';

  const decoded = decodeCardFromHash(hash);

  if (!decoded) {
    renderInvalidHandoff(container, onDismiss);
    return;
  }

  renderValidHandoff(container, decoded, onImportSuccess, onDismiss);
}

function renderInvalidHandoff(container: HTMLElement, onDismiss: () => void): void {
  const cardSection = document.createElement('section');
  cardSection.className = 'card handoff-card';
  cardSection.setAttribute('aria-labelledby', 'handoff-invalid-heading');

  const heading = document.createElement('h1');
  heading.id = 'handoff-invalid-heading';
  heading.className = 'handoff-title';
  heading.textContent = 'Invalid or expired share link';

  const message = document.createElement('p');
  message.className = 'handoff-subtitle';
  message.textContent = 'This PickUp link could not be decoded safely or was modified. You can start fresh below.';

  const actionGroup = document.createElement('div');
  actionGroup.className = 'handoff-actions';

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'button button-primary button-large';
  dismissBtn.textContent = 'Go to PickUp';
  dismissBtn.addEventListener('click', () => {
    // Clear invalid hash from URL
    cleanUrlHash();
    onDismiss();
  });

  actionGroup.appendChild(dismissBtn);
  cardSection.appendChild(heading);
  cardSection.appendChild(message);
  cardSection.appendChild(actionGroup);

  container.appendChild(cardSection);
}

function renderValidHandoff(
  container: HTMLElement,
  payload: HandoffPayload,
  onImportSuccess: () => void,
  onDismiss: () => void
): void {
  const cardSection = document.createElement('section');
  cardSection.className = 'card handoff-card';
  cardSection.setAttribute('aria-labelledby', 'handoff-heading');

  // Header
  const header = document.createElement('header');
  header.className = 'handoff-header';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'handoff-badge-row';

  const badge = document.createElement('span');
  badge.className = 'badge badge-handoff';
  badge.textContent = 'Handed off to you';

  badgeRow.appendChild(badge);

  const title = document.createElement('h1');
  title.id = 'handoff-heading';
  title.className = 'handoff-title';
  title.textContent = 'Someone passed this spot to you';

  const subtitle = document.createElement('p');
  subtitle.className = 'handoff-subtitle';
  subtitle.textContent = 'Review where they were and what needs to happen next. Click "Make it mine" to adopt this task.';

  header.appendChild(badgeRow);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Content block with 3 cues - rendered strictly via textContent
  const cuesContainer = document.createElement('div');
  cuesContainer.className = 'handoff-cues-box';

  // 1. Where they were
  const whereBlock = document.createElement('div');
  whereBlock.className = 'cue-block';

  const whereLabel = document.createElement('span');
  whereLabel.className = 'cue-heading';
  whereLabel.textContent = '1. Where they were';

  const whereText = document.createElement('p');
  whereText.className = 'cue-content';
  whereText.textContent = payload.whereIWas; // Safe textContent

  whereBlock.appendChild(whereLabel);
  whereBlock.appendChild(whereText);
  cuesContainer.appendChild(whereBlock);

  // 2. Next 5-minute action
  const nextBlock = document.createElement('div');
  nextBlock.className = 'cue-block cue-block-next';

  const nextLabel = document.createElement('span');
  nextLabel.className = 'cue-heading cue-heading-next';
  nextLabel.textContent = '2. Next 5-minute action';

  const nextText = document.createElement('p');
  nextText.className = 'cue-content cue-content-next';
  nextText.textContent = payload.nextAction; // Safe textContent

  nextBlock.appendChild(nextLabel);
  nextBlock.appendChild(nextText);
  cuesContainer.appendChild(nextBlock);

  // 3. Waiting on (if any)
  if (payload.waitingOn) {
    const waitingBlock = document.createElement('div');
    waitingBlock.className = 'cue-block';

    const waitingLabel = document.createElement('span');
    waitingLabel.className = 'cue-heading';
    waitingLabel.textContent = '3. Waiting on';

    const waitingText = document.createElement('p');
    waitingText.className = 'cue-content';
    waitingText.textContent = payload.waitingOn; // Safe textContent

    waitingBlock.appendChild(waitingLabel);
    waitingBlock.appendChild(waitingText);
    cuesContainer.appendChild(waitingBlock);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'handoff-actions';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.id = 'btn-make-it-mine';
  importBtn.className = 'button button-primary button-large';
  importBtn.textContent = '★ Make it mine';

  importBtn.addEventListener('click', () => {
    // Import into recipient's local storage as active parked card
    const importedCard = createCard({
      whereIWas: payload.whereIWas,
      nextAction: payload.nextAction,
      waitingOn: payload.waitingOn,
      rawText: payload.rawText || payload.whereIWas,
      status: 'parked',
      source: 'manual',
    });

    saveCard(importedCard);
    cleanUrlHash();

    announce('Task imported to your PickUp! You can now resume it.');
    onImportSuccess();
  });

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.id = 'btn-dismiss-handoff';
  dismissBtn.className = 'button button-secondary';
  dismissBtn.textContent = 'Dismiss';

  dismissBtn.addEventListener('click', () => {
    cleanUrlHash();
    onDismiss();
  });

  actions.appendChild(dismissBtn);
  actions.appendChild(importBtn);

  cardSection.appendChild(header);
  cardSection.appendChild(cuesContainer);
  cardSection.appendChild(actions);

  container.appendChild(cardSection);
}

function cleanUrlHash(): void {
  try {
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch {
    // Ignore in constrained environments
  }
}
