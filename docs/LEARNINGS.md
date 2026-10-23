# Project Learnings & Retrospectives

This log tracks surprises, roadblocks, unexpected browser quirks, and lessons learned. It directly feeds the "What we learned" section of the Devpost hackathon submission.

## Phase 0: Scaffolding & Setup
- **Windows PowerShell Execution Policy**:
  - *Observation*: Default Windows PowerShell restricts running `.ps1` files (`npm.ps1 cannot be loaded because running scripts is disabled on this system`).
  - *Resolution*: Invoked CLI tools via `npm.cmd` and `npx.cmd` in automation commands.
- **Modern CSS Standards**:
  - *Observation*: Standardizing CSS tokens with modern CSS variables, `color-scheme: light dark`, and forced-colors fallbacks ensures the page adapts cleanly to OS preferences before any JavaScript loads.
- **Calm UI Architecture**:
  - *Observation*: Designing for cognitive ease requires stripping out standard gamification patterns (streaks, red urgency indicators) and focusing purely on lowering friction to resume interrupted work.

## Phase 1: Data Model & Storage Resilience
- **Defensive Parsing**:
  - *Observation*: Invalid or non-array JSON stored in `localStorage` could easily crash standard `JSON.parse` callers if not strictly checked for `Array.isArray` and wrapped in `try/catch`.
- **Node Environment Testing**:
  - *Observation*: Testing `localStorage` error modes in Vitest with stubbed globals allows fast, deterministic verification of `SecurityError` and quota edge cases without needing a slow browser automation instance.
- **20-Card Bounded Cap**:
  - *Observation*: Pruning oldest cards during insertion guarantees that neither storage quotas nor DOM lists grow unbounded over time.

## Phase 2: Park It Flow, Web Speech & Autosave
- **IME-Safe Shortcut Handling**:
  - *Observation*: Using `Ctrl+Enter` / `Cmd+Enter` provides a fast path for keyboard users, but checking `event.isComposing` prevents accidental early submission during IME character conversion for multilingual users.
- **Graceful Speech API Fallback**:
  - *Observation*: The Web Speech API is missing or vendor-prefixed in many browsers (e.g. desktop Firefox). Rather than rendering disabled buttons that frustrate users, dynamically hiding the control and explaining the alternative in calm, plain text maintains a smooth user experience.
- **Refresh Resilience**:
  - *Observation*: Pairing active card persistence with draft autosaving eliminates the fear of losing thought fragments during sudden tab reloads or battery drops.

## Phase 3: Rule-Based Card Extraction & Review Screen
- **Regex Whitespace Boundaries**:
  - *Observation*: In regex patterns like `next\s+(?:step\s+is)?\s+`, an empty optional group forced two whitespace characters instead of one, accidentally causing bare `"Next write..."` clauses to fall through to fallback logic. Grouping optional subphrases directly into `next(?:\s+(?:step\s+is|...))?\s+` resolved the issue.
- **Calm, Honest Framing**:
  - *Observation*: Labeling extracted cues as "Rule-based draft" sets realistic user expectations and avoids overpromising intelligence or claiming semantic "comprehension."
- **5-Minute Action Framing**:
  - *Observation*: Executive dysfunction and task resumption hesitation are drastically reduced when "next action" is phrased as a concrete 5-minute warm-up (e.g., "Spend 5 minutes to...") rather than a daunting open-ended project goal.

## Phase 4: Resume Flow & 2-Minute Warm-Up Timer
- **Screen Reader Politeness with Countdowns**:
  - *Observation*: Live regions (`aria-live`) updating on every second create an unlistenable flood of speech synthesis for assistive tech users. Restricting announcements strictly to start and completion events ensures screen readers remain functional and calm.
- **The Psychology of the 2-Minute Constraint**:
  - *Observation*: Neurodivergent users often experience intense task initiation paralysis. Framing the warm-up with explicit permission to stop ("You can stop after") lowers the perceived threat and initiates behavioral momentum.
- **Earlier History Scoping**:
  - *Observation*: Capping the collapsed history to 3 items prevents past unfinished cards from becoming a guilt-inducing backlog.

## Phase 5: Peer Handoff & Serverless Hash Sharing
- **Zero-Server URL Hash State**:
  - *Observation*: Encoding the card payload into `window.location.hash` enables instant cross-device sharing without needing any backend server, database, or API keys.
- **Untrusted Input Invariants**:
  - *Observation*: Treating URL hash data as hostile (size bounding to 2048 bytes, structure validation, and DOM rendering exclusively via `textContent`) completely eliminates DOM-based XSS vectors.
- **History Manipulation**:
  - *Observation*: Using `history.replaceState` upon importing a shared card cleans the browser address bar cleanly without triggering an unneeded full page reload.

## Phase 6: Accessibility Settings & Offline PWA
- **Zero-FOUC Data-Attribute Theming**:
  - *Observation*: Applying persisted accessibility settings (text size, dyslexic typography, theme, motion) directly to `document.documentElement` data-attributes via an inline snippet in `<head>` ensures zero flash of unstyled content upon hard reload.
- **Root Rem Scaling for Accessible Text Sizing**:
  - *Observation*: Controlling text size scaling via `html[data-text-size]` on the root element (`100%`, `112.5%`, `125%`) proportionally scales all typography, touch targets, and rem-based spacing across the entire application without breaking layouts.
- **Dyslexia-Friendly Typography Without Web Font Latency**:
  - *Observation*: Enhancing letter-spacing (`0.04em`), word-spacing (`0.08em`), and line-height (`1.75`) on a fallback system stack (`OpenDyslexic`, `Comic Sans MS`, `Trebuchet MS`, `Verdana`) yields immediate legibility improvements for dyslexic readers without any external font downloads or privacy leaks.
- **Stale-While-Revalidate for Offline First**:
  - *Observation*: Combining cache precaching with stale-while-revalidate allows the application to boot instantaneously offline, while updating assets cleanly whenever connectivity is restored.

## Phase 7: Evidence Mode & User Testing
- **Local Data Portability via Blob URLs**:
  - *Observation*: Generating RFC 4180 CSV exports entirely client-side using `URL.createObjectURL(new Blob(...))` allows full research data export without requiring any cloud databases or backend endpoints.
- **Counterbalanced Usability Evaluation**:
  - *Observation*: Alternating order between Condition A (control) and Condition B (intervention) across participants neutralizes task familiarity and warm-up bias during resumption testing.
- **Honest Statistical Framing**:
  - *Observation*: Highlighting exact sample size ($n=3\text{--}5$) and explicitly stating qualitative and experimental limitations prevents pseudo-scientific overclaiming and respects user trust.







