import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWarmupTimer, formatSeconds } from '../src/lib/timer';

describe('Warm-up Countdown Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly formats seconds into MM:SS strings', () => {
    expect(formatSeconds(120)).toBe('02:00');
    expect(formatSeconds(119)).toBe('01:59');
    expect(formatSeconds(65)).toBe('01:05');
    expect(formatSeconds(9)).toBe('00:09');
    expect(formatSeconds(0)).toBe('00:00');
    expect(formatSeconds(-5)).toBe('00:00');
  });

  it('starts countdown, ticks every second, and updates state', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const onStateChange = vi.fn();

    const timer = createWarmupTimer(120, {
      onTick,
      onComplete,
      onStateChange,
    });

    expect(timer.isRunning()).toBe(false);
    expect(timer.getSecondsRemaining()).toBe(120);

    timer.start();
    expect(timer.isRunning()).toBe(true);
    expect(onStateChange).toHaveBeenCalledWith(true);
    expect(onTick).toHaveBeenCalledWith(120, '02:00');

    // Advance 3 seconds
    vi.advanceTimersByTime(3000);
    expect(timer.getSecondsRemaining()).toBe(117);
    expect(onTick).toHaveBeenCalledWith(117, '01:57');

    timer.pause();
    expect(timer.isRunning()).toBe(false);
    expect(onStateChange).toHaveBeenCalledWith(false);

    // Verify time does not advance while paused
    vi.advanceTimersByTime(2000);
    expect(timer.getSecondsRemaining()).toBe(117);

    timer.destroy();
  });

  it('resets timer back to initial duration', () => {
    const onTick = vi.fn();
    const timer = createWarmupTimer(120, {
      onTick,
      onComplete: vi.fn(),
      onStateChange: vi.fn(),
    });

    timer.start();
    vi.advanceTimersByTime(5000);
    expect(timer.getSecondsRemaining()).toBe(115);

    timer.reset();
    expect(timer.isRunning()).toBe(false);
    expect(timer.getSecondsRemaining()).toBe(120);
    expect(onTick).toHaveBeenLastCalledWith(120, '02:00');

    timer.destroy();
  });

  it('calls onComplete when countdown reaches zero', () => {
    const onComplete = vi.fn();
    const timer = createWarmupTimer(2, {
      onTick: vi.fn(),
      onComplete,
      onStateChange: vi.fn(),
    });

    timer.start();
    vi.advanceTimersByTime(2000);

    expect(onComplete).toHaveBeenCalled();
    expect(timer.isRunning()).toBe(false);
    expect(timer.getSecondsRemaining()).toBe(0);

    timer.destroy();
  });
});
