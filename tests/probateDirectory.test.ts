import assert from "node:assert/strict";
import test from "node:test";
import { fetchProbateDirectory } from "../src/probateDirectory.ts";

test("loads the 50-state official court directory through the hub", async () => {
  const requests: string[] = [];
  const hub = {
    async fetch(request: Request) {
      requests.push(new URL(request.url).pathname);
      if (new URL(request.url).pathname === "/api/status") {
        return Response.json({
          states: 50,
          officialCourtStartingPoints: 50,
          manualResearch: true,
          automaticCaseHarvesting: false
        });
      }
      return Response.json([
        { state: "Virginia", code: "VA", officialCourt: "https://www.vacourts.gov/" },
        { state: "Maryland", code: "MD", officialCourt: "https://www.mdcourts.gov/" }
      ]);
    }
  };

  const result = await fetchProbateDirectory(hub);
  const parsed = JSON.parse(result);

  assert.equal(parsed.status.states, 50);
  assert.equal(parsed.states.length, 2);
  assert.equal(parsed.note.includes("does not automatically harvest"), true);
  assert.deepEqual(requests.sort(), ["/api/states", "/api/status"]);
});

test("filters the directory by state name or postal code", async () => {
  const hub = {
    async fetch(request: Request) {
      if (new URL(request.url).pathname === "/api/status") {
        return Response.json({
          states: 50,
          officialCourtStartingPoints: 50,
          manualResearch: true,
          automaticCaseHarvesting: false
        });
      }
      return Response.json([
        { state: "Virginia", code: "VA", officialCourt: "https://www.vacourts.gov/" },
        { state: "Maryland", code: "MD", officialCourt: "https://www.mdcourts.gov/" }
      ]);
    }
  };

  const result = JSON.parse(await fetchProbateDirectory(hub, "va"));
  assert.equal(result.states.length, 1);
  assert.equal(result.states[0].state, "Virginia");
});

test("returns a clear message when the hub binding is unavailable", async () => {
  assert.match(
    await fetchProbateDirectory(undefined),
    /not configured/
  );
});

test("handles downstream service failures without throwing", async () => {
  const hub = {
    async fetch() {
      return new Response("unavailable", { status: 503 });
    }
  };

  assert.match(
    await fetchProbateDirectory(hub),
    /temporarily unavailable/
  );
});
