const ROUTES = [
  {
    matches: (path) => path === "/probate" || path.startsWith("/probate/"),
    binding: "PROBATE_PORTAL"
  },
  {
    matches: (path) => path === "/blackboard" || path.startsWith("/blackboard/"),
    binding: "COMMUNITY_BLACKBOARD"
  },
  {
    matches: (path) =>
      path === "/api/probate-search" ||
      path.startsWith("/api/probate-search/"),
    binding: "AGENT_STARTER"
  }
];

export function resolveService(pathname) {
  return ROUTES.find((route) => route.matches(pathname))?.binding ?? null;
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
        )
      ]);

      const services = {
        agentStarter: checks[0],
        probatePortal: checks[1],
        communityBlackboard: checks[2]
      };
      const ok = Object.values(services).every((result) => result.ok);

      return Response.json({ ok, services }, {
        status: ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" }
      });
    }

    const bindingName = resolveService(url.pathname);
    if (!bindingName) {
      return new Response("Not found", { status: 404 });
    }

    const service = env[bindingName];
    if (!service || typeof service.fetch !== "function") {
      return new Response("Service temporarily unavailable", { status: 503 });
    }

    try {
      const response = await service.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("X-Intro2Society-Gateway", "service-hub");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch {
      return new Response("Upstream service unavailable", { status: 502 });
    }
  }
};
