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

## Configure web search

In Cloudflare, open **Workers & Pages → agent-starter → Settings → Variables and Secrets**. Add a secret named:

```text
BRAVE_SEARCH_API_KEY
```

Enter the Brave Search API key in Cloudflare's secret-value field. Do not commit it to Git or place it in client-side code.

Without this secret, chat can still load, but the `searchWeb` tool will report that web search is not configured. Public page reading does not require the Brave key.

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

The deployment script builds the application and deploys the Worker. If `BRAVE_SEARCH_API_KEY` is provided securely in the build environment, it also updates the Worker secret. A secret already configured directly on the Worker should be retained across ordinary code deployments.

## Main project files

- `src/server.ts` — chat agent, research tools, opportunity library, and scheduled reports.
- `src/featureApi.ts` — feature API handlers.
- `src/memoryWorker.ts` — memory-worker registration helpers.
- `src/app.tsx` — chat interface.
- `wrangler.jsonc` — Worker, AI, and Durable Object configuration.
- `.github/workflows/ci.yml` — formatting, lint, TypeScript, tests, and production build.

