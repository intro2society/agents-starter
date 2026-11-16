import assert from "node:assert/strict";
import test from "node:test";
import { handleFeatureApiRequest } from "../src/featureApi.ts";

test("feature API rejects methods other than POST", async () => {
  const response = await handleFeatureApiRequest(
    new Request("https://app.example.com/api/image-generation", { method: "GET" }),
    {} as Env
  );
  assert.equal(response?.status, 405);
});

test("feature API rejects malformed JSON", async () => {
  const response = await handleFeatureApiRequest(
    new Request("https://app.example.com/api/image-generation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json"
    }),
    {} as Env
  );
  assert.equal(response?.status, 400);
});

test("feature API enforces the streaming body limit without Content-Length", async () => {
  const response = await handleFeatureApiRequest(
    new Request("https://app.example.com/api/image-generation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "x".repeat(70_000) })
    }),
    {} as Env
  );
  assert.equal(response?.status, 413);
});
