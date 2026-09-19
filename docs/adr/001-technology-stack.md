# ADR 001: Technology Stack

<table border="1">
  <thead>
    <tr>
      <th>Area</th>
      <th>Decision</th>
      <th>Why</th>
      <th>Alternative</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Monorepo</td><td>npm workspaces</td><td>The is no complex task pipelines or remote caching at the moment, planning to add when project scales</td><td>Turborepo</td></tr>
    <tr><td>Frontend</td><td>Next.js</td><td>SEO, SSR</td><td>Vite</td></tr>
    <tr><td>Backend</td><td>Express</td><td>Used monorepo architecture so express uses Javascript/Typescript</td><td>Fastify / NestJS</td></tr>
    <tr><td>Database</td><td>PostgreSQL</td><td>The relations in the system are relational</td><td>MongoDB</td></tr>
    <tr><td>AI provider</td><td>Gemini initially</td><td>Free tier availability</td><td>AWS Bedrock</td></tr>
    <tr><td>UI</td><td>Tailwind CSS + Astryx</td><td>Works fulently with AI agents</td><td>shadcn/ui</td></tr>
    <tr><td>Testing</td><td>Vitest + React Testing Library + Playwright</td><td>Provides end to end testing</td><td>Jest</td></tr>
    <tr><td>Package manager</td><td>npm</td><td>pnpm cannot be used with npm workspace</td><td>pnpm</td></tr>
  </tbody>
</table>
