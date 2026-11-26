# Recovered nationwide probate research Worker

This is a source snapshot of the deployed `probate-opportunity-scraper` Worker retrieved from Cloudflare on 2026-11-26.

It currently provides:
- Official state judiciary starting points for all 50 states
- A browser-local research worksheet and CSV export
- A status endpoint that explicitly states automatic case harvesting is not enabled

This is not an automated court-record scraper. Future changes must preserve that distinction, protect user research notes, and verify the official court's access rules. Do not deploy without reconciling the current `DATA` KV binding and service bindings.
