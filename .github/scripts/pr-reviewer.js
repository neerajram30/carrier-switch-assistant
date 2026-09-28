// .github/scripts/pr-reviewer.js
const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN;
const rawApiKey = process.env.GEMINI_API_KEY || '';
const apiKey = rawApiKey.trim();
const repo = process.env.REPOSITORY;
const prNumber = process.env.PR_NUMBER;

const BOT_SIGNATURE = '### 🤖 Senior Engineer AI Review';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGitHub(url, options = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AI-PR-Reviewer',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`GitHub API error (${res.status} ${res.statusText}): ${errorBody}`);
  }

  return res.json();
}

async function fetchDiff() {
  const diffRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3.diff',
      'User-Agent': 'AI-PR-Reviewer',
    },
  });

  if (!diffRes.ok) {
    const errorBody = await diffRes.text().catch(() => '');
    throw new Error(`Failed to fetch PR diff (${diffRes.status} ${diffRes.statusText}): ${errorBody}`);
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
    const firstLine = chunk.split('\n')[0];
    const isIgnored = ignoredPatterns.some((pattern) => pattern.test(firstLine));
    if (isIgnored) {
      return `${firstLine}\n[Generated / binary lockfile diff omitted from AI review]\n`;
    }
    return chunk;
  });

  return filtered.join('');
}

async function postOrUpdateComment(content) {
  const fullBody = `${BOT_SIGNATURE}\n\n${content}`;

  try {
    const comments = await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`);
    const existing = Array.isArray(comments)
      ? comments.find((c) => c.body && c.body.includes(BOT_SIGNATURE))
      : null;

    if (existing) {
      console.log(`Updating existing PR comment (ID: ${existing.id})...`);
      await fetchGitHub(`/repos/${repo}/issues/comments/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: fullBody }),
      });
      console.log('PR comment updated successfully.');
      return;
    }
  } catch (err) {
    console.warn('Could not inspect existing comments, creating a new comment instead:', err.message);
  }

  console.log('Posting new PR comment...');
  await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: fullBody }),
  });
  console.log('PR comment created successfully.');
}

async function callGemini(prompt) {
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash',
  ].filter(Boolean);

  const models = [...new Set(candidateModels)];
  let lastError = null;

  for (const model of models) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[Attempt ${attempt}/${maxRetries}] Generating review with model: ${model}...`);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2500,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(`Gemini API error with model ${model} (HTTP ${res.status}):`, JSON.stringify(data, null, 2));
          lastError = new Error(
            `Gemini API HTTP ${res.status}: ${data.error?.message || res.statusText || 'Unknown error'}`
          );

          // If the API key itself is invalid or unauthorized, fail immediately
          if (res.status === 400 && data.error?.message?.toLowerCase().includes('api key')) {
            throw lastError;
          }
          if (res.status === 403) {
            throw lastError;
          }

          // If transient error (503 Service Unavailable or 429 Rate Limit), retry with backoff
          if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
            const backoffMs = attempt * 2500;
            console.log(`Transient error (${res.status}) on ${model}. Retrying in ${backoffMs}ms...`);
            await sleep(backoffMs);
            continue;
          }

          // Otherwise break to try next model
          break;
        }

        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) {
          const finishReason = candidate?.finishReason || 'UNKNOWN';
          const blockReason = data.promptFeedback?.blockReason;
          console.warn(`No text in candidate for model ${model}. finishReason: ${finishReason}, blockReason: ${blockReason}`);
          lastError = new Error(
            `Model returned no content (finishReason: ${finishReason}${blockReason ? `, blockReason: ${blockReason}` : ''})`
          );
          break;
        }

        console.log(`Successfully generated review using model: ${model}`);
        return text;
      } catch (err) {
        console.error(`Call failed for model ${model} (attempt ${attempt}):`, err.message);
        lastError = err;
        if (err.message.toLowerCase().includes('api key') || err.message.includes('403')) {
          throw err;
        }
        if (attempt < maxRetries) {
          await sleep(attempt * 2000);
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed to generate review.');
}

async function run() {
  console.log(`Starting Senior Engineer AI Review for ${repo} PR #${prNumber}...`);

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable.');
  }
  if (!repo || !prNumber) {
    throw new Error('Missing REPOSITORY or PR_NUMBER environment variables.');
  }
  if (!apiKey) {
    const missingKeyMsg =
      '⚠️ **AI Review Skipped:** `GEMINI_API_KEY` secret is missing or empty in GitHub repository settings.\n\nTo enable automated AI code reviews, add a valid Gemini API key in **Settings → Secrets and variables → Actions → Repository secrets** named `GEMINI_API_KEY`.';
    console.error('Missing GEMINI_API_KEY secret.');
    await postOrUpdateComment(missingKeyMsg);
    process.exit(1);
  }

  // 1. Read project context dynamically from the repository
  let projectContext = 'No explicit project context found.';
  const contextPath = path.join(process.cwd(), 'career-switch-assistant-project-context.md');
  if (fs.existsSync(contextPath)) {
    projectContext = fs.readFileSync(contextPath, 'utf8');
    console.log('Successfully loaded project working context for review guidelines.');
  } else {
    console.warn('Project context file not found at root, proceeding with default rules.');
  }

  // 2. Fetch PR Diff from GitHub API
  const rawDiff = await fetchDiff();
  if (!rawDiff || !rawDiff.trim()) {
    console.log('Empty diff, skipping review.');
    return;
  }

  const cleanedDiff = cleanDiff(rawDiff);
  const maxDiffLength = 60000;
  const truncatedDiff =
    cleanedDiff.length > maxDiffLength
      ? cleanedDiff.slice(0, maxDiffLength) + '\n\n[Diff truncated for context limits...]'
      : cleanedDiff;

  // 3. Construct Prompt combining Project Working Context + Cleaned Diff
  const prompt = `
You are a strict, pragmatic Senior Staff Software Engineer and Product Architect reviewing a Pull Request.
Evaluate the following pull request code changes against our project's working context, rules, and current milestone expectations.

--- PROJECT WORKING CONTEXT ---
${projectContext}
-------------------------------

Instructions for your review:
1. Check for architectural boundary violations (e.g., modular monolith rules, domain logic leaking into frameworks).
2. Ensure no out-of-scope code or premature complexity (like unapproved infrastructure or tech stacks) has leaked into the current milestone.
3. Validate type safety, potential bug risks, and adherence to engineering standards.
4. Keep your feedback concise, actionable, and formatted in professional bullet points.
5. If the code meets all requirements and engineering standards without issues, summarize what was reviewed and give an explicit approval recommendation.

--- GIT DIFF ---
\`\`\`diff
${truncatedDiff}
\`\`\`
  `.trim();

  console.log('Sending code diff and project context to Gemini API...');

  let reviewComment;
  try {
    reviewComment = await callGemini(prompt);
  } catch (err) {
    const errorNotice = `⚠️ **AI Review Generation Failed**\n\nThe AI reviewer encountered an error while communicating with Gemini API:\n\`\`\`\n${err.message}\n\`\`\`\n**Next Steps:**\n- Verify that \`GEMINI_API_KEY\` in GitHub repository secrets is valid and has not expired.\n- Ensure the Google Generative Language API is enabled for the key.`;
    await postOrUpdateComment(errorNotice);
    throw err;
  }

  // 4. Post or update the review feedback on the PR
  await postOrUpdateComment(reviewComment);
  console.log('AI Code Review completed and posted successfully!');
}

run().catch((err) => {
  console.error('Error running AI reviewer:', err);
  process.exit(1);
});