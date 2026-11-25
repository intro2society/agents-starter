# Intro2Society internal service hub

The `intro2society-service-hub` Worker is a narrow internal gateway for three existing services. It uses Cloudflare Service Bindings; it does not call public Worker URLs.

## Caller-to-service map

| Public path | Service binding | Existing Worker |
| --- | --- | --- |
| `/probate` and `/probate/*` | `PROBATE_PORTAL` | `probate-portal` |
| `/blackboard` and `/blackboard/*` | `COMMUNITY_BLACKBOARD` | `community-blackboard` |
| `/api/probate-search` | `AGENT_STARTER` | `agent-starter` |

Only the hub declares these three service bindings. The downstream Workers do not need reciprocal bindings.

## Health checks

- `GET /__hub/health` checks that the gateway is running.
- `GET /__hub/check` calls each downstream Worker through its service binding:
  - `agent-starter`: `GET /api/health`
  - `probate-portal`: `GET /probate`
  - `community-blackboard`: `GET /blackboard/health`

The health-check endpoint reports status codes only, not response bodies or secrets.

## Deploy and validate

Use the repository's pinned Wrangler version:

```bash
npx wrangler deploy --config wrangler.hub.jsonc
```

The config disables the public workers.dev hostname. The gateway should be attached only to the three intended zone routes after its bindings have been verified.

Run unit tests with:

```bash
node --test workers/service-hub/worker.test.js
```

Do not delete or rename the existing service Workers as part of this change.
