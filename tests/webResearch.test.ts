import assert from "node:assert/strict";
import test from "node:test";
import {
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
