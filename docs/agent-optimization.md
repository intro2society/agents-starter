# Agent optimization and integration map

This project runs on Cloudflare Workers and the Cloudflare Agents SDK. Keep runtime dependencies compatible with Workers rather than installing Python-first frameworks into the edge runtime.

## Existing foundation

- `agents` and `@cloudflare/ai-chat`: agent lifecycle, chat streaming, MCP tool registration, and persistent Durable Object state.
- `ChatAgent`: per-visitor agent instance, chat persistence, research tools, and a SQLite-backed opportunity library.
- Cloudflare Workflows: durable scheduled research and resumable multi-step tasks.
- Worker observability: Cloudflare logs and traces.

## Selected upstream projects

| Project | GitHub | Correct role in this platform | Integration status |
|---|---|---|---|
| Mem0 | https://github.com/mem0ai/mem0 | Semantic long-term memory for the Business Research Agent; scope records to a per-browser visitor ID | Optional REST adapter implemented; requires the `MEM0_API_KEY` Worker secret to activate |
| Langfuse | https://github.com/langfuse/langfuse | External prompt/trace/evaluation platform for agent debugging and quality review | Evaluated; do not enable until a self-hosted/managed endpoint and credentials are selected |
| Opik | https://github.com/comet-ml/opik | Alternative self-hostable tracing and evaluation platform | Evaluated as an alternative to Langfuse; do not install both |
| DeepEval | https://github.com/confident-ai/deepeval | Python-based CI evaluation harness for model/agent behavior | Candidate for a separate evaluation runner; not a Cloudflare Worker runtime dependency |

## Privacy and identity

The browser creates a random, persistent visitor identifier and uses it as the ChatAgent instance name. This isolates Durable Object chat history and Mem0 records by browser profile. It is not an account identity and does not synchronize across devices. Clearing browser storage creates a new identity.

Mem0 integration is optional. Without `MEM0_API_KEY`, the Business Research Agent continues to use its existing Durable Object chat persistence and opportunity library. Never place the key in client code or commit it to Git.

## Why no framework pile-up

LangGraph, CrewAI, AutoGen, and Python-only agent stacks would duplicate the existing Cloudflare Agents/Workflows runtime and add a separate deployment environment. Use the native runtime for orchestration; add specialized memory and evaluation services only where they fill a demonstrated gap.

## Activation

In Cloudflare Workers & Pages → `agent-starter` → Settings → Variables and Secrets, create a secret named `MEM0_API_KEY`. The value comes from a Mem0 Platform project. Once set, the agent exposes save/search long-term memory tools scoped to its visitor instance.
