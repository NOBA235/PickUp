/**
 * Researcher Stopwatch Utility (Phase 7)
 * High-precision elapsed time tracker for timing participant task resumption latency.
 */

export interface StopwatchCallbacks {
  onTick?: (elapsedSeconds: number, formatted: string) => void;
  onStateChange?: (isRunning: boolean) => void;
}

export class Stopwatch {
  private startTime = 0;
  private accumulatedMs = 0;
  private timerId: number | null = null;
  private isRunning = false;
  private callbacks: StopwatchCallbacks;

  constructor(callbacks: StopwatchCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    this.callbacks.onStateChange?.(true);

    const tick = () => {
      if (!this.isRunning) return;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const currentElapsed = this.accumulatedMs + (now - this.startTime);
      const seconds = Math.round(currentElapsed / 100) / 10;
      this.callbacks.onTick?.(seconds, this.format(currentElapsed));

      if (typeof window !== 'undefined') {
        this.timerId = window.requestAnimationFrame(tick);
      }
    };

    if (typeof window !== 'undefined') {
      this.timerId = window.requestAnimationFrame(tick);
    }
  }

  public pause(): number {
    if (!this.isRunning) return this.getElapsedSeconds();
    this.isRunning = false;

    if (this.timerId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.accumulatedMs += (now - this.startTime);

    this.callbacks.onStateChange?.(false);
    const seconds = this.getElapsedSeconds();
    this.callbacks.onTick?.(seconds, this.format(this.accumulatedMs));
    return seconds;
  }

  public reset(): void {
    this.isRunning = false;
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    this.accumulatedMs = 0;
    this.startTime = 0;
    this.callbacks.onStateChange?.(false);
    this.callbacks.onTick?.(0, '00:00.0');
  }

  public getElapsedSeconds(): number {
    let total = this.accumulatedMs;
    if (this.isRunning) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      total += (now - this.startTime);
    }
    return Math.round(total / 100) / 10;
  }

  public format(ms: number): string {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((ms % 1000) / 100);

    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return `${mm}:${ss}.${tenths}`;
  }

  public running(): boolean {
    return this.isRunning;
  }
}
