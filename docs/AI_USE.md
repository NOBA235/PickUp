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

