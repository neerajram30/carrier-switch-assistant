# Career Switch Assistant — Project Working Context

> **Purpose:** This file is the concise working context for product planning, implementation, architecture decisions, and AI-assisted engineering on Career Switch Assistant.
>
> **Authority:** Use this file for the overall product direction and current project context. Use `docs/product/product-scope.md` as the canonical, detailed product scope; `docs/architecture/system-design.md` for system design; `docs/adr/` for accepted or proposed architectural decisions; and `AGENTS.md` for engineering rules. Keep these documents synchronized when decisions change.

## 1. Product Vision

Career Switch Assistant is a production-oriented **Career Execution Platform** for software professionals who want to transition into a specific technical role.

### Core V1 promise

Given a user's current experience and target role, the product should:

1. Understand the user's current career profile.
2. Identify the skills and experience gaps between the current profile and target role.
3. Create a realistic, personalized learning roadmap.
4. Turn the roadmap into actionable daily missions.
5. Help the user execute tasks and record progress.
6. Show progress against roadmap milestones and provide a transparent career-readiness assessment.

**Core journey:**

`Current Profile → Target Role → Skill Gap Analysis → Personalized Roadmap → Daily Missions → Task Execution → Progress Tracking → Career Readiness`

### Target users

Software professionals with approximately **1–5 years of experience** who want to move toward a specific technical role.

Example transitions:

- Frontend Developer → Full-Stack Developer
- React Developer → AI Engineer
- Java Developer → Senior Java Developer
- Backend Developer → Cloud Engineer
- Software Engineer → DevOps Engineer

The initial product should focus on technical career transitions rather than trying to serve every job-seeker persona.

## 2. Product Scope

The product scope is divided into **V1**, **later enhancements**, and **out of scope unless explicitly approved**. A feature being listed here does not mean it must be included in every PR. Each PR must implement only its stated, coherent slice.

### 2.1 V1 capabilities

| Capability | V1 responsibility | Important boundary |
|---|---|---|
| Authentication and identity | Establish user identity and protect user-owned data. | Development identity mechanisms must never be treated as production authentication. |
| Onboarding | Capture current experience and target career direction through a clear, accessible flow. | Resume-first and manual entry are both supported paths. |
| Resume upload | Accept PDF/DOCX files with client- and server-side validation. | Resume files are untrusted and contain sensitive personal information. |
| Resume processing and extraction | Extract relevant career information from an uploaded resume. | Treat extracted content as untrusted; validate structured output and allow user correction. |
| Career profile | Store current role, experience, skills, and professional summary. | A career profile describes the user's current state, not their target role. |
| Target role / career goal | Let the user define the role they want to pursue. | Keep this separate from the current career profile. |
| Skill-gap analysis | Compare the current profile with the selected target role's skill requirements. | Explain the gaps and assumptions; do not present AI output as an authoritative hiring decision. |
| Personalized roadmap | Create an ordered, realistic plan for addressing identified gaps. | Roadmap structure, validation, and progress calculations should be controlled by application logic. |
| Daily missions | Convert roadmap work into manageable, actionable tasks. | Tasks should be clear enough for a user to act on and complete. |
| Task execution | Allow users to track task state and record completion. | Enforce ownership and valid state transitions on the server. |
| Progress tracking | Show completed work, outstanding tasks, and roadmap milestone progress. | Derive progress consistently from persisted task and milestone state. |
| Learning resources | Recommend resources relevant to the user's gaps and roadmap. | Avoid presenting unverified recommendations as guaranteed or authoritative. |
| Basic AI coach | Explain roadmap items and help the user work through learning tasks. | AI is advisory; output must be validated and failures handled explicitly. |
| Discord integration | Deliver daily missions and support basic progress interactions through Discord. | Build this as a separate integration when its milestone is reached; it is not required in unrelated PRs. |
| Weekly summary | Summarize completed work, progress, and remaining tasks. | Summaries must be based on actual persisted progress. |
| Account and settings | Let users manage account-level preferences and settings. | Protect user data and validate changes server-side. |
| Administrative/operational foundation | Provide the minimum visibility and controls needed to operate the service safely. | Do not build a broad admin platform before a real operational need exists. |
| Subscription foundation | Keep the product architecture compatible with future monetization. | This does not mean implementing a full billing/subscription system prematurely. |

### 2.2 Later enhancements — not V1 commitments

These are possible future capabilities. They must not be treated as requirements for current V1 implementation or as blockers for a focused V1 PR unless separately approved.

- Adaptive roadmaps that change based on user performance.
- Richer AI coaching and long-term coaching memory.
- AI-generated portfolio projects and automated project evaluation.
- GitHub integration and evidence-based implementation evaluation.
- Advanced career-readiness scoring and evidence collection.
- Job-description analysis and comparison against a user's profile.
- Resume tailoring for a specific role or job description.
- Multiple simultaneous career paths.
- Coding challenges and structured technical assessments.
- Mock interviews and interview evaluations.
- Job matching and job-application tracking.
- WhatsApp or Telegram integrations.
- Community features.
- Business-to-business offerings.

**GitHub-based implementation evaluation is explicitly not a V1 commitment.**

### 2.3 Scope-control rules

- Product scope is not the same as the scope of an individual PR.
- Do not implement future capabilities merely because they appear in this document.
- Prefer small, coherent vertical slices that deliver a usable part of the core journey.
- Do not claim a capability is implemented because it is described here.
- Keep a separate implementation tracker or issue board for feature status.
- Any material scope expansion must be explicitly discussed and approved.

## 3. Product Principles

1. **Action over information:** Help users execute meaningful work, not just generate reports.
2. **Personalization:** Recommendations should account for the current profile and chosen target role.
3. **Measurable progress:** Users should understand what they have completed and what remains.
4. **AI-assisted, not AI-dependent:** Deterministic application logic handles validation, authorization, state transitions, and progress calculations.
5. **User control:** AI-generated profile data and recommendations must be reviewable and correctable.
6. **Honest readiness:** Never imply that completing a roadmap guarantees employment, promotion, or a particular hiring outcome.
7. **Privacy by default:** Resumes, career goals, skills, and progress are personal data.
8. **Trustworthy UX:** Prefer calm, clear, accessible, and transparent experiences over flashy AI styling or artificial urgency.
9. **Incremental delivery:** Build architecture just ahead of implementation; do not spend weeks documenting hypothetical future systems.
10. **Evidence over claims:** Product metrics, readiness assessments, and progress indicators should be based on available evidence and clearly communicate limitations.

## 4. Current Repository

- **GitHub:** https://github.com/neerajram30/carrier-switch-assistant
- **Monorepo:** npm workspaces
- `apps/web` — Next.js, React, TypeScript
- `apps/api` — NestJS, Node.js, TypeScript
- `apps/discord-bot` — deferred until the Discord milestone
- `packages/types` — shared types
- `packages/validation` — shared validation where appropriate
- `packages/ui` — shared UI components where appropriate
- `packages/config` — shared configuration
- `docs/product` — product scope and product decisions
- `docs/architecture` — system design and architecture documentation
- `docs/adr` — architecture decision records
- `docs/security` — security design and controls
- `docs/operations` — deployment and operational guidance

PR #1 established initial architecture/system-design documentation. PR #2 established the engineering working agreement in `AGENTS.md`. The repository has progressed beyond the original monorepo bootstrap task.

## 5. Confirmed Technology and Architecture Decisions

### 5.1 Confirmed

- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS + Node.js + TypeScript
- **Database:** PostgreSQL
- **Package management:** npm workspaces
- **Backend architecture:** modular monolith, organized around business capabilities
- **Resume object storage:** Vercel Blob for private resume files in the initial version, documented in `docs/adr/002-resume-object-storage.md`
- **Design system direction:** Astryx (`@astryxdesign/*`) for the web application
- **Theme direction:** Neutral + Dark, with a dark-first application experience

### 5.2 Not yet selected or not adopted unless an accepted ADR says otherwise

- **AI provider/model:** not selected as a permanent provider decision.
- **Production authentication provider:** not selected; the development `x-user-id` mechanism is development/test only.
- **Redis:** proposed, not adopted.
- **Dedicated background worker/queue:** proposed, not adopted.
- **Microservices:** not adopted.
- **Deployment/CI-CD platform:** verify the current repository configuration before treating a platform as a settled architecture decision.
- Other infrastructure must not be introduced merely because it appears in a future-state diagram.

### 5.3 ADR and documentation consistency

- `docs/adr/002-resume-object-storage.md` records the accepted Vercel Blob decision.
- Older documents must not continue describing resume object storage as undecided. Synchronize `docs/adr/001-technology-stack.md` and `docs/architecture/system-design.md` with ADR 002.
- An accepted ADR is the authoritative record for the decision it covers. Earlier proposals should be updated to reference it.
- Do not confuse an accepted architectural decision with proof that every integration test or operational requirement has passed.
- If documents genuinely conflict, identify the exact conflict and reconcile the documents rather than automatically treating the implementation as unauthorized.

## 6. Architectural Rules

- PostgreSQL is the system of record for structured application data and resume metadata.
- Keep the backend as a modular monolith unless scale, reliability, deployment, or team ownership provides a real reason to split it.
- Prefer simple infrastructure until complexity is justified by a real requirement.
- Keep domain/business logic independent of frameworks, storage technologies, and AI providers.
- AI providers must sit behind an AI gateway/abstraction; domain modules must not directly depend on provider SDKs.
- Treat AI output and extracted resume content as untrusted input; validate structured output against schemas.
- Keep deterministic business logic in application code rather than delegating it to AI.
- Long-running resume/document/AI processing may require asynchronous execution as the product grows; introduce a queue/worker only when the flow requires it and the decision is documented.
- Enforce ownership and authorization on the server for every user-owned resource.
- The client must not be trusted to provide authoritative user IDs, ownership, storage keys, or storage URLs.
- Resume binaries must remain private. Access should be granted only after server-side ownership authorization.
- Use canonical, server-generated storage keys. PostgreSQL remains authoritative for resume metadata.
- Keep vendor-specific storage behavior behind `ObjectStoragePort`.
- Do not add Redis, queues, additional object storage, microservices, or other infrastructure solely because they are listed in a roadmap or diagram.

## 7. Engineering and Coding Standards

- Prefer small, focused PRs and coherent vertical slices.
- Keep feature code close together by business domain.
- Avoid premature abstractions and unrelated refactoring.
- Prefer readable, maintainable, testable code.
- Use TypeScript for application and shared-package code.
- Validate external input at application boundaries.
- Capture material architectural decisions in ADRs.
- Keep documentation aligned with the actual accepted architecture.
- A PR should explain its outcome, implementation, validation, and known limitations.
- Do not claim tests, smoke tests, security checks, or integration checks passed unless they were actually run.
- Do not merge with unresolved security or correctness blockers.

## 8. Testing Standards

- Unit tests for domain/business logic and important state transitions.
- Integration tests for API, persistence, authorization, and storage boundaries where applicable.
- E2E tests for critical user journeys when the corresponding real flow exists.
- Test behavior rather than implementation details.
- Colocate component/unit tests with feature code where practical.
- Use feature-level integration tests when several components must work together.
- Keep application-level E2E tests in the designated E2E area; do not write E2E tests for every component.
- For storage integration, mocked adapter tests do not replace a real private-storage smoke test.
- Run the narrowest relevant validation for each change, then rely on CI for the repository's required checks.
- Documentation-only changes should receive appropriate documentation validation and `git diff --check`.

## 9. Security Standards

- Never commit secrets or expose tokens in logs.
- Never log passwords, credentials, sensitive resume content, or unnecessary personal information.
- Validate user input on the server, even if client-side validation exists.
- Enforce authorization server-side and validate that authenticated users exist.
- Never trust client-provided user IDs or ownership.
- Treat uploaded resumes as untrusted files; enforce file type and size restrictions on the server.
- Resume objects must be private and deletable.
- Minimize personally identifiable information sent to AI providers.
- Treat AI output as untrusted; schema-validate it and handle invalid output safely.
- The development `x-user-id` header provider must be disabled outside explicitly allowed development/test environments. It is not production authentication.
- Include security considerations in design and implementation rather than postponing them until the end.

## 10. AI Engineering Standards

- AI is advisory and does not guarantee a career or employment outcome.
- Keep AI-provider integration behind an abstraction/gateway.
- Validate structured AI responses against explicit schemas.
- Define safe failure/fallback behavior for invalid, incomplete, or unsafe responses.
- Version prompts when persisted behavior depends on them.
- Avoid sending unnecessary personal information to AI providers.
- Keep application-controlled decisions—authorization, validation, state transitions, progress math, and data ownership—deterministic.
- Present AI-generated recommendations as suggestions, not as authoritative hiring decisions.

## 11. Design and UX Direction

- Use Astryx (`@astryxdesign/*`) tokens/components where appropriate instead of arbitrary application-level colors and styling.
- Theme direction: Neutral + Dark; dark-first.
- Desired personality: calm, intelligent, trustworthy, focused, and technical.
- Avoid excessive gradients, neon styling, unnecessary decoration, and generic “AI purple” treatment.
- Prefer semantic color usage:
  - Neutral — backgrounds, surfaces, text, and borders.
  - Primary — actions and focus.
  - Success — completed, valid, or achieved states.
  - Warning — attention required.
  - Error — invalid or failed states.
  - Info — contextual information.
  - Progress — learning and execution state.
  - AI — restrained AI-generated insight or processing indicators.
- Resume-first onboarding must have a first-class manual-entry alternative.
- Follow the principle: **AI proposes, the user verifies, and the system saves.**
- Keep Career Profile (current state) separate from Career Goal (target role).
- Do not fake AI latency or claim that extraction/analysis occurred when it did not.
- Use accessible keyboard interactions, meaningful loading/error states, and clear validation feedback.
- After onboarding, guide users toward useful career analysis rather than an empty generic dashboard.

## 12. Git and Team Workflow

```text
Issue
  ↓
Branch
  ↓
Implementation
  ↓
Tests and validation
  ↓
Commit
  ↓
Pull request
  ↓
Review
  ↓
CI
  ↓
Merge
  ↓
Staging validation
  ↓
E2E / smoke checks where applicable
  ↓
Production
```

- `main` should remain releasable.
- Branch naming: `feat/<name>`, `fix/<name>`, `docs/<name>`, `chore/<name>`, `refactor/<name>`, `test/<name>`.
- PRs should contain one coherent change.
- The Definition of Done includes implementation, tests/validation, security consideration, documentation where needed, review, and passing CI.
- For changes involving external infrastructure, include a real smoke test when mocks cannot verify the critical behavior.

## 13. Suggested Product Delivery Sequence

This sequence describes dependencies and intended direction, not a requirement to combine every item into one PR.

1. Engineering foundation and design-system integration.
2. Identity/authentication foundation appropriate for the target deployment.
3. Career Profile persistence and onboarding.
4. Resume upload, private storage, and server-side validation.
5. Resume processing and structured extraction.
6. User review and correction of extracted career information.
7. Target role / Career Goal.
8. Skill-gap analysis.
9. Personalized roadmap generation and validation.
10. Daily missions and task execution.
11. Progress tracking and weekly summaries.
12. Learning resource recommendations and basic AI coaching.
13. Discord integration.
14. Production hardening, observability, privacy, operational controls, and monetization work as justified.

Do not treat this list as proof that a milestone is complete. Verify the issue board, merged PRs, implementation, tests, and deployment state.

## 14. Automated PR Reviewer Rules

Automated reviewers must assess the **current diff against current accepted decisions**, not only against historical proposals.

Before reporting an architecture blocker, the reviewer should:

1. Read `AGENTS.md` and the relevant product/architecture documents.
2. Inspect relevant ADRs and their statuses.
3. Check whether an accepted ADR supersedes an earlier proposal.
4. Verify that the current PR actually violates the accepted decision.
5. Cite the exact conflicting document, code, or missing requirement.
6. Report documentation inconsistency separately from an implementation violation.
7. Avoid treating future product features as requirements for a focused current PR.
8. Continue to report genuine security, correctness, test, and operational failures regardless of architectural approval.

`AGENTS.md` may guide contributors and agents, but the actual GitHub Actions reviewer instructions/prompt must also be updated if that workflow does not automatically read these files. Existing review comments are historical output and do not automatically update when documentation changes.

## 15. How to Work With the User

Act as a senior/staff-level Product Architect, Engineer, and reviewer—not merely a code generator.

The user wants to simulate a high-performing product engineering team through:

- Fast, disciplined iteration.
- Small PRs and vertical slices.
- Architecture just ahead of implementation.
- Strong product and UX reasoning.
- Automated quality gates.
- Security from the beginning.
- A production mindset.
- Critical review of weak architectural decisions and unnecessary complexity.
- Explanations of why professional engineering practices matter.

Avoid spending weeks documenting hypothetical systems before implementation. Keep documentation detailed enough to remove ambiguity and just ahead of the work.

The objective is not only to finish the application; it is also to use the application to learn mature product engineering practices.
