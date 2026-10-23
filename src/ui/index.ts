/**
 * UI Layer Entry & View Router (Phases 4, 5, 6 & 7)
 * Coordinates navigation between Park, Resume, Handoff, Settings, and hidden Study (?study=1) screens.
 */

import { getLatestParked } from '../storage';
import { renderHandoffView } from './handoffView';
import { renderParkView } from './parkView';
import { renderResumeView } from './resumeView';
import { openSettingsDialog } from './settingsDialog';
import { renderStudyView } from './studyView';

export type AppView = 'park' | 'resume' | 'handoff' | 'study';

let currentView: AppView = 'park';

export function isStudyModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('study') === '1' || window.location.hash.includes('study=1');
}

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

  // Inject hidden Study Mode navigation tab when ?study=1 is present
  const isStudy = isStudyModeActive();
  let navStudyBtn = document.getElementById('nav-btn-study') as HTMLButtonElement | null;

  if (isStudy && !navStudyBtn) {
    const nav = document.querySelector('.site-nav');
    if (nav) {
      navStudyBtn = document.createElement('button');
      navStudyBtn.type = 'button';
      navStudyBtn.id = 'nav-btn-study';
      navStudyBtn.className = 'nav-btn';
      navStudyBtn.textContent = 'Study';
      navStudyBtn.setAttribute('title', 'Researcher Evidence Mode (?study=1)');
      nav.appendChild(navStudyBtn);
      navStudyBtn.addEventListener('click', () => navigateTo('study'));
    }
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

    if (navStudyBtn) {
      if (currentView === 'study') {
        navStudyBtn.setAttribute('aria-current', 'page');
        navStudyBtn.classList.add('is-active');
      } else {
        navStudyBtn.removeAttribute('aria-current');
        navStudyBtn.classList.remove('is-active');
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
    } else if (view === 'study') {
      renderStudyView({
        container: viewContainer!,
        onExitStudy: () => navigateTo('park'),
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

  // Handle incoming hash routing (e.g. #handoff=... or #study=1)
  function checkHashRoute(): boolean {
    if (typeof window !== 'undefined') {
      if (window.location.hash.startsWith('#handoff=')) {
        navigateTo('handoff');
        return true;
      }
      if (window.location.hash.includes('study=1') || window.location.search.includes('study=1')) {
        navigateTo('study');
        return true;
      }
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
