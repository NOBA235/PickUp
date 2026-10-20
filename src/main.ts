import { initializeUI } from './ui';

// Initialize UI on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}
