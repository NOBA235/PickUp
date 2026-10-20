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
