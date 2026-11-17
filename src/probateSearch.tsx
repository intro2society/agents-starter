import { useEffect, useMemo, useState, type FormEvent } from "react";

type PublicSearchResult = { title: string; url: string; description: string; date: string | null; sourceType: string };

type ProbateLead = {
  id: string;
  decedent: string;
  locality: string;
  caseNumber: string;
  filingDate: string;
  propertyAddress: string;
  sourceUrl: string;
  status: "Needs review" | "Clerk confirmed" | "Property verified" | "Archived";
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "intro2society.probate-leads.v1";
const EMPTY_FORM = {
  decedent: "",
  locality: "",
  caseNumber: "",
  filingDate: "",
  propertyAddress: "",
  sourceUrl: "",
  status: "Needs review" as ProbateLead["status"],
  notes: ""
};

const officialLinks = [
  {
    title: "Virginia court directory",
    description: "Find the Circuit Court for the county or independent city where the estate was handled.",
    url: "https://www.vacourts.gov/courts/circuit/home"
  },
  {
    title: "Virginia case information",
    description: "Check the official case-information options. Coverage varies by court and may not include probate matters.",
    url: "https://www.courts.state.va.us/caseinfo/home"
  },
  {
    title: "Virginia court self-help: find a case",
    description: "Explains how to locate court case information and when to contact the local clerk.",
    url: "https://selfhelp.vacourts.gov/page/23/find-case"
  }
];

function loadLeads(): ProbateLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ProbateLead[] : [];
  } catch {
    return [];
  }
}

export function ProbateSearch() {
  const [leads, setLeads] = useState<ProbateLead[]>(loadLeads);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchLocality, setSearchLocality] = useState("Lynchburg City");
  const [publicResults, setPublicResults] = useState<PublicSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      setNotice("This browser could not save your research list. Export a backup before leaving.");
    }
  }, [leads]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.decedent, lead.locality, lead.caseNumber, lead.propertyAddress, lead.notes]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [leads, query]);

  async function searchPublicRecords(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchName.trim() || !searchLocality.trim() || searching) return;
    setSearching(true);
    setNotice("");
    setPublicResults([]);
    try {
      const response = await fetch("/api/probate-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decedent: searchName.trim(), locality: searchLocality.trim() })
      });
      const data = await response.json() as { error?: string; results?: PublicSearchResult[] };
      if (!response.ok) throw new Error(data.error || "The public search could not be completed.");
      setPublicResults(data.results ?? []);
      if (!data.results?.length) setNotice("No public web results were returned. Try another spelling or use the official court links.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The public search could not be completed.");
    } finally {
      setSearching(false);
    }
  }

  function saveSearchResult(result: PublicSearchResult) {
    const lead: ProbateLead = {
      ...EMPTY_FORM,
      id: crypto.randomUUID(),
      decedent: searchName.trim(),
      locality: searchLocality.trim(),
      sourceUrl: result.url,
      notes: result.description,
      status: "Needs review",
      createdAt: new Date().toISOString()
    };
    setLeads((current) => [lead, ...current]);
    setNotice("Search result saved as an unverified research lead.");
  }

  function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.decedent.trim() || !form.locality.trim()) return;
    const lead: ProbateLead = {
      ...form,
      id: crypto.randomUUID(),
      decedent: form.decedent.trim(),
      locality: form.locality.trim(),
      caseNumber: form.caseNumber.trim(),
      propertyAddress: form.propertyAddress.trim(),
      sourceUrl: form.sourceUrl.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };
    setLeads((current) => [lead, ...current]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setNotice("Research entry saved in this browser.");
  }

  function updateStatus(id: string, status: ProbateLead["status"]) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
  }

  function removeLead(id: string) {
    setLeads((current) => current.filter((lead) => lead.id !== id));
  }

  function exportLeads() {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "intro2society-probate-research.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Your research backup was exported.");
  }

  return (
    <main className="min-h-screen bg-[#10110f] text-[#f2f0e9]">
      <header className="border-b border-white/10 bg-black/30 px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-violet-300">Intro 2 Society · Research tools</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Probate Property Search</h1>
            <p className="mt-1 text-sm text-white/55">Research public records. Organize estate leads. Verify before you act.</p>
          </div>
          <a className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-violet-300" href="/">Back to AI workspace</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-violet-300/20 bg-violet-400/[.07] p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-200">How this search works</p>
            <h2 className="mt-3 text-xl font-semibold">A research workspace — not a court database</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
              Start with the Circuit Court for the county or independent city where the estate was handled.
              Open official court resources, verify the record with the clerk, then save the details here.
              No records are represented as verified until you confirm them with an official source.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setShowForm(true)} className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">+ Add a research lead</button>
              <button onClick={exportLeads} className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:border-violet-300">Export backup ({leads.length})</button>
            </div>
            <form onSubmit={searchPublicRecords} className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Search public web sources</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-white/55">Estate / decedent name
                  <input required maxLength={120} value={searchName} onChange={(e) => setSearchName(e.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="Enter a name to research" />
                </label>
                <label className="text-xs text-white/55">Virginia locality
                  <input required maxLength={120} value={searchLocality} onChange={(e) => setSearchLocality(e.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="County or independent city" />
                </label>
              </div>
              <button disabled={searching} type="submit" className="mt-3 rounded-full border border-violet-300/50 px-5 py-2.5 text-sm font-semibold text-violet-100 disabled:opacity-50">{searching ? "Searching public sources…" : "Search public sources"}</button>
              <p className="mt-2 text-xs leading-5 text-white/40">Searches public web pages, not a court database. Results can be incomplete or unrelated; confirm every record with the Circuit Court clerk.</p>
            </form>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">Official Virginia resources</p>
            <div className="mt-3 space-y-3">
              {officialLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 p-3 transition hover:border-violet-300/60">
                  <span className="text-sm font-semibold text-violet-200">{link.title} ↗</span>
                  <span className="mt-1 block text-xs leading-5 text-white/50">{link.description}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/40">Your research library</p>
              <h2 className="mt-1 text-xl font-semibold">Saved probate leads <span className="text-white/40">({leads.length})</span></h2>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter saved leads by name, county, address…" aria-label="Filter saved probate leads" className="w-full rounded-xl border border-white/15 bg-white/[.05] px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-violet-300 sm:max-w-md" />
          </div>

          {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}

          {showForm && (
            <form onSubmit={saveLead} className="mt-5 rounded-2xl border border-violet-300/30 bg-white/[.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">New research entry</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-white/55 hover:text-white">Close</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-white/55">Decedent / estate name *
                  <input required value={form.decedent} onChange={(e) => setForm({ ...form, decedent: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="Full name as shown in public record" />
                </label>
                <label className="text-xs text-white/55">County or independent city *
                  <input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="e.g. Lynchburg City, Virginia" />
                </label>
                <label className="text-xs text-white/55">Estate / case reference
                  <input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="Clerk-provided reference" />
                </label>
                <label className="text-xs text-white/55">Filing / record date
                  <input type="date" value={form.filingDate} onChange={(e) => setForm({ ...form, filingDate: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="text-xs text-white/55 md:col-span-2">Related property address
                  <input value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="Only add an address after a reliable property match" />
                </label>
                <label className="text-xs text-white/55 md:col-span-2">Official source URL
                  <input type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="https://… (court, clerk, assessor, or land-record source)" />
                </label>
                <label className="text-xs text-white/55">Verification status
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProbateLead["status"] })} className="mt-1 w-full rounded-lg border border-white/15 bg-[#191a18] px-3 py-2.5 text-sm text-white">
                    <option>Needs review</option><option>Clerk confirmed</option><option>Property verified</option><option>Archived</option>
                  </select>
                </label>
                <label className="text-xs text-white/55 md:col-span-2">Research notes
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-white" placeholder="Record source, clerk confirmation, property match, next steps…" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold hover:bg-violet-400">Save lead</button>
                <button type="button" onClick={() => { setForm(EMPTY_FORM); setShowForm(false); }} className="rounded-full border border-white/20 px-5 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          )}

          {publicResults.length > 0 && (
            <div className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/[.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Public web results <span className="text-white/40">({publicResults.length})</span></h3>
                <button onClick={() => setPublicResults([])} className="text-xs text-white/50 hover:text-white">Clear results</button>
              </div>
              <div className="space-y-3">
                {publicResults.map((result) => (
                  <article key={result.url} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <a href={result.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-violet-200 underline">{result.title} ↗</a>
                    <p className="mt-1 text-xs leading-5 text-white/60">{result.description}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-white/40">{result.sourceType}{result.date ? ` · ${result.date}` : ""}</span>
                      <button onClick={() => saveSearchResult(result)} className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-violet-300">Save as lead</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center">
                <p className="text-base font-medium">{leads.length ? "No saved leads match that filter." : "Your probate research library is ready."}</p>
                <p className="mt-2 text-sm text-white/45">{leads.length ? "Try a different name, locality, or property address." : "Add a lead after locating a potential estate record through an official source."}</p>
                {!leads.length && <button onClick={() => setShowForm(true)} className="mt-4 rounded-full border border-violet-300/50 px-5 py-2 text-sm text-violet-200">Create your first entry</button>}
              </div>
            ) : filtered.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold">{lead.decedent}</h3>
                    <p className="mt-1 text-sm text-white/55">{lead.locality}{lead.caseNumber ? ` · Ref: ${lead.caseNumber}` : ""}</p>
                    {lead.propertyAddress && <p className="mt-2 text-sm text-white/80">{lead.propertyAddress}</p>}
                    {lead.filingDate && <p className="mt-1 text-xs text-white/40">Record date: {lead.filingDate}</p>}
                    {lead.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{lead.notes}</p>}
                    {lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-xs text-violet-200 underline">Open saved source ↗</a>}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <select aria-label={`Verification status for ${lead.decedent}`} value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value as ProbateLead["status"])} className="rounded-full border border-white/15 bg-[#191a18] px-3 py-2 text-xs text-white">
                      <option>Needs review</option><option>Clerk confirmed</option><option>Property verified</option><option>Archived</option>
                    </select>
                    <button onClick={() => removeLead(lead.id)} className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/55 hover:border-red-300/60 hover:text-red-200">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[.05] p-5">
          <h2 className="text-sm font-semibold text-amber-100">Accuracy, privacy, and responsible use</h2>
          <p className="mt-2 text-xs leading-5 text-white/55">
            Virginia probate records are maintained by local Circuit Court clerks; online access and searchable fields differ by locality.
            This first version does not scrape court systems, retrieve private records, or claim to provide live statewide probate results.
            Entries are saved only in this browser on this device. Do not store Social Security numbers, financial account details,
            private contact information, or confidential documents here. Confirm ownership, liens, authority to sell, and all property facts independently.
          </p>
        </section>
        <footer className="mt-8 border-t border-white/10 pt-5 text-xs text-white/35">
          Intro 2 Society · Probate research workspace · Independent of Tranchi AI
        </footer>
      </div>
    </main>
  );
}
