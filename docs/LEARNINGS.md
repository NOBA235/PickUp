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

