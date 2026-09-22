# Contributor Guide for Agents

## 1. Purpose

Career Switch Assistant is a career-readiness platform for software professionals. This file defines how contributors and AI agents should make changes so the product remains secure, maintainable, and consistent with its architecture.

Read [README.md](README.md), [ADR 001](docs/adr/001-technology-stack.md), and the [system design](docs/architecture/system-design.md) before making architectural changes.

## 2. Product Principles

- Help users make practical, evidence-based progress toward a target role.
- Make roadmaps, readiness indicators, and recommendations understandable and actionable.
- Treat career guidance as advisory; never imply guaranteed employment outcomes.
- Respect user privacy, especially for resumes, skills, goals, and progress data.
- Prefer a focused, reliable user experience over feature breadth.

## 3. Engineering Principles

- Prefer small, focused changes that preserve existing behavior.
- Use TypeScript for application and shared-package code.
- Keep domain and business logic independent of framework, storage, and AI-provider details.
- Favor readable, testable code over premature abstraction.
- Update documentation when a technology choice, architecture boundary, data flow, or security assumption changes.
- Record confirmed technology decisions and meaningful alternatives in `docs/adr/`.

## 4. Architecture Rules

- Use npm workspaces; do not introduce another package manager without an ADR.
- The current confirmed stack is Next.js, NestJS, PostgreSQL, and npm workspaces.
- Treat PostgreSQL as the system of record. Caches, queues, and AI responses must not become authoritative data stores.
- Keep the API as a modular monolith. Extract a service only when scale, reliability, or ownership needs justify it.
- Keep long-running document and AI operations asynchronous when the proposed worker and queue are implemented.
- Mark unconfirmed infrastructure or vendor choices as proposed rather than presenting them as final.
- Do not add infrastructure, dependencies, or services unless they are required by the task or explicitly approved.

## 5. Repository Structure

The repository will use npm workspaces as it grows. Keep responsibilities separate:

```text
apps/
  web/             Next.js web application
  api/             NestJS API
  worker/          Background processing, when adopted
packages/
  shared/          Shared types, validation, and utilities
  ui/              Shared UI components, when needed
docs/
  adr/             Architecture decision records
  architecture/    System design and architecture documentation
```

- Do not place application-specific business logic in shared packages.
- Keep feature code close together by domain rather than splitting it only by technical layer.
- Add a local `AGENTS.md` only when a subdirectory needs rules that differ from this guide.

## 6. Development Workflow

1. Review the relevant issue, documentation, and existing code before changing anything.
2. Check whether the change affects an architectural decision; add or update an ADR when it does.
3. Implement the smallest complete change.
4. Add or update tests with behavior changes when the relevant tooling exists.
5. Run the narrowest relevant validation commands.
6. Review the diff for unrelated changes, secrets, generated files, and documentation updates.

## 7. Branching Strategy

- Keep `main` releasable and do not commit unfinished work directly to it.
- Create short-lived branches from `main` using a clear prefix, such as `feat/`, `fix/`, `docs/`, `chore/`, or `refactor/`.
- Use a concise, kebab-case branch suffix, for example `feat/resume-upload`.
- Rebase or merge the latest `main` as required by the repository’s pull-request settings before merge.
- Delete merged branches when they are no longer needed.

## 8. Pull Request Rules

- Keep each pull request focused on one coherent change.
- Use a concise title that follows `type: summary`, for example `feat: add resume upload status`.
- Explain the user or engineering outcome, key implementation details, and any architecture or data changes.
- Include validation performed and clearly state when tests were not run and why.
- Link related issues or ADRs when applicable.
- Do not merge a pull request with unresolved security, correctness, or review concerns.

## 9. Testing Policy

- Add or update unit tests for domain logic and service behavior.
- Add integration tests for API, persistence, authorization, and queue behavior when those components exist.
- Add end-to-end tests for critical user journeys when the web application is available.
- Run the narrowest relevant command from `package.json` or the affected workspace.
- The current root `npm test` script is a placeholder and intentionally fails; do not report it as a meaningful test result.
- For documentation-only changes, check Markdown links, Mermaid syntax, and run `git diff --check`.

## 10. Security Rules

- Enforce authorization boundaries for every user-owned resource.
- Never log or commit credentials, access tokens, resume contents, or other sensitive personal data.
- Validate and sanitize all external input at application boundaries.
- Use parameterized database queries or the selected ORM/query builder; never build SQL from untrusted input.
- Store uploaded resumes privately, encrypt sensitive data in transit and at rest, and support deletion according to the product policy.
- Keep secrets in environment-specific secret management, never source control.

## 11. AI Engineering Rules

- Keep domain logic independent of AI vendors and models.
- Treat all AI output as untrusted input; validate it against a schema before displaying, using, or persisting it.
- Minimize the user data sent to AI providers and avoid sending unnecessary personally identifiable information.
- Version prompts and capture only safe, non-sensitive metadata needed for debugging and evaluation.
- Use deterministic fallbacks and clear user messaging when AI output is unavailable, invalid, or unsafe.
- Do not present AI-generated career guidance as factual hiring decisions or guaranteed outcomes.

## 12. Definition of Done

A change is complete when:

- The requested behavior or documentation update is implemented.
- The change is scoped, readable, and free of unrelated modifications.
- Relevant tests and validation have passed, or their absence is documented.
- Documentation and ADRs reflect any architecture, data, security, or technology-decision changes.
- No secrets, sensitive data, or generated artifacts have been added accidentally.
- The pull request description explains the outcome, validation, and known limitations.

## 13. AI Agent Rules

- Read this file and any more-specific `AGENTS.md` files before editing code or documentation.
- Make only changes needed for the user’s request; preserve unrelated work in a dirty working tree.
- Prefer repository conventions and existing scripts over invented tooling or structure.
- Do not make external changes, add dependencies, or change architecture without user authorization.
- State assumptions that could materially affect implementation decisions.
- Verify work proportionally to risk and report what was changed and validated.
- Keep Mermaid diagrams simple and label components as confirmed, proposed, or deferred where relevant.
- Use `NestJS` and `Next.js` capitalization consistently, and refer to the product as **Career Switch Assistant**.
