const KEY = "intro2society:visitor-agent-id";

export function getOrCreateVisitorAgentName(
  storage: Pick<Storage, "getItem" | "setItem">,
  createId: () => string = () => crypto.randomUUID()
): string {
  let id = storage.getItem(KEY);
  if (!id || !/^[a-zA-Z0-9-]{16,80}$/.test(id)) {
    id = createId();
    storage.setItem(KEY, id);
  }
  return `visitor-${id}`;
}
