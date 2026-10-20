/**
 * UI Layer Entry & Placeholder Handler
 */

import { announce } from '../lib/announce';

export function initializeUI(): void {
  const parkBtn = document.getElementById('btn-quick-park');
  const resumeBtn = document.getElementById('btn-quick-resume');

  if (parkBtn) {
    parkBtn.addEventListener('click', () => {
      announce('Ready to park your task. Parking screen coming in Phase 1.');
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      announce('Resume flow coming in Phase 2.');
    });
  }
}
