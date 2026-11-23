type FetchLike = typeof fetch;

const API = "https://api.mem0.ai";

export async function addMem0Memory(
  apiKey: string,
  userId: string,
  text: string,
  fetcher: FetchLike = fetch
): Promise<unknown> {
  const response = await fetcher(`${API}/v3/memories/add/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: userId,
      app_id: "intro2society-business-research",
      messages: [{ role: "user", content: text }],
      metadata: { source: "intro2society-business-research" }
    })
  });
  if (!response.ok) {
    throw new Error(`Mem0 memory save failed (HTTP ${response.status}).`);
  }
  return await response.json();
}

export async function searchMem0Memory(
  apiKey: string,
  userId: string,
  query: string,
  fetcher: FetchLike = fetch
): Promise<unknown> {
  const response = await fetcher(`${API}/v3/memories/search/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      filters: { user_id: userId, app_id: "intro2society-business-research" },
      top_k: 5
    })
  });
  if (!response.ok) {
    throw new Error(`Mem0 memory search failed (HTTP ${response.status}).`);
  }
  return await response.json();
}
