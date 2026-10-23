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

## ADR-0006: Deterministic Rule-Based Card Builder & Review Screen
- **Status**: Accepted
- **Context**: Turning unstructured thought dumps into structured cues (*Where I was*, *Next 5-minute action*, *Waiting on*) needs to work offline with zero latency, zero API keys, and zero claims of AI "understanding". Users must always retain final agency over their cues before saving.
- **Decision**:
  - Implement a deterministic extractor (`src/lib/cardBuilder.ts`) based on linguistic cues ("was doing", "stuck on", "next", "waiting on").
  - Provide safe, gentle fallbacks when cues are missing (first sentence for *Where I was*, a bite-sized 5-minute prompt for *Next action*).
  - Introduce an explicit Review Screen allowing editing of all three fields before saving to storage.
  - Plain-language disclosure: explicitly label the suggested fields as a "Rule-based draft" without making claims that the app "understands" the user's text.
- **Consequences**: Fast, offline-first, predictable parsing with complete user control.

## ADR-0007: Single-Purpose Resume Screen & 2-Minute Warm-Up Timer
- **Status**: Accepted
- **Context**: Task resumption is hindered by cognitive dread and overthinking. Resuming requires low cognitive load, visual clarity, and an immediate low-stakes onramp.
- **Decision**:
  - Dedicate a focused screen displaying only the latest parked task broken into large, high-contrast sections (*Where I was*, *Next 5-minute action*, *Waiting on*).
  - Provide an integrated 2-minute countdown timer framed with the low-barrier prompt: *"Just start for 2 minutes. You can stop after."*
  - Strict accessibility constraint: announce timer state via `aria-live="polite"` only on start and completion—never on every second tick—to prevent screen-reader inundation.
  - No sound or alarm effects by default to keep the environment calm.
  - Present three clear action buttons: *"I'm back at it"* (marks as `resumed`), *"Done"* (marks as `done`), and *"Park again"* (navigates to capture).
  - Collapse earlier cards into an accessible `<details>` accordion displaying at most 3 historical items.
- **Consequences**: Eliminates resumption anxiety; highly accessible; keeps cognitive load minimal.

## ADR-0008: Serverless Card Handoff & Untrusted Hash Sanitization
- **Status**: Accepted
- **Context**: Passing a card to a colleague or study partner must require zero accounts, zero cloud databases, and zero servers, while remaining strictly secure against malicious payloads or injection.
- **Decision**:
  - Implement three handoff vectors:
    1. Plain-text template: formatted for Slack, Discord, email, or SMS.
    2. Web Share API: feature-detected native system share sheet.
    3. Serverless share link: entire card payload encoded in the URL hash (`#handoff=[base64]`).
  - Security model for decoded hash data:
    - Enforce a strict 2048-byte payload limit.
    - Validate schema (disallow arrays, primitive types, non-conforming objects).
    - Render untrusted data strictly via `element.textContent = ...` to guarantee complete immunity against HTML and script injection (XSS).
  - Provide an import action ("Make it mine") that adopts the shared task into the recipient's local storage and cleans the URL hash.
- **Consequences**: Effortless, zero-friction peer handoff with rock-solid security and privacy.

## ADR-0009: Accessibility Settings, Dyslexia-Friendly Stack, and Offline PWA
- **Status**: Accepted
- **Context**: Users have diverse neurodivergent, visual, and cognitive needs (e.g., dyslexia, low vision, vestibular motion sensitivity). Additionally, the app must install and run entirely offline with zero remote telemetry.
- **Decision**:
  - Implement a dedicated, accessible `<dialog>` settings controller:
    1. **Text Size Scaling**: Normal (100%), Large (112.5%), Extra Large (125%) via `html[data-text-size]` scaling root `rem`.
    2. **Dyslexia-Friendly Typography**: Self-contained fallback system font stack (`OpenDyslexic`, `Lexie Readable`, `Comic Sans MS`, `Trebuchet MS`, `Verdana`) with enhanced letter-spacing (0.04em), word-spacing (0.08em), and line-height (1.75–1.9) with zero external network requests.
    3. **Color Themes**: Follow System, Explicit Light, Explicit Dark, and High Contrast (pure black canvas, pure white text, yellow accent, cyan focus, >=7:1 contrast exceeding WCAG AAA).
    4. **Reduced Motion Override**: Manual toggle to enforce static transitions (`0.01ms`) regardless of OS preferences.
  - Persist settings under `pickup_settings_v1` in `localStorage` with in-memory fallback.
  - Implement Web App Manifest (`public/manifest.webmanifest`) and Service Worker (`public/sw.js`) with precaching and stale-while-revalidate for seamless offline installability.
- **Consequences**: Full user agency over reading and sensory experience, 100% offline-capable, zero external network dependency.






