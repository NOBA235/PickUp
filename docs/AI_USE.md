# AI Assistance & Attribution Disclosure

In compliance with hackathon rules and transparent development standards, this document logs all instances where generative AI tools assisted in the planning, code generation, refactoring, or documentation of PickUp.

## Hackathon Disclosure Statement
- **Project**: PickUp
- **Hackathon**: Taskforge (Devpost deadline: Sat Oct 24, 2026, 2:00pm PDT)
- **Role of AI**: AI was used as a senior pair-programming assistant to brainstorm architecture, scaffold boilerplate, formulate TypeScript types, write unit test stubs, and document ADRs. All logic, accessibility semantics, and architectural choices were reviewed, verified, and directed by the human lead.

## Phase 0: Scaffolding
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Scaffolding `package.json`, `tsconfig.json`, `vite.config.ts`, and directory layout.
  - Generating initial CSS tokens (`src/styles/tokens.css`) and reset baseline (`src/styles/base.css`).
  - Creating semantic HTML landmarks and skip-link skeleton.
  - Drafting initial ADR, assumptions, and retrospective documentation.
- **Verification**: Every script, test, build, and token was executed and validated locally.

## Phase 1: Data Model & Storage
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Authoring TypeScript types for `Card`, `CardStatus`, and `CardSource`.
  - Designing defensive `src/storage/index.ts` with transparent `memoryFallbackStore` for blocked/erroring environments and automatic 20-card cap enforcement.
  - Formulating 15 Vitest unit tests covering empty state, corrupt JSON, security errors / blocked storage, and 20-card pruning.
- **Verification**: Tests and TypeScript checks were executed and validated locally (15 passing tests).

## Phase 2: Park It Flow
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Consulting `modern-web-guidance` (`ime-safe-enter-submit`) for keyboard shortcut accessibility and IME event guarding.
  - Designing Web Speech API detection wrapper with graceful degradation when speech recognition is absent.
  - Building draft autosave mechanism in `src/storage/draftStorage.ts`.
  - Implementing accessible `ParkView` component with single-action layout, aria-live confirmation, and persistent parked card display.
- **Verification**: 21 unit tests passing in Vitest; verified build and dev server.

## Phase 3: Card Builder (Rules Only) & Review Screen
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Authoring deterministic cue-extraction heuristics (`extractCardCues`) in `src/lib/cardBuilder.ts`.
  - Creating 14 robust edge-case fixtures in `test/fixtures/cardExtractorFixtures.ts` covering non-English text, long input, and run-ons.
  - Designing the accessible Review Screen component (`src/ui/reviewView.ts`) with clear non-AI heuristic disclosures.
- **Verification**: 25 unit tests passing in Vitest; complete TypeScript check and build validation.

## Phase 4: Resume Screen & Warm-Up Timer
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Authoring `src/lib/timer.ts` countdown logic with start, pause, reset, and tick formatting.
  - Designing `src/ui/resumeView.ts` with prominent cues, 2-minute timer, polite aria-live constraints, and collapsed 3-card history.
  - Coordinating bidirectional navigation between Park and Resume views in `src/ui/index.ts`.
- **Verification**: 33 unit tests passing in Vitest; complete TypeScript checks and production bundle builds verified.

## Phase 5: Hand Off & Sharing
- **Model / System**: Google DeepMind / Antigravity AI Assistant.
- **Assisted Areas**:
  - Authoring plain-text template generator, URL hash encoder/decoder, and Web Share API detector in `src/lib/handoff.ts`.
  - Designing security validation for untrusted URL hash data (2048-byte limit, schema checks, rendering strictly via `textContent`).
  - Creating `src/ui/handoffView.ts` with read-only display and "Make it mine" import logic.
  - Authoring 10 comprehensive unit tests covering round trips, malformed input, oversized payloads, and XSS safety.
- **Verification**: 43 unit tests passing in Vitest; complete TypeScript checks and production builds verified.





