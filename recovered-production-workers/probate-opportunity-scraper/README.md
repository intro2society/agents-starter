# Recovered nationwide probate research Worker

This is a source snapshot of the deployed `probate-opportunity-scraper` Worker retrieved from Cloudflare on 2026-11-26.

It currently provides:
- Official state judiciary starting points for all 50 states
- A browser-local research worksheet and CSV export
- A status endpoint that explicitly states automatic case harvesting is not enabled

This is not an automated court-record scraper. Future changes must preserve that distinction, protect user research notes, and verify the official court's access rules. Do not deploy without reconciling the current `DATA` KV binding and service bindings.

## Shared public-web research

The Worker now exposes a bounded `POST /api/research` endpoint through the existing service hub. It calls the private `WebResearchService` RPC entrypoint on `agent-starter`, which uses Brave Search and Browser Run to return a small set of public-web sources and rendered excerpts.

Production requirements:
- `AGENT_STARTER` service binding targeting `agent-starter`
- Existing `DATA` KV binding retained

The browser worksheet stores saved notes locally on the visitor's device. The private service binding does not expose a public API token to the browser. The API does not automatically harvest court dockets. Results are research leads only and must be confirmed with the relevant court and property records.


## Shared research rate limits

Research calls use a per-application, per-visitor-IP rate-limit key. Website chat/image requests use the `website:` prefix; probate workspace searches use `probate-scraper:`. This keeps one application's traffic from consuming the other application's visitor quota while retaining the configured 20 requests per minute per visitor per application.
