import test from "node:test";
import assert from "node:assert/strict";
import { resolveService } from "./worker.js";

test("routes only the three approved service paths", () => {
  assert.equal(resolveService("/probate"), "PROBATE_PORTAL");
  assert.equal(resolveService("/probate/case/123"), "PROBATE_PORTAL");
  assert.equal(resolveService("/blackboard"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/api/statements"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/api/probate-search"), "AGENT_STARTER");
  assert.equal(resolveService("/api/probate-search/"), "AGENT_STARTER");
  assert.equal(resolveService("/"), null);
  assert.equal(resolveService("/probate-elsewhere"), null);
  assert.equal(resolveService("/blackboardish"), null);
  assert.equal(resolveService("/api/admin"), null);
});

test("gateway health endpoint does not need downstream services", async () => {
  const worker = (await import("./worker.js")).default;
  const response = await worker.fetch(
    new Request("https://hub.invalid/__hub/health"),
    {}
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "intro2society-service-hub");
});

test("gateway forwards the original request to the correct binding", async () => {
  const worker = (await import("./worker.js")).default;
  let received;
  const env = {
    PROBATE_PORTAL: {
      fetch: async (request) => {
        received = request;
        return new Response("probate page", { status: 200 });
      }
    }
  };
  const request = new Request("https://theintro2society.org/probate?state=VA");
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "probate page");
  assert.equal(received.url, request.url);
  assert.equal(response.headers.get("X-Intro2Society-Gateway"), "service-hub");
});

test("health check reports the downstream services and returns 200 when healthy", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    AGENT_STARTER: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_PORTAL: { fetch: async () => new Response("ok", { status: 200 }) },
    COMMUNITY_BLACKBOARD: { fetch: async () => new Response("ok", { status: 200 }) }
  };
  const response = await worker.fetch(
    new Request("https://hub.invalid/__hub/check"),
    env
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.services.agentStarter.status, 200);
  assert.equal(body.services.probatePortal.status, 200);
  assert.equal(body.services.communityBlackboard.status, 200);
});

test("health check reports 503 when a downstream service is unhealthy", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    AGENT_STARTER: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_PORTAL: { fetch: async () => new Response("unavailable", { status: 503 }) },
    COMMUNITY_BLACKBOARD: { fetch: async () => new Response("ok", { status: 200 }) }
  };
  const response = await worker.fetch(
    new Request("https://hub.invalid/__hub/check"),
    env
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.services.probatePortal.status, 503);
});

test("health check is read-only", async () => {
  const worker = (await import("./worker.js")).default;
  const response = await worker.fetch(
    new Request("https://hub.invalid/__hub/check", { method: "POST" }),
    {}
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("missing service binding fails closed with 503", async () => {
  const worker = (await import("./worker.js")).default;
  const response = await worker.fetch(
    new Request("https://theintro2society.org/blackboard"),
    {}
  );
  assert.equal(response.status, 503);
});

test("upstream exception returns 502 with a request id", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    PROBATE_PORTAL: {
      fetch: async () => { throw new Error("private upstream detail"); }
    }
  };
  const response = await worker.fetch(
    new Request("https://theintro2society.org/probate"),
    env
  );
  assert.equal(response.status, 502);
  assert.ok(response.headers.get("X-Request-Id"));
  assert.equal(await response.text(), "Upstream service unavailable");
});
