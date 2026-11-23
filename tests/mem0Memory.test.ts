import assert from "node:assert/strict";
import test from "node:test";
import { addMem0Memory, searchMem0Memory } from "../src/mem0Memory.ts";

test("adds memory using user-scoped Mem0 v3 API", async () => {
  let captured: { url: string; init?: RequestInit } | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    captured = { url: String(input), init };
    return Response.json({ event_id: "evt-test", status: "PENDING" });
  };
  const result = await addMem0Memory("secret", "visitor-123", "Remember this", fetcher);
  assert.equal(captured?.url, "https://api.mem0.ai/v3/memories/add/");
  assert.equal(new Headers(captured?.init?.headers).get("Authorization"), "Token secret");
  assert.equal(JSON.parse(String(captured?.init?.body)).user_id, "visitor-123");
  assert.equal((result as { status: string }).status, "PENDING");
});

test("searches memories with user isolation", async () => {
  let payload: Record<string, unknown> = {};
  const fetcher: typeof fetch = async (_input, init) => {
    payload = JSON.parse(String(init?.body));
    return Response.json({ results: [] });
  };
  await searchMem0Memory("secret", "visitor-456", "preferred market", fetcher);
  assert.equal((payload.filters as Record<string, string>).user_id, "visitor-456");
  assert.equal(payload.top_k, 5);
});

test("does not silently accept provider errors", async () => {
  const fetcher: typeof fetch = async () => new Response("failure", { status: 503 });
  await assert.rejects(() => searchMem0Memory("secret", "visitor-456", "query", fetcher), /HTTP 503/);
});
