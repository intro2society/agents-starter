# Recovered production Worker source

This folder preserves the deployed source of the `intro2society` main website Worker as retrieved from the Cloudflare account on 2026-11-25.

- `worker.js` is a source snapshot of the currently deployed Worker script.
- This is a recovery copy, not yet a Wrangler-managed production project.
- It intentionally does not include secret values.
- Do not deploy this file directly without first reconciling its current Cloudflare bindings, Durable Object namespaces, workflows, KV namespaces, rate limits, compatibility settings, and production routes.
- Future changes should be reviewed against this snapshot and tested on a separate Worker before production deployment.

The snapshot is kept in Git so the production Worker can be managed safely through reviewed changes rather than blind replacement.

## Optional shared public-web research integration

The website Worker source now has an optional integration with the deployed `agent-starter` research API.

Before deploying this integration, configure all three items:

1. On `agent-starter`, add the Worker secret `WEB_RESEARCH_API_TOKEN`.
2. On `intro2society`, add the exact same secret value under the same name.
3. Add a service binding to the `intro2society` Worker:
   - Variable name: `AGENT_STARTER`
   - Service: `agent-starter`
   - Environment: `production`

Keep the token secret. Never put it in frontend JavaScript, source code, GitHub files, or chat messages. Without these settings, the website falls back to its existing chat and image-generation behavior.
