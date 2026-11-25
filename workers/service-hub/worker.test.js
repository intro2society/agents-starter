import test from "node:test";
import assert from "node:assert/strict";
import { resolveService } from "./worker.js";

test("routes only exact approved service endpoints", () => {
  assert.equal(resolveService("/probate"), "PROBATE_PORTAL");
  assert.equal(resolveService("/probate/"), "PROBATE_PORTAL");
  assert.equal(resolveService("/probate/case/123"), null);
  assert.equal(resolveService("/blackboard"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/health"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/api/statements"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/api/statements/123/report"), "COMMUNITY_BLACKBOARD");
  assert.equal(resolveService("/blackboard/private"), null);
  assert.equal(resolveService("/api/probate-search"), "AGENT_STARTER");
  assert.equal(resolveService("/api/probate-search/"), null);
  assert.equal(resolveService("/"), null);
  assert.equal(resolveService("/probate-elsewhere"), null);
  assert.equal(resolveService("/blackboardish"), null);
  assert.equal(resolveService("/api/admin"), null);
  assert.equal(resolveService("/health", "scraper.theintro2society.org"), "PROBATE_SCRAPER");
  assert.equal(resolveService("/api/states", "scraper.theintro2society.org"), "PROBATE_SCRAPER");
  assert.equal(resolveService("/", "unknown.theintro2society.org"), null);
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
  assert.deepEqual(body.routing, ["probate", "blackboard", "probate-search", "probate-scraper"]);
});

test("gateway health endpoint is read-only", async () => {
  const worker = (await import("./worker.js")).default;
  const response = await worker.fetch(
    new Request("https://hub.invalid/__hub/health", { method: "POST" }),
    {}
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
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
  assert.ok(received.headers.get("X-Request-Id"));
  assert.equal(received.headers.get("X-Request-Id"), response.headers.get("X-Request-Id"));
  assert.equal(response.headers.get("X-Intro2Society-Gateway"), "service-hub");
});

test("health check reports the downstream services and returns 200 when healthy", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    AGENT_STARTER: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_PORTAL: { fetch: async () => new Response("ok", { status: 200 }) },
    COMMUNITY_BLACKBOARD: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_SCRAPER: { fetch: async () => new Response("ok", { status: 200 }) }
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
  assert.equal(body.services.probateScraper.status, 200);
});

test("health check reports 503 when a downstream service is unhealthy", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    AGENT_STARTER: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_PORTAL: { fetch: async () => new Response("unavailable", { status: 503 }) },
    COMMUNITY_BLACKBOARD: { fetch: async () => new Response("ok", { status: 200 }) },
    PROBATE_SCRAPER: { fetch: async () => new Response("ok", { status: 200 }) }
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

test("gateway forwards scraper subdomain requests to the scraper binding", async () => {
  const worker = (await import("./worker.js")).default;
  let received;
  const env = {
    PROBATE_SCRAPER: {
      fetch: async (request) => {
        received = request;
        return new Response("probate research workspace", { status: 200 });
      }
    }
  };
  const request = new Request("https://scraper.theintro2society.org/api/states");
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "probate research workspace");
  assert.equal(received.url, request.url);
  assert.equal(response.headers.get("X-Intro2Society-Gateway"), "service-hub");
});

test("probate-search POST preserves JSON body, origin, and client IP headers", async () => {
  const worker = (await import("./worker.js")).default;
  let received;
  const env = {
    AGENT_STARTER: {
      fetch: async (request) => {
        received = {
          url: request.url,
          method: request.method,
          body: await request.json(),
          contentType: request.headers.get("content-type"),
          origin: request.headers.get("origin"),
          clientIp: request.headers.get("cf-connecting-ip")
        };
        return Response.json({ results: [] }, { status: 200 });
      }
    }
  };
  const payload = { decedent: "Sample Person", locality: "Richmond City" };
  const request = new Request("https://theintro2society.org/api/probate-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://theintro2society.org",
      "CF-Connecting-IP": "203.0.113.10"
    },
    body: JSON.stringify(payload)
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  assert.deepEqual(received.body, payload);
  assert.equal(received.method, "POST");
  assert.equal(received.url, request.url);
  assert.equal(received.contentType, "application/json");
  assert.equal(received.origin, "https://theintro2society.org");
  assert.equal(received.clientIp, "203.0.113.10");
});

test("blackboard POST preserves statement body and client headers", async () => {
  const worker = (await import("./worker.js")).default;
  let received;
  const env = {
    COMMUNITY_BLACKBOARD: {
      fetch: async (request) => {
        received = {
          url: request.url,
          method: request.method,
          body: await request.json(),
          contentType: request.headers.get("content-type"),
          clientIp: request.headers.get("cf-connecting-ip")
        };
        return Response.json({ success: true }, { status: 201 });
      }
    }
  };
  const payload = { text: "A community thought", website: "" };
  const request = new Request("https://theintro2society.org/blackboard/api/statements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.11"
    },
    body: JSON.stringify(payload)
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 201);
  assert.deepEqual(received.body, payload);
  assert.equal(received.method, "POST");
  assert.equal(received.url, request.url);
  assert.equal(received.contentType, "application/json");
  assert.equal(received.clientIp, "203.0.113.11");
});

test("downstream rate-limit responses and headers are preserved", async () => {
  const worker = (await import("./worker.js")).default;
  const env = {
    AGENT_STARTER: {
      fetch: async () => new Response("Rate limit exceeded. Try again shortly.", {
        status: 429,
        headers: { "Retry-After": "60" }
      })
    }
  };
  const response = await worker.fetch(
    new Request("https://theintro2society.org/api/probate-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decedent: "Sample", locality: "Richmond" })
    }),
    env
  );
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal(await response.text(), "Rate limit exceeded. Try again shortly.");
});

test("downstream 403, 429, and 503 responses preserve status, body, and headers", async () => {
  const worker = (await import("./worker.js")).default;
  for (const status of [403, 429, 503]) {
    const body = `upstream response ${status}`;
    const env = {
      AGENT_STARTER: {
        fetch: async () => new Response(body, {
          status,
          headers: {
            "X-Upstream-Status": String(status),
            "Retry-After": "60"
          }
        })
      }
    };
    const request = new Request("https://theintro2society.org/api/probate-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decedent: "Sample", locality: "Richmond" })
    });
    const response = await worker.fetch(request, env);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("X-Upstream-Status"), String(status));
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal(await response.text(), body);
  }
});
