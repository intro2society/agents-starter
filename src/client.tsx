import "./styles.css";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import App from "./app";
import { FeatureTools } from "./featureTools";
import { ProbateSearch } from "./probateSearch";

function Site() {
  const [page, setPage] = useState<"chat" | "tools" | "probate">("chat");
  return (
    <>
      <nav className="fixed bottom-5 right-5 z-[100] flex gap-2 rounded-full border border-white/20 bg-black/80 p-2 backdrop-blur" aria-label="Site tools">
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-white" onClick={() => setPage("chat")}>Chat</button>
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-white" onClick={() => setPage("tools")}>Code Review / Images</button>
        <button className="rounded-full border border-violet-300/50 px-4 py-2 text-sm text-violet-100" onClick={() => setPage("probate")}>Probate Search</button>
      </nav>
      {page === "chat" ? <App /> : page === "tools" ? <FeatureTools /> : <ProbateSearch />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Site />);
