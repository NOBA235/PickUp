# Assumptions Log

This document records technical, browser API, and platform assumptions made during development. All unverified behaviors or browser-specific quirks are logged here until tested on target devices.

## Browser Support & APIs
- **Target Environments**: Modern evergreen browsers (Chromium, Firefox, Safari 17+).
- **Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)**:
  - Assumption: Desktop Chrome and Edge support Web Speech natively. Mobile Safari supports `webkitSpeechRecognition` on iOS 14.5+. Firefox desktop has minimal or flag-gated support.
  - Implementation: Feature-detected at runtime; if absent, microphone controls are hidden and a calm plain-text message explains the reason without degrading standard keyboard/typing flow.

- **Web Share API (`navigator.share`)**:
  - Assumption: Available on mobile browsers and macOS Safari; frequently unavailable on Windows desktop Chrome without flags or specific OS configurations.
  - Requirement: Feature-detect `navigator.share` and `navigator.canShare`; fall back to Clipboard API copy link/card or inline text export.
- **Clipboard API (`navigator.clipboard.writeText`)**:
  - Assumption: Requires secure context (HTTPS or localhost) and transient user activation (direct click handler).
  - Requirement: Wrapped in try/catch with fallback or prompt instruction if denied.
- **Local Storage**:
  - Assumption: Available on most modern browsers, but can throw errors in private browsing modes (e.g. Safari Private Mode quota exceeded / security errors) or if disabled by enterprise policies.
  - Requirement: Strict try/catch wrapping around every storage read/write operation with in-memory fallback so the app does not crash.
- **Card Storage Retention**:
  - Assumption: Keeping the 20 most recent cards is optimal for low-friction memory retrieval without requiring manual purge controls or risking local storage overflow.
- **Rule-Based Extraction Boundaries**:
  - Assumption: Keyword and regex heuristics provide an immediate baseline for task breakdown without network overhead or latency. Because rules cannot semantically comprehend complex prose, the Review Screen is mandatory so the user can verify or modify extracted cues.
- **Warm-Up Timer Accessibility**:
  - Assumption: Announcing time updates on every second destroys the utility of screen readers. In accordance with calm UI and WCAG accessibility standards, `aria-live` events are restricted solely to timer start and timer completion.




## Platform & Performance
- **Zero Network Dependency**: Core app runs completely client-side without network requests.
- **Accessibility Baseline**: WCAG 2.1 AA compliance, minimum 44x44px touch targets, visible focus indicators, and `prefers-reduced-motion` support.
