# Intro2Society Chief of Staff

The Chief of Staff is implemented inside the existing agent-starter ChatAgent. It reuses the existing Cloudflare Agents SDK, per-visitor SQLite-backed Durable Object storage, and the existing internal service-hub binding. It does not create a competing orchestration Worker or change production routes.

## Capabilities

- Read-only health checks for the AI agent, probate portal, community blackboard, and probate scraper through INTRO2SOCIETY_HUB.
- Private per-ChatAgent task register with role, objective, status, notes, and timestamps.
- Private approval-request register with pending, approved, and rejected states.
- Chief of Staff operating instructions for research, verification, operations, business analysis, and administration.

## Privacy boundary

Task and approval records live in the current ChatAgent's Durable Object. They are not a shared organization-wide task database and are not visible to other visitor sessions. The current public chat identity is browser-profile based, not a verified account identity. Do not use this implementation as a shared administrator console until authenticated, server-owned identity and authorization are implemented.

## Approval boundary

Research, analysis, internal task tracking, and read-only health checks can run without additional approval. Production deployment, publishing, purchases, payments, account creation, external communications, and other consequential actions require explicit approval for the specific action. Recording an approval request or recording the user's decision does not execute that action.

## Validation

The CI suite includes a regression test for the Chief of Staff approval instructions. The existing service-hub tests continue to verify route allowlisting, downstream health checks, request forwarding, and failure handling.
