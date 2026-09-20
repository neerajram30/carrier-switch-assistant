# ADR 001: Technology Stack

This ADR records the current technology decisions for Career Switch Assistant. Confirmed decisions are approved for implementation; proposed components require a separate decision before they are adopted.

## Confirmed decisions

| Area | Decision | Rationale | Alternative |
| --- | --- | --- | --- |
| Monorepo | npm workspaces | Keeps the initial toolchain simple for a small team while supporting shared packages and applications. | Turborepo / pnpm workspaces |
| Frontend | Next.js | Provides React, server-side rendering, and SEO support. | Vite |
| Backend | NestJS | Provides a modular TypeScript architecture with dependency injection, validation, authentication patterns, and testing conventions. | Express / Fastify |
| Database | PostgreSQL | The product data has strongly relational entities such as users, goals, roadmaps, tasks, and progress. | MongoDB |

## Proposed components

| Area | Proposed direction | Purpose | Decision needed |
| --- | --- | --- | --- |
| Cache and job queue | Redis | Cache frequently read data and coordinate background jobs. | Confirm hosting, operational cost, and queue library. |
| Resume storage | S3-compatible object storage | Store uploaded resumes separately from PostgreSQL. | Select a provider and define retention, encryption, and deletion requirements. |
| Authentication | Managed authentication provider | Handle identity, sessions, and supported sign-in methods. | Select provider and define OAuth, session, and data-residency requirements. |
| Background processing | Dedicated background worker | Run slow resume extraction, AI analysis, and notification jobs outside API requests. | Select the worker runtime and job-processing approach; it will depend on the selected queue. |

## Deferred decisions

The AI provider, UI/design system, testing tools, Discord integration, deployment platform, and CI/CD provider have not yet been confirmed. They should be recorded in later ADRs when selected.
