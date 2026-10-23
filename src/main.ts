import { initializeUI } from './ui';
import { applySettingsToDOM, getSettings } from './storage/settingsStorage';

// Apply user accessibility settings immediately
applySettingsToDOM(getSettings());

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[PickUp:PWA] Service worker registration failed:', err);
    });
  });
}

// Initialize UI on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}
