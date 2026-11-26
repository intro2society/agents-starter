import { readFile } from "node:fs/promises";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const scriptName = "intro2society";

if (!accountId || !apiToken) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
}

async function api(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(init.headers || {})
    }
  });
  const payload = await response.json();
  if (!response.ok || payload.success !== true) {
    throw new Error(`Cloudflare API ${response.status}: ${JSON.stringify(payload.errors || payload).slice(0, 1600)}`);
  }
  return payload;
}

const [settingsResponse, versionsResponse] = await Promise.all([
  api(`/workers/scripts/${scriptName}/settings`),
  api(`/workers/scripts/${scriptName}/versions`)
]);
const settings = settingsResponse.result;
const expectedBindingNames = new Set((settings.bindings || []).map((binding) => binding.name));
const latestVersion = (versionsResponse.result?.items || [])[0];
if (!latestVersion?.id) {
  throw new Error("Could not find the current main website Worker version.");
}

const versionResponse = await api(`/workers/scripts/${scriptName}/versions/${latestVersion.id}`);
const exports = versionResponse.result?.resources?.script_runtime?.exports;
if (!exports || typeof exports !== "object") {
  throw new Error("Could not read existing Durable Object and Worker exports; refusing to deploy.");
}

const bindings = (settings.bindings || [])
  .filter((binding) => !["secret_text", "workflow"].includes(binding.type))
  .map((binding) => {
    if (binding.type === "ai") {
      return { name: binding.name, type: "ai" };
    }
    if (binding.name === "AGENT_STARTER" && binding.type === "service") {
      return {
        name: binding.name,
        type: binding.type,
        service: binding.service,
        environment: binding.environment || "production",
        entrypoint: "WebResearchService"
      };
    }
    return binding;
  });
if (!bindings.some((binding) => binding.name === "AGENT_STARTER" && binding.entrypoint === "WebResearchService")) {
  throw new Error("The existing AGENT_STARTER service binding was not found; refusing to deploy.");
}

const metadata = {
  main_module: "worker.js",
  compatibility_date: settings.compatibility_date,
  compatibility_flags: settings.compatibility_flags || [],
  usage_model: settings.usage_model,
  observability: settings.observability,
  logpush: settings.logpush,
  tags: settings.tags,
  tail_consumers: settings.tail_consumers,
  placement: settings.placement,
  bindings,
  keep_bindings: ["secret_text", "workflow"],
  exports,
  annotations: {
    "workers/message": "Use private WebResearchService RPC for current website chat and image research"
  }
};

const source = await readFile("recovered-production-workers/intro2society/worker.js", "utf8");
if (!source.includes("env.AGENT_STARTER.research")) {
  throw new Error("Website Worker source does not contain the reviewed research RPC integration.");
}

const form = new FormData();
form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
form.append("worker.js", new Blob([source], { type: "application/javascript+module" }), "worker.js");

await api(`/workers/scripts/${scriptName}`, { method: "PUT", body: form });

const verify = await api(`/workers/scripts/${scriptName}/settings`);
const binding = (verify.result.bindings || []).find((item) => item.name === "AGENT_STARTER");
const actualBindingNames = new Set((verify.result.bindings || []).map((item) => item.name));
const missingBindings = [...expectedBindingNames].filter((name) => !actualBindingNames.has(name));
if (missingBindings.length) {
  throw new Error(`Main website deployment lost existing bindings: ${missingBindings.join(", ")}`);
}
if (binding?.service !== "agent-starter" || binding?.entrypoint !== "WebResearchService") {
  throw new Error("Main website deployment did not retain the expected private research RPC binding.");
}

const actualBindings = verify.result.bindings || [];
for (const expected of settings.bindings || []) {
  if (!["durable_object_namespace", "kv_namespace", "ratelimit", "plain_text"].includes(expected.type)) continue;
  const actual = actualBindings.find((item) => item.name === expected.name);
  if (!actual) throw new Error(`Main website deployment lost critical binding ${expected.name}.`);
  for (const field of ["namespace_id", "text"]) {
    if (expected[field] !== undefined && actual[field] !== expected[field]) {
      throw new Error(`Main website deployment changed ${expected.name}.${field}; refusing to report success.`);
    }
  }
  if (expected.type === "ratelimit") {
    for (const field of ["limit", "period"]) {
      if (actual.simple?.[field] !== expected.simple?.[field]) {
        throw new Error(`Main website deployment changed API_RATE_LIMITER.${field}.`);
      }
    }
  }
}

const afterVersions = await api(`/workers/scripts/${scriptName}/versions`);
const deployedVersion = (afterVersions.result?.items || [])[0];
if (!deployedVersion?.id) throw new Error("Could not verify the uploaded website Worker version.");
const deployedVersionResponse = await api(`/workers/scripts/${scriptName}/versions/${deployedVersion.id}`);
const deployedExports = deployedVersionResponse.result?.resources?.script_runtime?.exports || {};
const missingExports = Object.keys(exports).filter((name) => !deployedExports[name]);
if (missingExports.length) {
  throw new Error(`Main website deployment lost existing exports: ${missingExports.join(", ")}`);
}

const deployments = await api(`/workers/scripts/${scriptName}/deployments`);
const deployment = deployments.result?.deployments?.[0];
console.log("Main website Worker deployed with private research RPC.", {
  deploymentId: deployment?.id || null,
  entrypoint: binding.entrypoint,
  preservedBindings: (verify.result.bindings || []).map((item) => item.name),
  preservedExports: Object.keys(exports)
});
