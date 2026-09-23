// .github/scripts/pr-reviewer.js
const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;
const repo = process.env.REPOSITORY;
const prNumber = process.env.PR_NUMBER;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY secret.");
  process.exit(1);
}

async function fetchGitHub(url, options = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "AI-PR-Reviewer",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
  return res.json();
}

async function run() {
  console.log(`Starting Senior Engineer AI Review for ${repo} PR #${prNumber}...`);

  // 1. Read project context dynamically from the repository
  let projectContext = "No explicit project context found.";
  const contextPath = path.join(process.cwd(), 'career-switch-assistant-project-context.md');
  if (fs.existsSync(contextPath)) {
    projectContext = fs.readFileSync(contextPath, 'utf8');
    console.log("Successfully loaded project working context for review guidelines.");
  } else {
    console.warn("Project context file not found at root, proceeding with default rules.");
  }

  // 2. Fetch PR Diff from GitHub API
  const diffRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3.diff",
      "User-Agent": "AI-PR-Reviewer",
    }
  });
  const diffText = await diffRes.text();

  if (!diffText.trim()) {
    console.log("Empty diff, skipping review.");
    return;
  }

  // 3. Construct Prompt combining Project Working Context + Git Diff
  const prompt = `
You are a strict, pragmatic Senior Staff Software Engineer and Product Architect reviewing a Pull Request.
Evaluate the following pull request code changes against our project's working context, rules, and current milestone expectations.

--- PROJECT WORKING CONTEXT ---
${projectContext}
-------------------------------

Instructions for your review:
1. Check for architectural boundary violations (e.g., modular monolith rules, domain logic leaking into frameworks).
2. Ensure no out-of-scope code or premature complexity (like unapproved infrastructure or tech stacks) has leaked into the current milestone[cite: 1].
3. Validate type safety, potential bug risks, and adherence to engineering standards[cite: 1].

Keep your feedback concise, actionable, and formatted in professional bullet points. Do not comment on trivial formatting.

--- GIT DIFF ---
\`\`\`diff
${diffText.slice(f => f, 15000)}
\`\`\`
  `;

  console.log("Sending code diff and project context to Gemini API...");

  // 4. Call Gemini API (using gemini-1.5-flash for speed and reliability)
  const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const aiData = await aiRes.json();
  const reviewComment = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "No review comments generated.";

  // 5. Post the review feedback back to the PR
  console.log("Posting review comment to GitHub PR...");
  await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body: `### 🤖 Senior Engineer AI Review\n\n${reviewComment}`
    })
  });

  console.log("AI Code Review completed and posted successfully!");
}

run().catch(err => {
  console.error("Error running AI reviewer:", err);
  process.exit(1);
});