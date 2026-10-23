/**
 * UI Layer Entry & View Router (Phases 4 & 5)
 * Coordinates navigation between Park, Resume, and Handoff screens.
 */

import { getLatestParked } from '../storage';
import { renderHandoffView } from './handoffView';
import { renderParkView } from './parkView';
import { renderResumeView } from './resumeView';
import { openSettingsDialog } from './settingsDialog';

export type AppView = 'park' | 'resume' | 'handoff';

let currentView: AppView = 'park';

export function initializeUI(): void {
  const viewContainer = document.getElementById('app-view');
  const navParkBtn = document.getElementById('nav-btn-park') as HTMLButtonElement | null;
  const navResumeBtn = document.getElementById('nav-btn-resume') as HTMLButtonElement | null;
  const navSettingsBtn = document.getElementById('nav-btn-settings') as HTMLButtonElement | null;
  const badgeCounter = document.getElementById('nav-parked-badge') as HTMLElement | null;

  if (!viewContainer) {
    console.error('[PickUp:UI] Could not find #app-view container.');
    return;
  }

  function updateNav(): void {
    const latestParked = getLatestParked();

    if (navParkBtn) {
      if (currentView === 'park') {
        navParkBtn.setAttribute('aria-current', 'page');
        navParkBtn.classList.add('is-active');
      } else {
        navParkBtn.removeAttribute('aria-current');
        navParkBtn.classList.remove('is-active');
      }
    }

    if (navResumeBtn) {
      if (currentView === 'resume') {
        navResumeBtn.setAttribute('aria-current', 'page');
        navResumeBtn.classList.add('is-active');
      } else {
        navResumeBtn.removeAttribute('aria-current');
        navResumeBtn.classList.remove('is-active');
      }
    }

    if (badgeCounter) {
      if (latestParked) {
        badgeCounter.style.display = 'inline-flex';
        badgeCounter.textContent = '1';
      } else {
        badgeCounter.style.display = 'none';
      }
    }
  }

  function navigateTo(view: AppView): void {
    currentView = view;
    updateNav();

    if (view === 'park') {
      renderParkView(viewContainer!);
    } else if (view === 'resume') {
      renderResumeView({
        container: viewContainer!,
        onNavigateToPark: () => navigateTo('park'),
      });
    } else if (view === 'handoff') {
      renderHandoffView({
        container: viewContainer!,
        hash: window.location.hash,
        onImportSuccess: () => navigateTo('resume'),
        onDismiss: () => navigateTo('park'),
      });
    }
  }

  if (navParkBtn) {
    navParkBtn.addEventListener('click', () => navigateTo('park'));
  }

  if (navResumeBtn) {
    navResumeBtn.addEventListener('click', () => navigateTo('resume'));
  }

  if (navSettingsBtn) {
    navSettingsBtn.addEventListener('click', () => {
      openSettingsDialog(navSettingsBtn);
    });
  }

  // Handle incoming hash routing (e.g. #handoff=...)
  function checkHashRoute(): boolean {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#handoff=')) {
      navigateTo('handoff');
      return true;
    }
    return false;
  }

  window.addEventListener('hashchange', () => {
    checkHashRoute();
  });

  if (!checkHashRoute()) {
    // If there is an active parked task on initial load, take user directly to Resume screen
    const initialParked = getLatestParked();
    if (initialParked) {
      navigateTo('resume');
    } else {
      navigateTo('park');
    }
  }
}
