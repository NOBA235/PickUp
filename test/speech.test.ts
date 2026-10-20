import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isSpeechRecognitionSupported, createSpeechRecognizer } from '../src/lib/speech';

describe('Web Speech Detection & Resilient Wrapper', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects unsupported speech recognition when API is missing from window', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);

    const onTranscript = vi.fn();
    const onListeningChange = vi.fn();
    const onError = vi.fn();

    const recognizer = createSpeechRecognizer({
      onTranscript,
      onListeningChange,
      onError,
    });

    expect(recognizer.isSupported).toBe(false);
    expect(recognizer.isListening).toBe(false);

    recognizer.start();
    expect(onError).toHaveBeenCalledWith('Speech recognition is not supported in this browser.');
  });

  it('initializes and wraps standard SpeechRecognition when available', () => {
    const mockRecognitionInstance = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      onstart: null as (() => void) | null,
      onend: null as (() => void) | null,
      onerror: null as ((ev: any) => void) | null,
      onresult: null as ((ev: any) => void) | null,
    };

    const MockRecognitionConstructor = vi.fn(function () {
      return mockRecognitionInstance;
    });

    vi.stubGlobal('window', {
      SpeechRecognition: MockRecognitionConstructor,
    });

    expect(isSpeechRecognitionSupported()).toBe(true);

    const onTranscript = vi.fn();
    const onListeningChange = vi.fn();
    const onError = vi.fn();

    const recognizer = createSpeechRecognizer({
      onTranscript,
      onListeningChange,
      onError,
    });

    expect(recognizer.isSupported).toBe(true);
    expect(recognizer.isListening).toBe(false);

    recognizer.start();
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });
});
