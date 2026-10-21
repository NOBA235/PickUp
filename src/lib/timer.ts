/**
 * 2-Minute Warm-up Timer Utility (Phase 4)
 *
 * Implements a calm countdown timer designed to reduce activation friction:
 * "Just start for 2 minutes. You can stop after."
 *
 * Rules:
 * - Announce via aria-live ONLY at start and end, never every second
 * - No audio by default
 * - Full start, pause, and reset controls
 */

export interface TimerCallbacks {
  onTick: (secondsRemaining: number, formatted: string) => void;
  onComplete: () => void;
  onStateChange: (isRunning: boolean) => void;
}

export interface WarmupTimer {
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
  getSecondsRemaining: () => number;
  isRunning: () => boolean;
  destroy: () => void;
}

/**
 * Format total seconds into MM:SS format.
 */
export function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Creates a countdown timer instance.
 */
export function createWarmupTimer(
  initialSeconds: number = 120,
  callbacks: TimerCallbacks
): WarmupTimer {
  let secondsRemaining = initialSeconds;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const tick = () => {
    if (secondsRemaining <= 1) {
      secondsRemaining = 0;
      pause();
      callbacks.onTick(0, formatSeconds(0));
      callbacks.onComplete();
    } else {
      secondsRemaining -= 1;
      callbacks.onTick(secondsRemaining, formatSeconds(secondsRemaining));
    }
  };

  const start = () => {
    if (running) return;
    if (secondsRemaining <= 0) {
      secondsRemaining = initialSeconds;
    }
    running = true;
    callbacks.onStateChange(true);
    callbacks.onTick(secondsRemaining, formatSeconds(secondsRemaining));
    intervalId = setInterval(tick, 1000);
  };

  const pause = () => {
    if (!running && intervalId === null) return;
    running = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    callbacks.onStateChange(false);
  };

  const reset = () => {
    pause();
    secondsRemaining = initialSeconds;
    callbacks.onTick(secondsRemaining, formatSeconds(secondsRemaining));
  };

  const toggle = () => {
    if (running) {
      pause();
    } else {
      start();
    }
  };

  const destroy = () => {
    pause();
  };

  return {
    start,
    pause,
    reset,
    toggle,
    getSecondsRemaining: () => secondsRemaining,
    isRunning: () => running,
    destroy,
  };
}
