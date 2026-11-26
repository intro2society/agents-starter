import assert from "node:assert/strict";
import test from "node:test";
import {
  crawlRenderedWebsite,
  isPublicHttpsUrl,
  readRenderedMarkdown
} from "../src/webResearch.ts";

test("accepts public HTTPS URLs", () => {
  assert.equal(isPublicHttpsUrl("https://example.com/path")?.hostname, "example.com");
  assert.equal(isPublicHttpsUrl("http://example.com"), null);
  assert.equal(isPublicHttpsUrl("https://example.com:8443"), null);
});

test("rejects local and private network targets", () => {
  for (const url of [
    "https://localhost/",
    "https://printer.local/",
    "https://service.internal/",
    "https://127.0.0.1/",
    "https://10.0.0.1/",
    "https://192.168.1.1/",
    "https://169.254.169.254/",
    "https://172.16.0.1/"
  ]) {
    assert.equal(isPublicHttpsUrl(url), null, url);
  }
});

test("reads Markdown from the Cloudflare Browser Run binding", async () => {
  const calls: string[] = [];
  const browser = {
    async quickAction(action: "markdown" | "links", options: { url: string }) {
      calls.push(`${action}:${options.url}`);
      return Response.json({ success: true, result: "# Example\n\nCurrent page text." });
    }
  };
  const markdown = await readRenderedMarkdown(browser, "https://example.com/");
  assert.match(markdown, /Current page text/);
  assert.deepEqual(calls, ["markdown:https://example.com/"]);
});

test("reports an invalid Browser Run response", async () => {
  const browser = {
    async quickAction() {
      return Response.json({ success: false, errors: [{ message: "failed" }] });
    }
  };
  await assert.rejects(
    () => readRenderedMarkdown(browser, "https://example.com/"),
    /did not return readable Markdown/
  );
});


test("crawls only same-origin public HTTPS pages within the page limit", async () => {
  const calls: string[] = [];
  const browser = {
    async quickAction(action: "markdown" | "links", options: { url: string }) {
      calls.push(`${action}:${options.url}`);
      if (action === "markdown") {
        return Response.json({ success: true, result: `# ${new URL(options.url).pathname}\n\nPage content.` });
      }
      if (options.url === "https://example.com/") {
        return Response.json({
          success: true,
          result: [
            "https://example.com/about",
            "https://example.com/contact",
            "https://other.example.net/outside",
            "http://example.com/insecure",
            "https://127.0.0.1/private"
          ]
        });
      }
      return Response.json({ success: true, result: ["https://example.com/"] });
    }
  };
  const result = await crawlRenderedWebsite(browser, "https://example.com/", 2);
  assert.equal(result.pagesRead, 2);
  assert.equal(result.sameOriginOnly, true);
  assert.deepEqual(result.pages.map((page) => page.url), [
    "https://example.com/",
    "https://example.com/about"
  ]);
  assert.equal(calls.filter((call) => call.startsWith("markdown:")).length, 2);
  assert.equal(calls.some((call) => call.includes("other.example.net")), false);
});

test("rejects invalid targets and out-of-range crawl limits", async () => {
  const browser = {
    async quickAction() {
      return Response.json({ success: true, result: [] });
    }
  };
  await assert.rejects(
    () => crawlRenderedWebsite(browser, "http://127.0.0.1/", 2),
    /Only public HTTPS websites/
  );
  await assert.rejects(
    () => crawlRenderedWebsite(browser, "https://example.com/", 6),
    /maxPages must be an integer/
  );
});
