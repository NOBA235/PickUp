/**
 * Web Speech API Feature Detection and Recognition Wrapper.
 *
 * Adheres to rule: Never guess browser API behavior.
 * Feature-detects SpeechRecognition / webkitSpeechRecognition and provides
 * safe event handlers and status callbacks.
 */

// Declare speech recognition types for browser compatibility without extra dependencies
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * Feature detect Web Speech Recognition support.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface SpeechRecognizerCallbacks {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onListeningChange: (isListening: boolean) => void;
  onError: (errorMessage: string) => void;
}

export interface SpeechRecognizer {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

/**
 * Creates a guarded speech recognition manager.
 */
export function createSpeechRecognizer(callbacks: SpeechRecognizerCallbacks): SpeechRecognizer {
  if (!isSpeechRecognitionSupported()) {
    return {
      isSupported: false,
      isListening: false,
      start: () => callbacks.onError('Speech recognition is not supported in this browser.'),
      stop: () => {},
      toggle: () => callbacks.onError('Speech recognition is not supported in this browser.'),
    };
  }

  const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!RecognitionClass) {
    return {
      isSupported: false,
      isListening: false,
      start: () => callbacks.onError('Speech recognition unavailable.'),
      stop: () => {},
      toggle: () => {},
    };
  }

  let recognition: SpeechRecognitionInstance | null = null;
  let activeListening = false;

  try {
    recognition = new RecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      activeListening = true;
      callbacks.onListeningChange(true);
    };

    recognition.onend = () => {
      activeListening = false;
      callbacks.onListeningChange(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      activeListening = false;
      callbacks.onListeningChange(false);
      let message = 'Voice capture was interrupted.';
      if (event.error === 'not-allowed') {
        message = 'Microphone permission was denied. Please allow microphone access in your browser.';
      } else if (event.error === 'no-speech') {
        message = 'No speech was detected. Please try again.';
      } else if (event.error === 'network') {
        message = 'Voice recognition network error. You can continue by typing.';
      }
      callbacks.onError(message);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          isFinal = true;
        }
        fullTranscript += result[0].transcript;
      }

      callbacks.onTranscript(fullTranscript, isFinal);
    };
  } catch (error) {
    console.warn('[PickUp:Speech] Failed to initialize SpeechRecognition:', error);
    return {
      isSupported: false,
      isListening: false,
      start: () => callbacks.onError('Could not initialize speech recognition.'),
      stop: () => {},
      toggle: () => {},
    };
  }

  const start = () => {
    if (!recognition || activeListening) return;
    try {
      recognition.start();
    } catch (error) {
      console.warn('[PickUp:Speech] Error starting recognition:', error);
      callbacks.onError('Could not start microphone. Please try again.');
    }
  };

  const stop = () => {
    if (!recognition || !activeListening) return;
    try {
      recognition.stop();
    } catch {
      // Ignore stop errors if already stopped
    }
  };

  const toggle = () => {
    if (activeListening) {
      stop();
    } else {
      start();
    }
  };

  return {
    isSupported: true,
    get isListening() {
      return activeListening;
    },
    start,
    stop,
    toggle,
  };
}
