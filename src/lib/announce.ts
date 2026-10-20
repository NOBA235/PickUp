/**
 * Accessible live announcement utility for screen readers.
 * Uses an aria-live="polite" container to announce state changes.
 */

export function announce(message: string): void {
  const region = document.getElementById('live-region');
  if (!region) return;

  // Clear previous message then update to trigger polite re-announcement
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}
