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



