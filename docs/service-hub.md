# Intro2Society internal service hub

The `intro2society-service-hub` Worker is a narrow internal gateway for four existing services. It uses Cloudflare Service Bindings; it does not call public Worker URLs.

## Caller-to-service map

| Public path | Service binding | Existing Worker |
| --- | --- | --- |
| `/probate` and `/probate/` | `PROBATE_PORTAL` | `probate-portal` |
| `/blackboard`, `/blackboard/health`, and `/blackboard/api/*` | `COMMUNITY_BLACKBOARD` | `community-blackboard` |
| `/api/probate-search` | `AGENT_STARTER` | `agent-starter` |
| `scraper.theintro2society.org/*` | `PROBATE_SCRAPER` | `probate-opportunity-scraper` |

Only the hub declares the four downstream service bindings. The AI research Worker also has one caller-side binding back to the hub so its research tools can request the public probate directory; it calls only the scraper hostname, so it does not recurse into its own probate-search endpoint. The downstream Workers do not need reciprocal bindings.

## Health checks

The zone route `theintro2society.org/__hub/*` points to this gateway for monitoring.

- `GET /__hub/health` checks that the gateway is running.
- `GET /__hub/check` calls each downstream Worker through its service binding:
  - `agent-starter`: `GET /api/health`
  - `probate-portal`: `GET /probate`
  - `community-blackboard`: `GET /blackboard/health`
  - `probate-opportunity-scraper`: `GET /health`

The health-check endpoint reports status codes only, not response bodies or secrets.

## Monitoring and request tracing

Workers Logs, Traces, and automatic issue detection are enabled for the hub. Structured gateway logs record the selected binding, method, path, response status, duration, and a generated request ID. Query strings, request bodies, client IP addresses, and user content are not logged. The request ID is forwarded to the downstream Worker and returned in the `X-Request-Id` response header. Logs are sampled at 100%; traces are sampled at 10%. Query-string redaction is enabled in Cloudflare observability.

## Existing abuse protections

The gateway deliberately does not add a second global rate limiter, which could throttle normal page loads and duplicate service-level protections. Existing protections remain in the downstream services:

- `agent-starter` uses its Cloudflare rate-limit binding for POST and WebSocket requests and limits chat messages within each chat Durable Object.
- `community-blackboard` limits anonymous posts per daily-rotating salted network hash and prevents duplicate reports.
- `probate-portal` is a read-only research interface; its search API is handled by `agent-starter` and its rate limiter.

The hub forwards the original request headers, including Cloudflare's client-IP header, so downstream protections continue to work.

## Deploy and validate

After this change is merged, the GitHub deployment workflow will deploy both the main AI Worker and this service hub. Automatic deployment requires the repository Actions secret named `CLOUDFLARE_API_TOKEN`; do not place its value in source code or chat.

For a manual deployment, use the repository's pinned Wrangler version:

```bash
npx wrangler deploy --config wrangler.hub.jsonc
```

The config disables the public workers.dev hostname and declares the four service routes plus the dedicated `/__hub/*` monitoring route, so future Wrangler deployments preserve the same routing plan.

Run unit tests with:

```bash
node --test workers/service-hub/worker.test.js
```

Do not delete or rename the existing service Workers as part of this change.
