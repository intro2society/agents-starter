import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMemoryWorkerUrl,
  DEFAULT_MEMORY_SERVER_NAME,
  DEFAULT_MEMORY_WORKER_BASE_URL,
  registerMemoryWorker
} from "../src/memoryWorker.ts";

test("builds the default user-scoped MCP SSE URL", () => {
  assert.equal(
    buildMemoryWorkerUrl("alice"),
    `${DEFAULT_MEMORY_WORKER_BASE_URL}/alice/sse`
  );
});

test("normalizes trailing slashes on a custom base URL", () => {
  assert.equal(
    buildMemoryWorkerUrl("alice", "https://memory.example.test/"),
    "https://memory.example.test/alice/sse"
  );
});

test("encodes user IDs as a single URL path segment", () => {
  assert.equal(
    buildMemoryWorkerUrl("team/alice?x=1"),
    `${DEFAULT_MEMORY_WORKER_BASE_URL}/team%2Falice%3Fx%3D1/sse`
  );
});

test("registers the default server name and user-scoped URL", async () => {
  const calls: Array<[string, string]> = [];
  const agent = {
    async addMcpServer(name: string, url: string) {
      calls.push([name, url]);
      return "server-id";
    }
  };

  const result = await registerMemoryWorker(agent, "alice");

  assert.equal(result, "server-id");
  assert.deepEqual(calls, [[
    DEFAULT_MEMORY_SERVER_NAME,
    `${DEFAULT_MEMORY_WORKER_BASE_URL}/alice/sse`
  ]]);
});
