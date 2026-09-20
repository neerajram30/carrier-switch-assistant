# System Design

This document describes the initial architecture for Career Switch Assistant. PostgreSQL, Next.js, NestJS, and npm workspaces are confirmed decisions. Redis, S3-compatible object storage, an authentication provider, and a background worker are proposed components that require confirmation; see [ADR 001](../adr/001-technology-stack.md).

## Architectural principles

1. PostgreSQL is the system of record.
2. Domain logic stays independent of AI vendors.
3. AI outputs are untrusted and must be schema-validated.
4. Long-running AI/document operations are asynchronous.
5. User data is isolated by authorization boundaries.
6. Start with a modular monolith; extract services only when justified.
7. Prefer simple infrastructure until scale or reliability requirements justify added complexity.

## 1. System context

Career Switch Assistant helps software professionals assess their readiness for a target role, follow a personalized roadmap and prepare for applications.

External actors and services:

- **User:** accesses the web application and may later interact through Discord.
- **AI provider (deferred):** will provide tailored recommendations and document analysis once selected.
- **Authentication provider (proposed):** would verify identity and manage user sessions.
- **Discord integration (deferred):** may send progress notifications if enabled.

## 2. Container / application architecture

The system is organized as an npm-workspaces monorepo.

| Container | Responsibility | Primary technology | Status |
| --- | --- | --- | --- |
| `apps/web` | User interface for onboarding, roadmaps, progress, resumes, and settings | Next.js, React, TypeScript | Confirmed |
| `apps/api` | HTTP API, business rules, authorization, AI orchestration, and persistence | NestJS, Node.js, TypeScript | Confirmed |
| PostgreSQL | Durable relational data: users, goals, roadmaps, tasks, resumes, and audit data | PostgreSQL | Confirmed |
| Shared packages | Reusable UI, types, validation, and configuration | TypeScript packages | Confirmed with npm workspaces |
| Redis | Cache, rate limiting, queues, and background-job coordination | Redis | Proposed |
| S3-compatible object storage | Private storage for uploaded resumes | Provider to be selected | Proposed |
| Authentication provider | Identity verification and session management | Provider to be selected | Proposed |
| Background worker | Asynchronous resume extraction, AI analysis, and notification jobs | Worker runtime to be selected | Proposed |
| `apps/discord-bot` | Optional conversational interface and progress reminders | discord.js, TypeScript | Deferred |
| AI provider | Generates role guidance and analyzes resumes | Provider to be selected | Deferred |

The web application calls the API. Once adopted, the proposed background worker will process queued work and access only the services it needs. The API remains the owner of application business rules and PostgreSQL access.

## 3. Backend architecture

The NestJS API should be structured as feature modules rather than by technical layer alone. Each feature module should group its controller, service, DTOs, and persistence integration:

- **Controllers:** define HTTP endpoints, apply guards and validation, and return responses.
- **Services/providers:** implement use cases such as roadmap creation, readiness scoring, and resume analysis through dependency injection.
- **Repositories:** isolate PostgreSQL queries and transactions behind injectable providers.
- **AI orchestration module:** prepares safe prompts, invokes the AI provider, validates structured output, and records usage.
- **Background worker (proposed):** execute long-running work such as resume extraction and AI analysis from Redis-backed jobs after the queue and worker approach are confirmed.
- **Cross-cutting concerns:** use NestJS guards, pipes, filters, interceptors, and middleware for authorization, validation, rate limits, error handling, logging, and audit events.

Feature modules should initially include authentication, profiles, target roles, skill assessments, roadmaps, progress, resumes, AI guidance, and notifications.

## 4. Data flow

1. A user completes onboarding with their current experience, skills, desired role, and availability.
2. The web app validates the form and submits it to the API over HTTPS.
3. The API verifies the session, validates the request, and stores the profile and goal in PostgreSQL.
4. The API calculates deterministic inputs, such as known skills and available time, then requests AI-assisted recommendations when needed.
5. The resulting roadmap, milestones, and tasks are stored in PostgreSQL and returned to the client.
6. As users complete tasks or projects, the API records progress and recomputes readiness indicators.
7. If Redis and the background worker are adopted, Redis will cache frequently read data and coordinate asynchronous tasks; PostgreSQL remains the source of truth.

## 5. AI flow

1. The user requests an action such as roadmap generation, resume feedback, or interview-question practice.
2. The API checks authorization, quota, rate limits, and input size.
3. The AI orchestration layer combines the request with role requirements and relevant user context, minimizing personally identifiable information.
4. The API sends a versioned prompt to the selected AI provider and requests structured output.
5. The response is validated against a schema. Invalid, unsafe, or incomplete output is retried, safely rejected, or converted into a fallback response.
6. Valid results are saved with prompt/version metadata and returned to the user.

AI output is advisory. The product should state that it does not guarantee employment outcomes and should avoid presenting recommendations as factual hiring decisions.

## 6. Authentication flow

1. If an authentication provider is adopted, a user signs up or signs in through the selected provider.
2. The provider verifies credentials or OAuth consent and issues a secure session or token.
3. The web app sends the session/token over HTTPS with API requests.
4. The API verifies its signature, expiry, issuer, and audience before loading the user identity.
5. Authorization checks ensure users can access only their own profiles, resumes, roadmaps, and progress records.
6. Logout or revocation invalidates the session according to the provider's supported mechanism.

Secrets and raw credentials must never be stored in application logs. Session cookies should be `HttpOnly`, `Secure`, and `SameSite` where cookie-based authentication is used.

## 7. Resume processing flow

1. The user uploads a resume through the web app.
2. The API validates ownership, file type, size, and malware-scan status before accepting it.
3. If S3-compatible object storage is adopted, the original file is stored privately there; PostgreSQL stores metadata and processing status.
4. If the background worker is adopted, it extracts text and sends only the necessary content to the selected AI provider for analysis.
5. The service validates and stores structured feedback, such as missing role keywords, strengths, and suggested improvements.
6. The user reviews the feedback in the web app. They can replace or delete the resume and its derived data.

Resumes are highly sensitive personal data. Apply encryption in transit and at rest, short retention defaults, access controls, and deletion support.

## 8. Deployment architecture

- **Web app:** deploy Next.js as a managed web service or container behind HTTPS and a CDN.
- **API:** deploy NestJS as horizontally scalable containers behind a load balancer.
- **Proposed background worker:** deploy separately from the API so long-running AI and document jobs do not block requests.
- **PostgreSQL:** use a managed service with private network access, backups, monitoring, and encryption.
- **Proposed Redis:** use a managed service with private network access, monitoring, and encryption if it is adopted.
- **Proposed object storage:** use private, encrypted S3-compatible storage for uploaded resumes if it is adopted.
- **Configuration and secrets:** inject through a managed secrets service; never commit them to source control.
- **Observability:** centralize structured logs, metrics, traces, error reporting, and alerts.

Separate development, staging, and production environments. CI should run linting, tests, and security checks before deployment; production releases should support rollback.

## 9. Major risks

| Risk | Impact | Initial mitigation |
| --- | --- | --- |
| Inaccurate or generic AI guidance | Reduced user trust and poor career decisions | Use structured prompts, validation, evaluation datasets, feedback controls, and clear advisory language |
| Exposure of resume or profile data | Privacy and compliance harm | Minimize data, encrypt it, restrict access, scan uploads, and provide deletion controls |
| AI cost or provider rate limits | Unpredictable costs and slow features | Set quotas, cache safe results, queue jobs, monitor spend, and abstract the provider |
| Resume-processing failures | Broken core user journey | Use asynchronous jobs, status visibility, retries, and a manual retry path |
| Weak readiness scoring | Misleading job-readiness claims | Make scoring explainable, show evidence and gaps, and validate it with users and recruiters |
| Monorepo dependency drift | Build and deployment instability | Enforce shared linting, type checks, dependency policies, and CI validation |

## 10. Open questions

- Which authentication provider and sign-in methods will be used?
- Will the product support only one region at launch, and what data residency requirements apply?
- Which object-storage provider will hold resumes, and how long should originals and extracted text be retained?
- What exact role taxonomy and skill framework will power skill-gap analysis?
- How will readiness be scored, explained, and validated?
- What AI model, quota limits, fallback behavior, and cost budget are required for launch?
- Is Discord required for the first release, or should it follow the web experience?
- Which deployment platform and CI/CD provider should be selected?
- What accessibility, privacy, and legal requirements apply to the first release?

## 11. Architectural block diagram

```mermaid
flowchart TB
    User[User]
    Browser[Browser]
    AuthLayer[Next.js authentication layer<br/>proposed]
    AccessToken[API access token]
    API[NestJS API]
    UploadRecord[Create upload record]
    Storage[Private object storage<br/>S3-compatible, proposed]
    Queue[Queue<br/>Redis, proposed]
    Worker[Resume worker<br/>proposed]
    Extraction[Text extraction]
    Gateway[AI gateway]
    Result[Structured result]
    Database[(PostgreSQL)]
    Status[Web polls / receives status]
    Cron[Cron job]
    Discord[Discord<br/>daily notification, deferred]

    User --> Browser --> AuthLayer --> AccessToken --> API --> UploadRecord --> Storage --> Queue --> Worker --> Extraction --> Gateway --> Result --> Database --> Status
    Status --> Browser
    Cron -->|daily schedule| API
    API -->|pending-task reminders| Discord
    User -->|update task| Discord
    Discord -->|update task| Database
```

The browser authenticates through the proposed Next.js authentication layer and sends an API access token to the confirmed NestJS API before starting an upload. S3-compatible storage, Redis-backed queue, and the resume worker are proposed components; the worker records the structured analysis result in PostgreSQL, after which the web application retrieves the processing status. A cron job also triggers the API daily to send pending-task reminders through Discord, where users can update their task status directly.
