import { useState } from "react";

type ToolMode = "code-review" | "image-generation";

async function readApiError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status}).`;
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    // The response wasn't JSON (often an HTML SPA fallback); include a safe diagnostic.
  }
  if (text.trimStart().startsWith("<")) {
    return `The API returned HTML instead of a response (${response.status}). This usually means the Worker is not deployed with API routing enabled.`;
  }
  return text.slice(0, 500);
}

export function FeatureTools() {
  const [mode, setMode] = useState<ToolMode>("image-generation");
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("unspecified");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    setReview("");
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    try {
      const endpoint = mode === "code-review" ? "/api/code-review" : "/api/image-generation";
      const payload = mode === "code-review" ? { code, language } : { prompt };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", accept: mode === "code-review" ? "application/json" : "image/*, application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(await readApiError(response));
      if (mode === "code-review") {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) throw new Error(await readApiError(response));
        const result: unknown = await response.json();
        if (!result || typeof result !== "object" || !("review" in result) || typeof result.review !== "string") {
          throw new Error("Code review endpoint returned an unexpected response.");
        }
        setReview(result.review);
      } else {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) throw new Error(await readApiError(response));
        setImageUrl(URL.createObjectURL(await response.blob()));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#10110f] text-[#f2f0e9] px-5 py-10">
      <section className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[.25em] text-violet-300">Intro 2 Society</p>
          <h1 className="mt-2 text-3xl font-bold">AI Image Generation + Code Review</h1>
          <p className="mt-2 text-sm text-neutral-400">Chat is available in the Chat tab.</p>
        </header>
        <nav className="flex gap-2" aria-label="AI tools">
          <button className="rounded-full border border-white/20 px-4 py-2" onClick={() => { setMode("image-generation"); setError(""); }}>Image Generator</button>
          <button className="rounded-full border border-white/20 px-4 py-2" onClick={() => { setMode("code-review"); setError(""); }}>Code Review</button>
        </nav>
        {mode === "image-generation" ? (
          <div className="space-y-4">
            <label className="block text-sm" htmlFor="image-prompt">Type what you want to see:</label>
            <textarea id="image-prompt" className="min-h-28 w-full rounded-xl border border-white/20 bg-white/5 p-3" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe an image..." maxLength={1000} />
            <div className="flex flex-wrap gap-2 text-sm text-neutral-300" aria-label="Supported image formats">
              {(["Square", "Tall", "Wide", "Portrait", "Widescreen", "Phone"] as const).map((format) => <span key={format} className="rounded-full border border-white/15 px-3 py-1">{format}</span>)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm" htmlFor="review-language">Language</label>
            <input id="review-language" className="w-full rounded-xl border border-white/20 bg-white/5 p-3" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="TypeScript, Python..." />
            <label className="block text-sm" htmlFor="review-code">Paste code to review:</label>
            <textarea id="review-code" className="min-h-64 w-full rounded-xl border border-white/20 bg-white/5 p-3 font-mono text-sm" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste your code here..." maxLength={30000} />
          </div>
        )}
        <button className="rounded-full bg-violet-600 px-5 py-2 font-semibold disabled:opacity-50" disabled={busy || (mode === "image-generation" ? !prompt.trim() : !code.trim())} onClick={submit}>
          {busy ? "Working…" : mode === "image-generation" ? "Generate Image" : "Review Code"}
        </button>
        {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">Error: {error}</p>}
        {review && <article className="whitespace-pre-wrap rounded-xl border border-white/15 bg-white/5 p-4">{review}</article>}
        {imageUrl && <img className="max-h-[70vh] rounded-xl border border-white/15" src={imageUrl} alt={`Generated image: ${prompt}`} />}
      </section>
    </main>
  );
}
