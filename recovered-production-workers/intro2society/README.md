# Recovered production Worker source

This folder preserves the source snapshot of the `intro2society` main website Worker retrieved from Cloudflare on 2026-11-25. The reviewed source has since been extended with the shared public-web research integration.

- `worker.js` is the reviewed website Worker source used by the deployment script.
- The Worker is still deployed through a guarded Cloudflare API upload rather than a standalone Wrangler project.
- The deployment script reads the live Worker settings and current version exports, preserves existing bindings and Durable Object exports, and adds the named research entrypoint to the existing `AGENT_STARTER` service binding.
- It keeps secret and workflow bindings from the previous version; it does not read or print secret values.
- Do not replace this script with a blind upload. Preserve the existing Durable Object namespaces, workflow binding, KV namespace, AI binding, rate limiter, compatibility settings, observability, and routes.

## Shared public-web research

The website chat and image-generation routes call the private `WebResearchService` RPC entrypoint on `agent-starter` through the `AGENT_STARTER` service binding.

Production requirements:
- `agent-starter` exports the named `WebResearchService` WorkerEntrypoint.
- `intro2society` binds `AGENT_STARTER` to service `agent-starter` with entrypoint `WebResearchService`.
- The agent Worker has its Brave Search key and Browser Run binding configured.

The main website does not need the research bearer token for this RPC path. The legacy authenticated HTTP research endpoint and secret are retained for compatibility. No secret is sent to the browser.

The deployment workflow deploys the agent Worker before updating the website Worker, then smoke-tests live chat and image generation. Public-web results are research references, not verified facts; page content is untrusted and access controls are not bypassed.
