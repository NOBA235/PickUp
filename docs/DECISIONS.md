# Architecture & Technical Decisions (ADR)

This document tracks significant design, technical, and architectural decisions made throughout the project.

## ADR-0001: Technology Stack Selection (Vanilla TS + Vite + Plain CSS)
- **Status**: Accepted
- **Context**: PickUp must load instantly (<60s judge trial with zero friction, zero account creation) and run with zero external network or runtime framework overhead.
- **Decision**:
  - Build using pure TypeScript with Vite as the bundler and dev server.
  - Avoid front-end UI frameworks (React, Vue, Svelte) to eliminate runtime framework weight, prevent hydration bugs, and guarantee predictable, transparent DOM lifecycle.
  - Style with standard modern CSS using custom properties (CSS tokens) rather than Tailwind or heavy CSS-in-JS libraries.
- **Consequences**: Fast builds, tiny bundle size (<30KB gzipped), and complete control over accessibility attributes and semantic markup.

## ADR-0002: Storage Layer Strategy
- **Status**: Accepted
- **Context**: The application must operate offline and keep all user data strictly on the local device. Storage can fail if cookies/storage are blocked or in strict private modes.
- **Decision**:
  - Use `window.localStorage` wrapped with an abstraction layer that handles serialization, versioning, and defensive error handling (try/catch).
  - Provide an in-memory fallback store if `localStorage` throws or is unavailable.
- **Consequences**: Safe execution under all browser security constraints; user data persists between visits on the same device.

## ADR-0003: Accessibility & Calm UI Guidelines
- **Status**: Accepted
- **Context**: Target audience includes people with ADHD, brain fog, caregivers, and interrupted workers. Cluttered UI, red stress badges, and streak guilt increase friction and cognitive load.
- **Decision**:
  - Enforce calm UI principles: single primary action per screen, no guilt-inducing overdue alerts or streaks.
  - Full keyboard accessibility, 44px min touch targets, WCAG AA contrast (4.5:1 text, 3:1 UI borders), explicit skip link, and respecting `prefers-reduced-motion`.
- **Consequences**: Highly usable and neurodivergent-friendly experience that fulfills hackathon judging criteria.

## ADR-0004: Versioned Card Storage, Defensive Error Handling & 20-Card Retention Cap
- **Status**: Accepted
- **Context**: LocalStorage can be blocked (e.g. strict privacy modes, iframes, quota limits) or corrupted by external scripts. The app must never crash, and state must survive in-memory during active sessions.
- **Decision**:
  - Store cards under versioned key `pickup_cards_v1`.
  - Wrap all reads and writes in `try/catch`.
  - Provide an automatic in-memory fallback store (`memoryFallbackStore`) that synchronizes seamlessly if localStorage is blocked or throws.
  - Enforce a 20-card retention cap (newest first, oldest discarded) to keep storage footprint bounded and UI focused on recent context.
- **Consequences**: Zero storage crashes; guaranteed bounded storage size; graceful degradation across all environments.

## ADR-0005: Single Capture Screen, Speech Feature Detection & Draft Autosave
- **Status**: Accepted
- **Context**: Users with ADHD or cognitive fatigue lose their train of thought in seconds when interrupted. The UI must provide a single primary action, zero clutter, and survive accidental tab closures or refreshes.
- **Decision**:
  - Implement a dedicated "Park It" capture screen with one primary submit button.
  - Autosave unsubmitted notes to `pickup_draft_v1` on every keystroke, restoring drafts automatically upon tab reload.
  - Feature-detect the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). If supported, offer voice input with accessible live state updates; if unsupported, hide the microphone button and provide plain-text explanation without blocking the flow.
  - Provide `Ctrl+Enter` and `Cmd+Enter` keyboard submission with IME composition guarding (`event.isComposing`).
  - Announce parking confirmation through an `aria-live="polite"` landmark.
- **Consequences**: Instant capture with zero friction; resilient against accidental refreshes; completely keyboard operable.


