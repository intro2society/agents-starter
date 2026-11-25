# Intro2Society Business Research Agent

A Cloudflare Workers AI chat agent for researching, comparing, and organizing practical business opportunities.

The live Cloudflare Worker is `agent-starter`; this repository (`intro2society/agents-starter`) is its source of truth.

## Features

- **AI chat** powered by Cloudflare Workers AI.
- **Public web research** through Brave Search, with source titles, URLs, and dates when available.
- **Source verification** by reading public HTTPS webpages.
- **Browser Run research** for JavaScript-rendered page reading, bounded same-origin crawling, and image-reference research.
- **Image-generation web context** from current public search results and up to two rendered source pages when Brave Search and the Browser Run binding are configured.
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

## Configure rendered browsing and image research

The Worker uses Cloudflare Browser Run through a native `BROWSER` binding declared in `wrangler.jsonc`. The binding does not require a Cloudflare API token in Worker secrets.

The chat and scheduled research agents expose:
- `readRenderedWebPage` for JavaScript-rendered public pages.
- `crawlWebsite` for a bounded crawl of up to five pages, restricted to the starting page's origin.
- `researchImageReferences` for current public-web research to improve image concepts.

The image-generation endpoint also uses the configured `BRAVE_SEARCH_API_KEY` to retrieve current text references before generating an image. When Browser Run is available, it reads up to two public source pages. Set `useWebResearch: false` in the `/api/image-generation` JSON body to skip this extra research. You can optionally supply up to two `referenceUrls` to prioritize specific public sources.

This research supplies text context only; the FLUX image model does not directly browse websites or ingest webpage images. It creates an original image from the resulting prompt. Website content is treated as untrusted reference material, and the crawler does not bypass robots restrictions, logins, paywalls, or CAPTCHAs.

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

## Community blackboard and public website tools

The public site includes a persistent anonymous community board at `https://theintro2society.org/blackboard`. It is served by the separate Cloudflare Worker `community-blackboard`, which stores statements in SQLite-backed Durable Object storage. Posts are limited to 500 characters, links and obvious contact details are rejected, repeat submissions are rate-limited, and three reports hide a post. The board does not require names or accounts; it stores a temporary one-way network hash for rate limiting. The board is marked `noindex,nofollow` so visitor statements are not intentionally indexed by search engines.

The homepage also exposes `/tools` (loan payment, compound growth, percentage, and word-count utilities), `/resources` (crawlable editorial guidance), `/robots.txt`, and `/sitemap.xml`. The sitemap lists the homepage, tools, resources, and probate portal; it deliberately excludes the user-generated blackboard.

## Main project files

- `src/server.ts` — chat agent, research tools, opportunity library, and scheduled reports.
- `src/featureApi.ts` — feature API handlers.
- `src/memoryWorker.ts` — memory-worker registration helpers.
- `src/app.tsx` — chat interface.
- `wrangler.jsonc` — Worker, AI, and Durable Object configuration.
- `.github/workflows/ci.yml` — formatting, lint, TypeScript, tests, and production build.
