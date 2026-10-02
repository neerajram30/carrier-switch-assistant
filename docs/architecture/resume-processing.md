# Resume Processing Architecture

## 1. Overview

This document specifies the technical architecture for the asynchronous resume processing pipeline in Career Switch Assistant.

It defines the boundaries and contracts spanning file ingestion, temporary storage, AI-driven extraction, and review handoff without prematurely coupling the system to a single cloud vendor or AI model provider.

---

## 2. End-to-End Processing Pipeline

```text
[ Frontend (Next.js) ]
         │  File upload (PDF/DOCX <= 5 MB)
         ▼
[ API Gateway (NestJS) ]
         │  Validation & authentication
         ▼
[ Storage Boundary ]
         │  Ephemeral object / staged buffer
         ▼
[ Processing Worker ]
         │  Text extraction & document normalization
         ▼
[ AI Extraction Service ]
         │  Structured profile schema prompt
         ▼
[ Structured Candidate Profile ]
         │  Untrusted candidate draft
         ▼
[ User Review & Correction UI ]
         │  User verifies & commits
         ▼
[ PostgreSQL System of Record ]
```

---

## 3. Architecture Boundaries & Engineering Slices

To maintain disciplined software delivery and clean rollback boundaries, implementation is organized into four distinct engineering tasks:

| Ticket ID | Slice Name | Scope & Boundary |
| :--- | :--- | :--- |
| **ENG-004C** | Slice A — UI | Next.js upload screen, client validation, manual fallback, loading/error UI states (mocked client state). |
| **ENG-005** | Slice B — Upload Infrastructure | NestJS upload endpoint, file type & size validation, upload authorization, and storage boundary. |
| **ENG-006** | Slice C — AI Extraction | Document text extraction, AI provider integration, structured profile schema enforcement, partial extraction handling. |
| **ENG-007** | Slice D — Review & Commit | Review UI, manual inline corrections, explicit user commit to PostgreSQL profile persistence. |

---

## 4. Ingestion & Storage Boundary (ENG-005)

The storage boundary handles uploaded document files prior to extraction. We evaluate three potential topologies during technical design for ENG-005:

```text
Option 1: Direct Client to Object Storage
Browser ──(Presigned URL)──> S3 / Object Storage ──(Event)──> Extraction Worker

Option 2: API Staged Ephemeral Object
Browser ──(Multipart)──> NestJS API ──> Temporary Object Storage ──> Worker/Service ──> Delete

Option 3: Direct In-Memory Stream Processing
Browser ──(Multipart)──> NestJS API ──> Memory Buffer / Pipe ──> Extraction Service ──> Discard
```

### Storage Evaluation Criteria
- **File Size Ceiling:** Maximum resume size is strictly capped at 5 MB.
- **Data Privacy & Ephemeral Retention:** Resumes must not linger indefinitely. Storage must support automatic TTL expiration or immediate deletion post-extraction.
- **Resource Constraints:** Avoid memory spikes in the API server by streaming or staging larger files.
- **Deployment Complexity:** Favor simpler architecture (Option 2 or 3) during early development, scaling to asynchronous event queues (Option 1) as throughput demands grow.

---

## 5. AI Extraction Service & Vendor Evaluation (ENG-006)

The system extracts structured profile data (`currentRole`, `yearsOfExperience`, `skills`) from unstructured resume text.

### AI Provider Selection Policy
To avoid accidental vendor lock-in, the provider decision remains decoupled from application contracts. Candidates (such as Google Gemini, AWS Bedrock, OpenAI, or self-hosted models) will be evaluated against:

1. **Structured-Output Support:** Native support for strict JSON schemas without brittle markdown parsing.
2. **Document & Context Handling:** Ability to accurately extract dense chronological work history and technical competencies from 1–3 page resumes.
3. **Operational Cost & Free-Tier Economics:** Cost per extraction at baseline traffic and development tiers.
4. **Latency:** End-to-end extraction response time within acceptable interactive thresholds (<5 seconds).
5. **Data Privacy & Security:** Explicit contractual guarantees that uploaded resume data is not used for model training.
6. **Deployment Architecture:** Simplicity of integration with the existing Node.js/TypeScript backend stack.

### Structured Output Contract

The extraction service produces an untrusted candidate baseline draft adhering to a strictly validated TypeScript schema:

```typescript
export interface ExtractedProfileDraft {
  currentRole: string | null;
  yearsOfExperience: number | null; // e.g. 3.5
  skills: string[];
  extractionConfidence: {
    roleConfidence: 'high' | 'medium' | 'low';
    experienceConfidence: 'high' | 'medium' | 'low';
    skillsConfidence: 'high' | 'medium' | 'low';
  };
  warnings?: string[];
}
```

---

## 6. Trust, Safety & System of Record

1. **Untrusted Data Boundary:** All AI extraction outputs are treated as untrusted draft input. No extracted profile is saved directly to PostgreSQL without explicit human review and confirmation.
2. **Zero Plaintext Logging:** Resumes, personal names, contact info, and raw candidate text must never be logged to application log aggregators or monitoring services.
3. **Deterministic Fallbacks:** When extraction fails, times out, or yields low confidence, the UI falls back cleanly to the manual baseline creation flow without blocking the user.
