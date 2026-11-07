// .github/scripts/pr-reviewer.js
const token = process.env.GITHUB_TOKEN;
const rawApiKey = process.env.GEMINI_API_KEY || "";
const apiKey = rawApiKey.trim();
const repo = process.env.REPOSITORY;
const prNumber = process.env.PR_NUMBER;

const BOT_SIGNATURE = "### 🤖 Senior Full-Stack Engineer AI Review";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGitHub(url, options = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AI-PR-Reviewer",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `GitHub API error (${res.status} ${res.statusText}): ${errorBody}`,
    );
  }

  return res.json();
}

async function fetchDiff() {
  const diffRes = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "AI-PR-Reviewer",
      },
    },
  );

  if (!diffRes.ok) {
    const errorBody = await diffRes.text().catch(() => "");
    throw new Error(
      `Failed to fetch PR diff (${diffRes.status} ${diffRes.statusText}): ${errorBody}`,
    );
  }

  return diffRes.text();
}

function cleanDiff(diff) {
  const chunks = diff.split(/(?=diff --git )/);
  const ignoredPatterns = [
    /package-lock\.json/,
    /pnpm-lock\.yaml/,
    /yarn\.lock/,
    /\.tsbuildinfo/,
    /\.map$/,
  ];

  const filtered = chunks.map((chunk) => {
    const firstLine = chunk.split("\n")[0];
    const isIgnored = ignoredPatterns.some((pattern) =>
      pattern.test(firstLine),
    );
    if (isIgnored) {
      return `${firstLine}\n[Generated / binary lockfile diff omitted from AI review]\n`;
    }
    return chunk;
  });

  return filtered.join("");
}

async function postOrUpdateComment(content) {
  const fullBody = `${BOT_SIGNATURE}\n\n${content}`;

  try {
    const comments = await fetchGitHub(
      `/repos/${repo}/issues/${prNumber}/comments`,
    );
    const existing = Array.isArray(comments)
      ? comments.find((c) => c.body && c.body.includes(BOT_SIGNATURE))
      : null;

    if (existing) {
      console.log(`Updating existing PR comment (ID: ${existing.id})...`);
      await fetchGitHub(`/repos/${repo}/issues/comments/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: fullBody }),
      });
      console.log("PR comment updated successfully.");
      return;
    }
  } catch (err) {
    console.warn(
      "Could not inspect existing comments, creating a new comment instead:",
      err.message,
    );
  }

  console.log("Posting new PR comment...");
  await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: fullBody }),
  });
  console.log("PR comment created successfully.");
}

async function callGemini(prompt) {
  const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
  ].filter(Boolean);

  const models = [...new Set(candidateModels)];
  let lastError = null;

  for (const model of models) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(
        `[Attempt ${attempt}/${maxRetries}] Generating review with model: ${model}...`,
      );
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 3000,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(
            `Gemini API error with model ${model} (HTTP ${res.status}):`,
            JSON.stringify(data, null, 2),
          );
          lastError = new Error(
            `Gemini API HTTP ${res.status}: ${data.error?.message || res.statusText || "Unknown error"}`,
          );

          // If the API key itself is invalid or unauthorized, fail immediately
          if (
            res.status === 400 &&
            data.error?.message?.toLowerCase().includes("api key")
          ) {
            throw lastError;
          }
          if (res.status === 403) {
            throw lastError;
          }

          // If transient error (503 Service Unavailable or 429 Rate Limit), retry with backoff
          if (
            (res.status === 503 || res.status === 429) &&
            attempt < maxRetries
          ) {
            const backoffMs = attempt * 2500;
            console.log(
              `Transient error (${res.status}) on ${model}. Retrying in ${backoffMs}ms...`,
            );
            await sleep(backoffMs);
            continue;
          }

          break;
        }

        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) {
          const finishReason = candidate?.finishReason || "UNKNOWN";
          const blockReason = data.promptFeedback?.blockReason;
          console.warn(
            `No text in candidate for model ${model}. finishReason: ${finishReason}, blockReason: ${blockReason}`,
          );
          lastError = new Error(
            `Model returned no content (finishReason: ${finishReason}${blockReason ? `, blockReason: ${blockReason}` : ""})`,
          );
          break;
        }

        console.log(`Successfully generated review using model: ${model}`);
        return text;
      } catch (err) {
        console.error(
          `Call failed for model ${model} (attempt ${attempt}):`,
          err.message,
        );
        lastError = err;
        if (
          err.message.toLowerCase().includes("api key") ||
          err.message.includes("403")
        ) {
          throw err;
        }
        if (attempt < maxRetries) {
          await sleep(attempt * 2000);
        }
      }
    }
  }

  throw lastError || new Error("All model attempts failed to generate review.");
}

async function run() {
  console.log(
    `Starting Senior Full-Stack Engineer AI Review for ${repo} PR #${prNumber}...`,
  );

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable.");
  }
  if (!repo || !prNumber) {
    throw new Error("Missing REPOSITORY or PR_NUMBER environment variables.");
  }
  if (!apiKey) {
    const missingKeyMsg =
      "⚠️ **AI Review Skipped:** `GEMINI_API_KEY` secret is missing or empty in GitHub repository settings.\n\nTo enable automated AI code reviews, add a valid Gemini API key in **Settings → Secrets and variables → Actions → Repository secrets** named `GEMINI_API_KEY`.";
    console.error("Missing GEMINI_API_KEY secret.");
    await postOrUpdateComment(missingKeyMsg);
    process.exit(1);
  }

  // 1. Fetch PR Diff from GitHub API
  const rawDiff = await fetchDiff();
  if (!rawDiff || !rawDiff.trim()) {
    console.log("Empty diff, skipping review.");
    return;
  }

  const cleanedDiff = cleanDiff(rawDiff);
  const maxDiffLength = 65000;
  const truncatedDiff =
    cleanedDiff.length > maxDiffLength
      ? cleanedDiff.slice(0, maxDiffLength) +
        "\n\n[Diff truncated for context limits...]"
      : cleanedDiff;

  // 2. Construct Specialized Prompt with Full-Stack Monorepo Review Criteria
  const prompt = `
You are a pragmatic, battle-tested Senior Staff Software Engineer and Full-Stack Architect conducting a comprehensive code review for a TypeScript Monorepo (Next.js web frontend + NestJS API backend).

Evaluate the following pull request code changes against the five core engineering pillars below:

---
### 1. Framework-Specific Expertise
- **Next.js Optimization:**
  - Audit App Router vs. Pages Router architectures.
  - Distinguish Server Components from Client Components. Ask: *"Did you mark this component with 'use client' unnecessarily?"* (Ensure components stay Server Components unless they need interactive hooks like useState, useEffect, or browser APIs).
  - Check data fetching strategies (fetch caching, ISR, SSR, revalidation).
  - Verify optimization of Core Web Vitals (proper use of Next.js Image, Font, and Script components).
- **NestJS Architecture:**
  - Enforce clean NestJS design patterns: proper Dependency Injection (DI), modularization via @Module(), dedicated Controllers, and injectable Services.
  - Check correct usage of Guards (authentication/authorization), Interceptors (logging/transforming/caching), and Pipes (validation/transformation).

### 2. Language & Full-Stack Synergy
- **TypeScript Mastery:**
  - Enforce strict type safety across packages and workspaces.
  - Flag any use of 'any', improper type assertions ('as any'), or missing generic constraints.
  - Check for rigorous type alignment between frontend models and backend contracts.
- **Shared Contract & E2E Validation:**
  - Verify that backend API changes in NestJS do not break the Next.js frontend.
  - Ask: *"Did you change a backend DTO/endpoint response without updating the matching frontend API call or client type?"*
  - Ensure shared Monorepo DTOs or OpenAPI/Swagger/TRPC contracts are maintained.

### 3. Data, State, & Performance
- **State Management Audit:**
  - Review state management choices in Next.js (Zustand, Redux, React Context, or local component state) to prevent unnecessary cascading re-renders.
- **Database & ORM Efficiency:**
  - In NestJS database interactions (Prisma / TypeORM / Raw SQL), catch N+1 query patterns, missing database indexes on foreign keys and filter columns, unhandled migrations, and improper connection pooling.
  - Ask: *"Will this database query block the event loop under heavy load?"*
- **Validation & Serialization:**
  - Ask: *"Does this NestJS controller validate the request body before passing it to the service?"*
  - Ensure incoming payloads are strictly validated using class-validator decorators (@IsString, @IsNotEmpty, etc.) and class-transformer (ValidationPipe with whitelist/transform: true).

### 4. Security & Authentication
- **Next.js Security:**
  - Audit for XSS vulnerabilities, unsanitized HTML injections, and insecure cookie handling (enforce HttpOnly, SameSite, Secure).
  - Verify sensitive secrets and environment variables are NEVER exposed to client bundles (catch missing or misplaced NEXT_PUBLIC_ prefixes).
- **NestJS Security:**
  - Ensure endpoints are explicitly protected with appropriate authentication guards (JWT, AuthGuard, API keys).
  - Verify Role-Based Access Control (RBAC) and resource ownership boundaries (prevent IDOR vulnerabilities).

### 5. Code Quality & Testing Strategies
- **Testing Conventions:**
  - Verify adequate test coverage: unit/integration tests with Vitest/Jest for NestJS services/controllers, and unit/component/E2E tests (Vitest, Testing Library, Playwright, Cypress) for Next.js.
- **Error Handling & Resilience:**
  - Catch unhandled promises and missing try/catch blocks in backend asynchronous logic.
  - Ensure Next.js applications leverage proper error boundaries (error.tsx / error.js) and suspense fallbacks (loading.tsx) to prevent full application crashes.
---

### Review Output Format:
Structure your response clearly with these sections:
1. **Summary of Changes**: 2-3 sentence overview of what this PR introduces.
2. **Critical Issues / Blockers**: Bugs, security vulnerabilities, breaking contract changes, or architectural violations (if none, explicitly state "None identified").
3. **Optimizations & Architecture Feedback**: Concrete suggestions organized by Next.js / NestJS / TypeScript / Database / Security. Include specific file references and code snippets where applicable.
4. **Testing & Resilience Verification**: Observations regarding test coverage and edge-case handling.
5. **Verdict**: Explicit recommendation (**LGTM / Approve**, **Approve with Suggestions**, or **Request Changes**).

Keep your tone direct, constructive, and actionable.

--- GIT DIFF ---
\`\`\`diff
${truncatedDiff}
\`\`\`
`.trim();

  console.log("Sending code diff to Gemini API for full-stack review...");

  let reviewComment;
  try {
    reviewComment = await callGemini(prompt);
  } catch (err) {
    const errorNotice = `⚠️ **AI Review Generation Failed**\n\nThe AI reviewer encountered an error while communicating with Gemini API:\n\`\`\`\n${err.message}\n\`\`\`\n**Next Steps:**\n- Verify that \`GEMINI_API_KEY\` in GitHub repository secrets is valid and has not expired.\n- Ensure the Google Generative Language API is enabled for the key.`;
    await postOrUpdateComment(errorNotice);
    throw err;
  }

  // 3. Post or update the review feedback on the PR
  await postOrUpdateComment(reviewComment);
  console.log("AI Code Review completed and posted successfully!");
}

run().catch((err) => {
  console.error("Error running AI reviewer:", err);
  process.exit(1);
});
