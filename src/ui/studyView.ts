/**
 * Study & Evidence View (Phase 7)
 * Hidden researcher-facing interface accessed via ?study=1.
 * Features:
 * - High-precision interruption stopwatch
 * - Participant code (strictly anonymous, no names)
 * - Condition toggle (With PickUp vs Without PickUp)
 * - Subjective disorientation rating (1-5 Likert scale)
 * - Summary statistics comparison
 * - Local results table with row deletion & clear-all
 * - 100% on-device CSV export
 */

import { announce } from '../lib/announce';
import { Stopwatch } from '../lib/stopwatch';
import {
  calculateStudyStats,
  formatTrialsAsCSV,
  StudyCondition,
} from '../model/study';
import {
  clearAllStudyTrials,
  deleteStudyTrial,
  getStudyTrials,
  saveStudyTrial,
} from '../storage/studyStorage';

export interface StudyViewOptions {
  container: HTMLElement;
  onExitStudy?: () => void;
}

export function renderStudyView(options: StudyViewOptions): void {
  const { container, onExitStudy } = options;

  container.innerHTML = `
    <div class="study-container">
      <div class="study-header">
        <div class="study-badge-row">
          <span class="badge-study">Researcher View • ?study=1</span>
        </div>
        <h1 class="study-title">Evidence & User Study Mode</h1>
        <p class="study-subtitle">
          Measure task resumption latency after an interruption. Compare baseline performance against PickUp. All data is kept 100% local on this device.
        </p>
      </div>

      <div class="study-grid">
        <!-- Card 1: Researcher Stopwatch -->
        <section class="study-card stopwatch-card" aria-labelledby="stopwatch-heading">
          <h2 id="stopwatch-heading" class="stopwatch-title">Interruption Resume Stopwatch</h2>
          <div id="stopwatch-readout" class="stopwatch-display" aria-live="off">00:00.0</div>
          <div class="stopwatch-controls">
            <button type="button" id="btn-stopwatch-toggle" class="btn btn-primary" style="min-width: 140px;">
              Start Timing
            </button>
            <button type="button" id="btn-stopwatch-reset" class="btn btn-secondary">
              Reset
            </button>
          </div>
          <p class="settings-hint">
            Start when participant returns from interruption; pause on their first meaningful work action.
          </p>
        </section>

        <!-- Card 2: Trial Recording Form -->
        <section class="study-card" aria-labelledby="trial-form-heading">
          <h2 id="trial-form-heading" class="stat-label">Record Trial Data</h2>
          <form id="study-trial-form" class="study-form">
            <div class="study-field-group">
              <label for="study-participant-code" class="study-label">Participant Code</label>
              <input
                type="text"
                id="study-participant-code"
                class="study-input"
                placeholder="e.g. P01"
                maxlength="12"
                required
              />
              <span class="settings-hint">Strictly anonymous code only. Do not use names or emails.</span>
            </div>

            <div class="study-field-group">
              <span class="study-label">Condition</span>
              <div class="settings-options-group" role="radiogroup" aria-label="Test condition">
                <label class="settings-radio-label">
                  <input type="radio" name="study-condition" value="with_pickup" checked />
                  <span>With PickUp (Intervention)</span>
                </label>
                <label class="settings-radio-label">
                  <input type="radio" name="study-condition" value="without_pickup" />
                  <span>Without PickUp (Control / Baseline)</span>
                </label>
              </div>
            </div>

            <div class="study-field-group">
              <label for="study-resume-seconds" class="study-label">Resume Latency (seconds)</label>
              <input
                type="number"
                id="study-resume-seconds"
                class="study-input"
                placeholder="e.g. 15.4"
                step="0.1"
                min="0.1"
                required
              />
              <span class="settings-hint">Auto-filled when stopwatch is paused, or enter manually.</span>
            </div>

            <div class="study-field-group">
              <span class="study-label">Subjective Disorientation ("How lost did you feel?")</span>
              <div class="settings-options-group" role="radiogroup" aria-label="Disorientation rating">
                <label class="settings-radio-label">
                  <input type="radio" name="study-lost" value="1" checked />
                  <span>1 - Not at all lost (instantly resumed)</span>
                </label>
                <label class="settings-radio-label">
                  <input type="radio" name="study-lost" value="2" />
                  <span>2 - Slight hesitation</span>
                </label>
                <label class="settings-radio-label">
                  <input type="radio" name="study-lost" value="3" />
                  <span>3 - Moderately lost</span>
                </label>
                <label class="settings-radio-label">
                  <input type="radio" name="study-lost" value="4" />
                  <span>4 - Significant confusion</span>
                </label>
                <label class="settings-radio-label">
                  <input type="radio" name="study-lost" value="5" />
                  <span>5 - Completely lost (started over)</span>
                </label>
              </div>
            </div>

            <div class="study-field-group">
              <label for="study-notes" class="study-label">Observations (optional)</label>
              <input
                type="text"
                id="study-notes"
                class="study-input"
                placeholder="e.g. Looked at browser tabs for 8s before starting"
                maxlength="200"
              />
            </div>

            <button type="submit" id="btn-save-trial" class="btn btn-primary" style="margin-top: var(--space-2);">
              Save Trial Record
            </button>
          </form>
        </section>
      </div>

      <!-- Section 3: Summary Statistics -->
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="stat-label" style="margin-bottom: var(--space-3);">Aggregate Summary</h2>
        <div id="study-stats-container" class="study-stats-grid"></div>
      </section>

      <!-- Section 4: Results Table & Actions -->
      <section class="study-card" aria-labelledby="results-heading">
        <div class="study-actions-row">
          <h2 id="results-heading" class="stat-label">Recorded Trials (<span id="trials-count">0</span>)</h2>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button type="button" id="btn-export-csv" class="btn btn-primary">
              Export CSV
            </button>
            <button type="button" id="btn-clear-trials" class="btn btn-ghost" style="color: var(--color-text-muted);">
              Clear All Data
            </button>
            ${
              onExitStudy
                ? `<button type="button" id="btn-exit-study" class="btn btn-secondary">Exit Study Mode</button>`
                : ''
            }
          </div>
        </div>

        <div class="study-table-wrapper">
          <table class="study-table" aria-label="Study trials results">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Condition</th>
                <th scope="col">Resume Time</th>
                <th scope="col">Disorientation</th>
                <th scope="col">Observations</th>
                <th scope="col">Timestamp</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody id="study-trials-tbody"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  // Wire Stopwatch
  const readout = container.querySelector<HTMLElement>('#stopwatch-readout')!;
  const btnToggle = container.querySelector<HTMLButtonElement>('#btn-stopwatch-toggle')!;
  const btnReset = container.querySelector<HTMLButtonElement>('#btn-stopwatch-reset')!;
  const resumeSecondsInput = container.querySelector<HTMLInputElement>('#study-resume-seconds')!;

  const stopwatch = new Stopwatch({
    onTick: (seconds, formatted) => {
      readout.textContent = formatted;
      if (!stopwatch.running() && seconds > 0) {
        resumeSecondsInput.value = seconds.toString();
      }
    },
    onStateChange: (running) => {
      if (running) {
        btnToggle.textContent = 'Pause Timing';
        btnToggle.classList.remove('btn-primary');
        btnToggle.classList.add('btn-secondary');
      } else {
        btnToggle.textContent = 'Start Timing';
        btnToggle.classList.remove('btn-secondary');
        btnToggle.classList.add('btn-primary');
      }
    },
  });

  btnToggle.addEventListener('click', () => {
    if (stopwatch.running()) {
      const elapsed = stopwatch.pause();
      resumeSecondsInput.value = elapsed.toString();
      announce(`Timing stopped. ${elapsed} seconds elapsed.`);
    } else {
      stopwatch.start();
      announce('Stopwatch started.');
    }
  });

  btnReset.addEventListener('click', () => {
    stopwatch.reset();
    announce('Stopwatch reset.');
  });

  // Wire Table & Stats Renderers
  const statsContainer = container.querySelector<HTMLElement>('#study-stats-container')!;
  const tbody = container.querySelector<HTMLElement>('#study-trials-tbody')!;
  const trialsCountSpan = container.querySelector<HTMLElement>('#trials-count')!;

  function refreshData(): void {
    const trials = getStudyTrials();
    trialsCountSpan.textContent = trials.length.toString();

    // Render Stats
    const stats = calculateStudyStats(trials);
    statsContainer.innerHTML = `
      <div class="stat-box">
        <span class="stat-label">Total Sample Size (n)</span>
        <span class="stat-value">${stats.totalTrials}</span>
        <span class="stat-sub">${stats.withPickUpCount} with PickUp • ${stats.withoutPickUpCount} control</span>
      </div>

      <div class="stat-box">
        <span class="stat-label">Avg Resume: With PickUp</span>
        <span class="stat-value">${stats.withPickUpCount > 0 ? `${stats.withPickUpAvgResumeSeconds}s` : '—'}</span>
        <span class="stat-sub">Based on ${stats.withPickUpCount} trial(s)</span>
      </div>

      <div class="stat-box">
        <span class="stat-label">Avg Resume: Without PickUp</span>
        <span class="stat-value">${stats.withoutPickUpCount > 0 ? `${stats.withoutPickUpAvgResumeSeconds}s` : '—'}</span>
        <span class="stat-sub">Based on ${stats.withoutPickUpCount} trial(s)</span>
      </div>

      <div class="stat-box">
        <span class="stat-label">Avg Disorientation (1-5)</span>
        <span class="stat-value">
          ${stats.withPickUpCount > 0 ? stats.withPickUpAvgLostRating : '—'} / ${stats.withoutPickUpCount > 0 ? stats.withoutPickUpAvgLostRating : '—'}
        </span>
        <span class="stat-sub">With PickUp vs Control</span>
      </div>
    `;

    // Render Table Rows
    if (trials.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: var(--space-6); color: var(--color-text-muted);">
            No trials recorded yet. Use the stopwatch above to log your first test.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = trials
      .map((t) => {
        const dateStr = new Date(t.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const isWith = t.condition === 'with_pickup';

        return `
          <tr data-trial-id="${t.id}">
            <td style="font-weight: 700; color: var(--color-text-primary); font-family: var(--font-mono);">${escapeHtml(t.participantCode)}</td>
            <td>
              <span class="badge" style="background-color: ${isWith ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'}; color: ${isWith ? 'var(--color-primary)' : 'var(--color-text-secondary)'}; font-weight: 600; padding: var(--space-0-5) var(--space-2); border-radius: var(--radius-sm); font-size: var(--text-xs);">
                ${isWith ? 'With PickUp' : 'Without PickUp'}
              </span>
            </td>
            <td style="font-family: var(--font-mono); font-weight: 600;">${t.resumeTimeSeconds.toFixed(1)}s</td>
            <td>${t.lostRating} / 5</td>
            <td>${t.notes ? escapeHtml(t.notes) : '<span style="color: var(--color-text-muted);">&mdash;</span>'}</td>
            <td style="font-size: var(--text-xs); color: var(--color-text-muted);">${dateStr}</td>
            <td style="text-align: right;">
              <button
                type="button"
                class="btn btn-ghost btn-delete-trial"
                data-id="${t.id}"
                aria-label="Delete trial ${escapeHtml(t.participantCode)}"
                style="padding: var(--space-1) var(--space-2); min-height: 32px; font-size: var(--text-xs); color: var(--color-text-muted);"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach row delete listeners
    tbody.querySelectorAll<HTMLButtonElement>('.btn-delete-trial').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          deleteStudyTrial(id);
          refreshData();
          announce('Trial record deleted.');
        }
      });
    });
  }

  refreshData();

  // Wire Trial Form Submit
  const trialForm = container.querySelector<HTMLFormElement>('#study-trial-form')!;
  const participantCodeInput = container.querySelector<HTMLInputElement>('#study-participant-code')!;
  const notesInput = container.querySelector<HTMLInputElement>('#study-notes')!;

  trialForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const participantCode = participantCodeInput.value.trim().toUpperCase() || 'P_ANON';
    const condition = (
      trialForm.querySelector<HTMLInputElement>('input[name="study-condition"]:checked')?.value ||
      'with_pickup'
    ) as StudyCondition;

    const resumeSeconds = parseFloat(resumeSecondsInput.value);
    if (isNaN(resumeSeconds) || resumeSeconds <= 0) {
      alert('Please record or enter a valid resume time greater than 0.');
      resumeSecondsInput.focus();
      return;
    }

    const lostRating = parseInt(
      trialForm.querySelector<HTMLInputElement>('input[name="study-lost"]:checked')?.value || '1',
      10
    );

    saveStudyTrial({
      participantCode,
      condition,
      resumeTimeSeconds: Math.round(resumeSeconds * 10) / 10,
      lostRating,
      notes: notesInput.value.trim() || undefined,
    });

    // Reset stopwatch & form state
    stopwatch.reset();
    resumeSecondsInput.value = '';
    notesInput.value = '';

    refreshData();
    announce(`Trial recorded for participant ${participantCode}.`);
  });

  // Wire CSV Export
  const btnExport = container.querySelector<HTMLButtonElement>('#btn-export-csv')!;
  btnExport.addEventListener('click', () => {
    const trials = getStudyTrials();
    if (trials.length === 0) {
      alert('No study trials to export yet.');
      return;
    }

    const csvContent = formatTrialsAsCSV(trials);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup_study_results_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    announce('Study results exported as CSV.');
  });

  // Wire Clear All
  const btnClear = container.querySelector<HTMLButtonElement>('#btn-clear-trials')!;
  btnClear.addEventListener('click', () => {
    const trials = getStudyTrials();
    if (trials.length === 0) return;

    if (window.confirm(`Delete all ${trials.length} study trial record(s) from this device?`)) {
      clearAllStudyTrials();
      refreshData();
      announce('All study trials cleared.');
    }
  });

  // Wire Exit
  const btnExit = container.querySelector<HTMLButtonElement>('#btn-exit-study');
  if (btnExit && onExitStudy) {
    btnExit.addEventListener('click', onExitStudy);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
