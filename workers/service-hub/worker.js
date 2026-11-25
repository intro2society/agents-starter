export function resolveService(pathname, hostname = "theintro2society.org") {
  if (hostname === "scraper.theintro2society.org") {
    return "PROBATE_SCRAPER";
  }
  if (hostname !== "theintro2society.org") return null;
  if (pathname === "/probate" || pathname === "/probate/") {
    return "PROBATE_PORTAL";
  }
  if (
    pathname === "/blackboard" ||
    pathname === "/blackboard/" ||
    pathname === "/blackboard/health" ||
    pathname.startsWith("/blackboard/api/")
  ) {
    return "COMMUNITY_BLACKBOARD";
  }
  if (pathname === "/api/probate-search") {
    return "AGENT_STARTER";
  }
  return null;
}

async function checkService(binding, request) {
  try {
    const response = await binding.fetch(request);
    return {
      ok: response.ok,
      status: response.status
    };
  } catch {
    return { ok: false, status: 502 };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/__hub/health") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET" }
        });
      }
      return Response.json({
        ok: true,
        service: "intro2society-service-hub",
        routing: ["probate", "blackboard", "probate-search"]
      }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    if (url.pathname === "/__hub/check") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET" }
        });
      }

      const checks = await Promise.all([
        checkService(
          env.AGENT_STARTER,
          new Request("https://internal.invalid/api/health")
        ),
        checkService(
          env.PROBATE_PORTAL,
          new Request("https://internal.invalid/probate")
        ),
        checkService(
          env.COMMUNITY_BLACKBOARD,
          new Request("https://internal.invalid/blackboard/health")
        ),
        checkService(
          env.PROBATE_SCRAPER,
          new Request("https://internal.invalid/health")
        )
      ]);

      const services = {
        agentStarter: checks[0],
        probatePortal: checks[1],
        communityBlackboard: checks[2],
        probateScraper: checks[3]
      };
      const ok = Object.values(services).every((result) => result.ok);

      console.log(JSON.stringify({
        event: "service_health_check",
        ok,
        services: Object.fromEntries(
          Object.entries(services).map(([name, result]) => [name, result.status])
        )
      }));
      return Response.json({ ok, services }, {
        status: ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" }
      });
    }

    const bindingName = resolveService(url.pathname, url.hostname);
    if (!bindingName) {
      return new Response("Not found", { status: 404 });
    }

    const service = env[bindingName];
    if (!service || typeof service.fetch !== "function") {
      return new Response("Service temporarily unavailable", { status: 503 });
    }

    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    try {
      const forwardedHeaders = new Headers(request.headers);
      forwardedHeaders.set("X-Request-Id", requestId);
      const forwardedRequest = new Request(request, {
        headers: forwardedHeaders
      });
      const response = await service.fetch(forwardedRequest);
      const durationMs = Date.now() - startedAt;
      const headers = new Headers(response.headers);
      headers.set("X-Intro2Society-Gateway", "service-hub");
      headers.set("X-Request-Id", requestId);
      console.log(JSON.stringify({
        event: "service_forward",
        requestId,
        service: bindingName,
        method: request.method,
        path: url.pathname,
        status: response.status,
        durationMs
      }));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error(JSON.stringify({
        event: "service_forward_error",
        requestId,
        service: bindingName,
        method: request.method,
        path: url.pathname,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown upstream error"
      }));
      return new Response("Upstream service unavailable", {
        status: 502,
        headers: { "X-Request-Id": requestId }
      });
    }
  }
};
