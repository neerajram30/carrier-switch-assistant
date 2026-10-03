# Career Switch Assistant — Project Working Context

## Project

- **Career Switch Assistant** is a production-oriented **Career Execution Platform**.
- Core V1 promise:
  - Understand the user's current experience and career goal.
  - Identify skill gaps.
  - Create a realistic roadmap.
  - Convert the roadmap into actionable daily missions.
  - Track execution and career readiness.
- Core journey:
  - **Current Profile → Target Role → Skill Gap Analysis → Personalized Roadmap → Daily Missions → Task Execution → Progress Tracking → Career Readiness**
- Target users: software professionals roughly **1–5 years experience** transitioning toward a specific technical role.
- Example transitions:
  - Frontend → Fullstack
  - React → AI Engineer
  - Java → Senior Java
  - Backend → Cloud
  - Software Engineer → DevOps
- V1 should remain focused; future ideas such as GitHub implementation evaluation, adaptive roadmaps, advanced AI coaching, JD analysis, mock interviews, job matching, WhatsApp, community, etc. are **not current foundation scope**.

## Current repository

- GitHub: https://github.com/neerajram30/carrier-switch-assistant
- Monorepo structure:
  - `apps/web` — Next.js
  - `apps/api` — NestJS
  - `apps/discord-bot` — later/deferred
  - `packages/types`
  - `packages/validation`
  - `packages/ui`
  - `packages/config`
  - `docs/product`
  - `docs/architecture`
  - `docs/adr`
  - `docs/security`
  - `docs/operations`
- **PR #1** established the architecture/system-design documentation and was merged.
- **PR #2** established `AGENTS.md` and was subsequently merged.
- The project has progressed beyond the original monorepo bootstrap task.
- **PR #8** is currently focused on Astryx design-system integration and the Neutral + Dark visual foundation; onboarding implementation was intentionally removed so this remains a focused integration PR.

## Confirmed technology choices

- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS + Node.js + TypeScript
- **Database:** PostgreSQL
- **Package management:** npm workspaces
- **Architecture:** modular monolith
- AI provider: **not selected yet**
- Authentication provider: **not selected yet**
- Redis: **proposed, not adopted**
- S3/object storage: **proposed, not adopted**
- Background worker: **proposed, not adopted**
- Discord: later/deferred
- CI/CD/deployment platform: not yet selected

## Architectural rules

- PostgreSQL is the **system of record**.
- Backend is a **modular monolith**, organized by business capability rather than technical layers.
- Avoid microservices unless scale, reliability, or ownership genuinely justifies them and the decision is documented.
- Prefer **simple infrastructure until complexity is justified by a real requirement**.
- Domain/business logic should remain independent of frameworks, storage technologies, and AI providers.
- AI providers must sit behind an **AI gateway/abstraction**.
- Domain modules should not directly depend on provider SDKs.
- AI output is **untrusted input** and must be schema-validated.
- Deterministic business logic should remain normal application code rather than being delegated to AI.
- Long-running resume/document/AI operations should eventually be asynchronous.
- User-owned data must have clear authorization boundaries.
- Don't introduce Redis, workers, object storage, microservices, etc. merely because they're present in architecture diagrams.

## Engineering/coding standards

- Prefer **small, focused PRs**.
- Build **vertical slices**, rather than completing frontend/backend separately for the entire product.
- Keep feature code close together by business domain.
- Avoid premature abstractions.
- Prefer readable, maintainable, testable code.
- Use TypeScript for application/shared-package code.
- Avoid unrelated refactoring.
- Don't silently expand product scope.
- Technology decisions that materially affect architecture should be captured in ADRs.
- Documentation should reflect actual architecture rather than speculative future architecture.

## Testing standards

- Unit tests for domain/business logic.
- Integration tests for API, persistence, authorization and queue boundaries where applicable.
- E2E tests for critical user journeys.
- Prefer testing **behavior rather than implementation details**.
- Run the narrowest relevant validation for each change.
- Documentation-only changes should at least receive appropriate documentation validation and `git diff --check`.
- Don't claim tests passed if they weren't actually run.

## Security standards

- Never commit secrets.
- Never log passwords, tokens, credentials, or sensitive resume information.
- Validate external input at application boundaries.
- Enforce authorization server-side.
- Never trust client-provided user IDs.
- Uploaded resumes are **untrusted files**.
- AI output is **untrusted input**.
- Minimize PII sent to AI providers.
- Resume storage should eventually be private, encrypted, access-controlled and deletable.
- Security considerations should be part of the implementation rather than postponed until the end.

## AI engineering standards

- AI is an **advisory capability**, not a guaranteed career/employment outcome.
- AI provider abstraction is required.
- Structured AI responses should be schema validated.
- Invalid/unsafe AI responses need explicit fallback/error handling.
- Prompts should be versioned when persisted behavior depends on them.
- Avoid sending unnecessary personal information to AI providers.
- AI-generated recommendations shouldn't be presented as factual hiring decisions.

## Git / team workflow

Our intended workflow is:

```text
Issue
  ↓
Branch
  ↓
Implementation
  ↓
Tests
  ↓
Commit
  ↓
Pull Request
  ↓
Review
  ↓
CI
  ↓
Merge
  ↓
Staging
  ↓
E2E / validation
  ↓
Production
```

- `main` should remain releasable.
- Branch naming:
  - `feat/<name>`
  - `fix/<name>`
  - `docs/<name>`
  - `chore/<name>`
  - `refactor/<name>`
  - `test/<name>`
- PRs should contain one coherent change.
- PR descriptions should explain outcome, implementation, validation and known limitations.
- Don't merge with unresolved security/correctness/review concerns.
- The **Definition of Done** includes implementation, tests/validation, security consideration, documentation where necessary, review and CI.

## Current milestone

- **M0 — Product & Architecture:** completed.
- **M1 — Engineering Foundation / Walking Skeleton:** current.
- Later milestones:
  - M2 Identity + Career Profile
  - M3 Career Intelligence
  - M4 Roadmap Engine
  - M5 Execution + Progress
  - M6 Resume Intelligence
  - M7 Discord
  - M8 Production Hardening

## Current task — ENG-002

**Bootstrap the Monorepo**

Goal:

> After cloning the repository, a developer should be able to install dependencies, start the system locally, access the Next.js application, and verify Web → NestJS API communication.

Expected foundation:
- npm workspaces
- `apps/web`
- `apps/api`
- `packages/types`
- `packages/validation`
- `packages/ui`
- `packages/config`
- Next.js + TypeScript
- NestJS + TypeScript
- `GET /health`
- Web → API communication
- Root `dev`, `build`, `lint`, `typecheck`, and test commands
- Strict TypeScript
- Minimal testing foundation
- No unnecessary infrastructure

**Explicitly out of ENG-002:** PostgreSQL implementation, authentication, JWT, Redis, S3, AI, Discord, AWS, Docker/Kubernetes, microservices, CI/CD, and product features.

## How I should work with you

- You want me to act as a **senior/staff-level Product Architect + Engineer + reviewer**, not just generate code.
- You want the project to simulate a **high-performing mature product engineering team**:
  - fast iteration
  - small PRs
  - strong engineering discipline
  - architecture just ahead of implementation
  - product/UX discipline
  - automated quality gates
  - security from the beginning
  - production mindset
- You want me to **challenge weak architectural decisions**, identify unnecessary complexity, review PRs critically, and teach the reasoning behind professional engineering practices.
- We should avoid spending weeks creating documentation before writing code; documentation should be **just ahead of the work**.
- The objective isn't merely to finish an app—it is to use the app as a vehicle to learn **real product engineering practices**.


## Updated Current State — Post ENG-002

The previous context's statement that **ENG-002 — Bootstrap the Monorepo** is the current task is now historical and should not be used to judge current implementation work.

### Current design-system decision

- **Astryx (`@astryxdesign/*`) is the selected design-system direction for the web application.**
- Theme direction: **Neutral + Dark**.
- The application is intentionally **dark-first**.
- The desired visual personality is:
  - Calm
  - Intelligent
  - Trustworthy
  - Focused
  - Technical
- Avoid excessive gradients, neon styling, unnecessary decoration, and generic "AI purple" treatment.
- Prefer semantic color usage:
  - Neutral → backgrounds/surfaces/text/borders
  - Primary → actions/focus
  - Success → completed/valid/achieved
  - Warning → needs attention
  - Error → invalid/failed
  - Info → contextual information
  - Progress → learning/execution state
  - AI → restrained AI-generated insight/processing indicator
- Prefer Astryx tokens/components over arbitrary application-level colors and styling.

### Current PR

**PR #8 — Astryx Integration**

The purpose of PR #8 is now:

> Prove that the Next.js application can reliably consume Astryx, the Neutral theme, and the dark-first visual foundation.

PR #8 should contain:

- Astryx dependencies/integration
- Neutral theme configuration
- Dark theme configuration
- required CSS/token integration
- required theme/provider configuration
- minimal Astryx component usage/smoke validation
- supporting test/tooling configuration where justified

PR #8 should **not** contain:

- Career Profile onboarding
- Resume Upload UI
- Resume processing
- AI extraction
- Profile review
- Career goal implementation
- unrelated homepage/product redesign

Onboarding code that was previously added to PR #8 has intentionally been removed so the PR remains a coherent design-system integration change.

### Immediate next sequence

```text
PR #8 — Astryx + Neutral/Dark
        ↓
Review / CI / manual smoke validation
        ↓
Merge
        ↓
New feature branch
        ↓
Career Profile / Resume Upload UI
        ↓
Resume Upload API
        ↓
Resume processing
        ↓
AI extraction
        ↓
Profile review
        ↓
Career goal / target role
        ↓
Skill gap analysis
        ↓
Roadmap
        ↓
Daily missions
        ↓
Execution tracking
```

### Resume onboarding implementation direction

The first product-facing onboarding slice should provide a real, usable UI while keeping backend concerns separate.

Initial responsibilities:

- Resume upload entry point
- PDF/DOCX validation
- File-size validation
- Drag/drop interaction
- Keyboard accessibility
- Upload/loading/processing UI states
- Error states
- Manual-entry path
- Component/unit tests

The first UI slice does **not** need the real resume-processing backend or AI extraction.

Those become separate vertical slices.

### Testing strategy

- Colocate component/unit tests with the feature code where practical.
- Use feature-level integration tests when multiple components need to be tested together.
- Keep application-level E2E tests under the E2E test area.
- Do not create E2E tests for every component.
- Add the first meaningful onboarding E2E test when the real upload → processing → profile-review journey exists.
- Test behavior rather than implementation details.
