import assert from "node:assert/strict";
import test from "node:test";
import { assertPublicHttpsUrl, isPublicHttpsUrl } from "../src/urlSecurity.ts";

test("accepts public HTTPS URLs", () => {
  assert.equal(isPublicHttpsUrl("https://example.com/path"), true);
  assert.equal(assertPublicHttpsUrl("https://example.com").hostname, "example.com");
});

test("rejects insecure, credentialed, local, and IP-literal URLs", () => {
  for (const url of [
    "http://example.com",
    "https://user:pass@example.com",
    "https://localhost",
    "https://service.local",
    "https://service.internal",
    "https://127.0.0.1",
    "https://192.168.1.10",
    "https://[::1]",
    "https://example.com:8443"
  ]) {
    assert.equal(isPublicHttpsUrl(url), false, url);
  }
});

test("throws a clear error for blocked URLs", () => {
  assert.throws(() => assertPublicHttpsUrl("http://localhost"), /public HTTPS/);
});
