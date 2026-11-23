import assert from "node:assert/strict";
import test from "node:test";
import { getOrCreateVisitorAgentName } from "../src/visitorIdentity.ts";

test("creates and persists a visitor-specific agent name", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value)
  };
  const first = getOrCreateVisitorAgentName(storage, () => "visitor-id-123456789");
  const second = getOrCreateVisitorAgentName(storage, () => "different-id-123456789");
  assert.equal(first, "visitor-visitor-id-123456789");
  assert.equal(second, first);
});

test("replaces malformed stored identifiers", () => {
  const data = new Map<string, string>([["intro2society:visitor-agent-id", "bad id"]]);
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value)
  };
  assert.equal(
    getOrCreateVisitorAgentName(storage, () => "new-visitor-id-123456"),
    "visitor-new-visitor-id-123456"
  );
});
