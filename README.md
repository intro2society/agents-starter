# Intro2Society Business Research Agent

A Cloudflare Workers AI chat agent for researching, comparing, and organizing practical business opportunities.

The live Cloudflare Worker is `agent-starter`; this repository (`intro2society/agents-starter`) is its source of truth.

## Features

- **AI chat** powered by Cloudflare Workers AI.
- **Public web research** through Brave Search, with source titles, URLs, and dates when available.
- **Source verification** by reading public HTTPS webpages.
- **Persistent opportunity library** stored in the agent's SQLite-backed Durable Object.
- **Scheduled research** with saved reports and task status.
- **MCP integrations** for additional connected tools.
- **Approval-gated calculations** for larger numeric inputs.

The agent is designed to distinguish verified facts, estimates, and hypotheses. It must not fabricate sources or figures, bypass access controls, contact people, submit forms, purchase items, or spend money.

## Requirements

- Node.js 22 or later.
- A Cloudflare account with Workers AI enabled.
- The `AI` binding and `ChatAgent` Durable Object configured by `wrangler.jsonc`.
- A Brave Search API key for web-search functionality.

## Agent memory and privacy

The chat UI assigns each browser profile a random visitor-specific Durable Object name, so separate visitors do not share the same ChatAgent conversation or opportunity library. This identifier is stored in that browser profile and does not synchronize across devices. Clearing browser storage creates a new visitor identity.

Optional semantic long-term memory is integrated through Mem0 Platform. To activate it, add a Worker secret named `MEM0_API_KEY` to `agent-starter`. Without that secret, the existing Cloudflare Durable Object chat history and opportunity library continue to work. Never put the key in browser code or commit it to Git. See [the agent optimization map](docs/agent-optimization.md) for the upstream projects and deployment boundaries.

## Configure web search

In Cloudflare, open **Workers & Pages → agent-starter → Settings → Variables and Secrets**. Add a secret named:

```text
BRAVE_SEARCH_API_KEY
```

Enter the Brave Search API key in Cloudflare's secret-value field. Do not commit it to Git or place it in client-side code.

Without this secret, chat can still load, but the `searchWeb` tool will report that web search is not configured. Public page reading does not require the Brave key.

## Configure AI model selection

You can override model selection through Worker secrets/variables:

```text
AI_CHAT_MODEL
AI_TASK_MODEL
```

Defaults used when not set:

- `AI_CHAT_MODEL` → `@cf/deepseek-ai/deepseek-v4.1-flash-1017`
- `AI_TASK_MODEL` → `@cf/google/gemma-4-26b-a4b-it`

## Configure affiliate links for website monetization

The chat UI includes an affiliate-link banner. You can manage those links via one Worker secret:

```text
AFFILIATE_LINKS_JSON
```

Example value:

```json
[
  {
    "label": "Your Coursera Partner Link",
    "url": "https://your-affiliate-link.example/coursera"
  },
  {
    "label": "Your Audible Partner Link",
    "url": "https://your-affiliate-link.example/audible"
  }
]
```

The Worker exposes the configured links at:

```text
GET /api/affiliate-links
```

If this secret is missing or invalid, the app falls back to default affiliate-network links.

## Health endpoint

The Worker exposes a lightweight health endpoint:

```text
GET /api/health
```

## Local development

```bash
npm ci
npm run dev
```

The project uses remote Workers AI during local development, so Wrangler authentication is required.

## Quality checks

```bash
npm run check
npm run test:memory
npx vite build
```

## Deploy

```bash
npm run deploy
```

The deployment script builds the application and deploys the Worker. If `BRAVE_SEARCH_API_KEY` and/or `AFFILIATE_LINKS_JSON` are provided securely in the build environment, it also updates those Worker secrets. A secret already configured directly on the Worker should be retained across ordinary code deployments.

## Probate research portal

A standalone public-record research portal is deployed at:

`https://theintro2society.org/probate`

The portal is served by the Cloudflare Worker `probate-portal`. Its public-web search form sends requests to `/api/probate-search`, which is routed to the `agent-starter` Worker and uses the existing `BRAVE_SEARCH_API_KEY` secret. The original site routes remain assigned to the existing `intro2society` Worker.

The main Intro2Society homepage now includes a visible link to the portal. The portal stores saved leads in the visitor's browser local storage on that device. It is not a shared account database or a direct Circuit Court records integration. Search results are leads only and must be independently confirmed with the appropriate Circuit Court clerk. Do not store confidential or sensitive personal information in the portal.

The standalone Worker source is `workers/probate-portal.js`. Its route is managed in Cloudflare for `theintro2society.org/probate*`; the API route `theintro2society.org/api/probate-search*` targets `agent-starter`.

## Main project files

- `src/server.ts` — chat agent, research tools, opportunity library, and scheduled reports.
- `src/featureApi.ts` — feature API handlers.
- `src/memoryWorker.ts` — memory-worker registration helpers.
- `src/app.tsx` — chat interface.
- `wrangler.jsonc` — Worker, AI, and Durable Object configuration.
- `.github/workflows/ci.yml` — formatting, lint, TypeScript, tests, and production build.
