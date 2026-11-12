export const DEFAULT_MEMORY_SERVER_NAME = "puliczek-mcp-memory";
export const DEFAULT_MEMORY_WORKER_BASE_URL = "https://memory.mcpgenerator.com";

export function buildMemoryWorkerUrl(
  userId: string,
  baseUrl = DEFAULT_MEMORY_WORKER_BASE_URL
) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return new URL(`/${userId}/sse`, `${normalizedBaseUrl}/`).toString();
}

export async function registerMemoryWorker(
  agent: {
    addMcpServer: (name: string, url: string) => Promise<unknown>;
  },
  userId: string,
  baseUrl = DEFAULT_MEMORY_WORKER_BASE_URL,
  serverName = DEFAULT_MEMORY_SERVER_NAME
) {
  const memoryUrl = buildMemoryWorkerUrl(userId, baseUrl);
  return await agent.addMcpServer(serverName, memoryUrl);
}
