/**
 * UI Layer Entry
 * Renders the active application view into #app-view.
 */

import { renderParkView } from './parkView';

export function initializeUI(): void {
  const viewContainer = document.getElementById('app-view');
  if (!viewContainer) {
    console.error('[PickUp:UI] Could not find #app-view container.');
    return;
  }

  // Phase 2: Render the primary "Park It" capture flow
  renderParkView(viewContainer);
}
