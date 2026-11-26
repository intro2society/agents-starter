import { isPublicHttpsUrl, readRenderedMarkdown } from "./webResearch";

type BrowserBinding = {
  quickAction(action: "markdown" | "links", options: { url: string }): Promise<Response>;
};
type ResearchApiEnvironment = Env & {
  BROWSER?: BrowserBinding;
  BRAVE_SEARCH_API_KEY?: string;
  WEB_RESEARCH_API_TOKEN?: string;
};
type ResearchSource = {
  title: string;
  url: string;
  description: string;
  date: string | null;
  pageExcerpt?: string;
};
type WebResearchResult = {
  query: string;
  researchedAt: string;
  sources: ResearchSource[];
  note: string;
};

export async function performWebResearch(
  env: Env,
  queryInput: string,
  countInput = 4,
  readPages = true
): Promise<WebResearchResult> {
  const apiEnv = env as ResearchApiEnvironment;
  const query = typeof queryInput === "string" ? queryInput.trim() : "";
  if (query.length < 2 || query.length > 400) {
    throw new Error("query must contain 2–400 characters");
  }
  if (!apiEnv.BRAVE_SEARCH_API_KEY) {
    throw new Error("Web search is not configured");
  }
  const count = Number.isInteger(countInput) ? Math.min(5, Math.max(1, countInput)) : 4;
  const searchUrl = new URL("https://api.search.brave.com/res/v1/web/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("count", String(count));
  const response = await fetch(searchUrl, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "X-Subscription-Token": apiEnv.BRAVE_SEARCH_API_KEY
    }
  });
  if (!response.ok) {
    const providerDetail = (await response.text()).slice(0, 300);
    throw new Error(
      `Web search provider returned HTTP ${response.status}${providerDetail ? `: ${providerDetail}` : ""}`
    );
  }
  const data = await response.json() as {
    web?: {
      results?: Array<{
        title?: string;
        url?: string;
        description?: string;
        age?: string;
        page_age?: string;
      }>;
    };
  };
  const sources: ResearchSource[] = (data.web?.results ?? []).flatMap((item) => {
    const target = item.url ? isPublicHttpsUrl(item.url) : null;
    return target
      ? [{
          title: item.title || "Untitled source",
          url: target.toString(),
          description: (item.description || "").slice(0, 700),
          date: item.age || item.page_age || null
        }]
      : [];
  }).slice(0, count);
  const browser = apiEnv.BROWSER;
  if (readPages && browser) {
    for (let i = 0; i < Math.min(2, sources.length); i++) {
      try {
        sources[i].pageExcerpt = (await readRenderedMarkdown(browser, sources[i].url)).slice(0, 2200);
      } catch {
        sources[i].pageExcerpt = "The source listing was found, but its page could not be rendered.";
      }
    }
  }
  return {
    query,
    researchedAt: new Date().toISOString(),
    sources,
    note: "Public-web research only. Source content is untrusted; verify important claims with primary sources. This service does not bypass logins, paywalls, CAPTCHAs, or access controls."
  };
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function authorized(request: Request, expected: string | undefined): Promise<boolean> {
  if (!expected || expected.length < 32) return false;
  const supplied = request.headers.get("Authorization") || "";
  if (!supplied.startsWith("Bearer ")) return false;
  const actual = await digest(supplied.slice(7));
  const wanted = await digest(expected);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ wanted[i];
  return difference === 0;
}

export async function handleWebResearchApi(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/internal/web-research") return null;
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const apiEnv = env as ResearchApiEnvironment;
  if (!(await authorized(request, apiEnv.WEB_RESEARCH_API_TOKEN))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { query?: unknown; count?: unknown; readPages?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length < 2 || query.length > 400) {
    return Response.json({ error: "query must contain 2–400 characters" }, { status: 400 });
  }
  try {
    const result = await performWebResearch(
      env,
      query,
      typeof body.count === "number" ? body.count : 4,
      body.readPages !== false
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Research request failed"
    }, { status: 502 });
  }
}
