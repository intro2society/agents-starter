const page = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#11100f">
<title>Probate Property Search | Intro2Society</title>
<style>
:root{color-scheme:dark;--bg:#11100f;--panel:#1b1a19;--line:#393632;--muted:#b6afa5;--accent:#c4a4ff;--accent2:#a783f5;--text:#f5f1eb}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 12% 0%,#33284a 0,transparent 38%),var(--bg);color:var(--text);font:16px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}
a{color:var(--accent)}button,input,select,textarea{font:inherit}button{cursor:pointer}.wrap{max-width:1120px;margin:auto;padding:28px 22px 64px}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:1px solid var(--line);padding-bottom:22px}.eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:800}.top h1{font-size:clamp(26px,4vw,38px);line-height:1.12;margin:8px 0}.sub{color:var(--muted);font-size:14px;margin:0}.back{border:1px solid var(--line);padding:9px 15px;border-radius:999px;text-decoration:none;font-size:13px;white-space:nowrap}
.hero{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin-top:22px}.panel{background:#1b1a19eF;border:1px solid var(--line);border-radius:18px;padding:22px}.hero h2{font-size:21px;margin:6px 0 10px}.hero p{color:var(--muted);font-size:14px;margin:0}.resources{display:grid;gap:10px;margin-top:12px}.resource{display:block;border:1px solid var(--line);border-radius:12px;padding:12px;text-decoration:none}.resource strong{display:block;font-size:13px}.resource span{display:block;color:var(--muted);font-size:12px;margin-top:3px}
.searchform{margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:block;color:var(--muted);font-size:12px}.field input,.field select,.field textarea,.filter{width:100%;margin-top:5px;border:1px solid var(--line);border-radius:10px;background:#11100f;color:var(--text);padding:11px 12px;outline:none}.field input:focus,.filter:focus{border-color:var(--accent)}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.primary,.secondary,.small{border-radius:999px;padding:10px 17px;font-size:13px;font-weight:700}.primary{border:0;background:var(--accent2);color:#17121f}.primary:disabled{opacity:.55;cursor:wait}.secondary,.small{border:1px solid var(--line);background:transparent;color:var(--text)}
.sectionhead{display:flex;justify-content:space-between;align-items:end;gap:14px;margin:30px 0 12px}.sectionhead h2{font-size:21px;margin:4px 0}.count{color:var(--muted);font-size:13px}.filter{max-width:360px}.notice{margin:12px 0;color:#c6efce;font-size:13px}.results,.leads{display:grid;gap:10px;margin-top:14px}.result,.lead{border:1px solid var(--line);background:#1b1a19;border-radius:14px;padding:15px}.result h3,.lead h3{font-size:15px;margin:0}.result p,.lead p{font-size:13px;color:var(--muted);margin:6px 0}.resultmeta{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:10px}.empty{border:1px dashed var(--line);border-radius:14px;padding:30px;text-align:center;color:var(--muted);font-size:13px}.status{border:1px solid var(--line);border-radius:999px;padding:5px 9px;background:#11100f;color:var(--text);font-size:11px}.leadtop{display:flex;justify-content:space-between;gap:12px;align-items:start}.foot{border-top:1px solid var(--line);margin-top:28px;padding-top:16px;color:var(--muted);font-size:11px}.warning{margin-top:20px;border:1px solid #806a3b66;background:#6b55201c;border-radius:14px;padding:15px;color:#d5c7a5;font-size:12px}
@media(max-width:760px){.hero{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}.fields{grid-template-columns:1fr}.sectionhead{align-items:stretch;flex-direction:column}.filter{max-width:none}}
</style>
</head>
<body>
<div class="wrap">
<header class="top"><div><div class="eyebrow">Intro 2 Society · Public-record research</div><h1>Probate Property Search</h1><p class="sub">Find public sources, organize estate leads, and track verification.</p></div><a class="back" href="/">← Intro2Society home</a></header>
<section class="hero">
<div class="panel">
<div class="eyebrow">Research workspace</div><h2>Search public sources by estate and locality</h2>
<p>This tool searches public web pages for relevant probate and property references. It is not a court database and does not confirm that an estate owns or is selling a property.</p>
<form id="search-form" class="searchform">
<div class="fields">
<label class="field">Estate / decedent name<input id="decedent" maxlength="120" required placeholder="Enter full name"></label>
<label class="field">Virginia county or independent city<input id="locality" maxlength="120" required value="Lynchburg City" placeholder="e.g. Campbell County"></label>
</div>
<div class="actions"><button class="primary" id="search-button" type="submit">Search public sources</button><button class="secondary" id="add-button" type="button">+ Add lead manually</button></div>
</form>
<div id="notice" class="notice" role="status" aria-live="polite"></div>
</div>
<aside class="panel"><div class="eyebrow">Official Virginia resources</div><div class="resources">
<a class="resource" href="https://www.vacourts.gov/courts/circuit/home" target="_blank" rel="noopener noreferrer"><strong>Virginia Circuit Court directory ↗</strong><span>Find the court clerk for the county or independent city.</span></a>
<a class="resource" href="https://www.courts.state.va.us/caseinfo/home" target="_blank" rel="noopener noreferrer"><strong>Virginia case information ↗</strong><span>Check the official online case-information options.</span></a>
<a class="resource" href="https://selfhelp.vacourts.gov/page/23/find-case" target="_blank" rel="noopener noreferrer"><strong>How to find a court case ↗</strong><span>Guidance on locating records and contacting the clerk.</span></a>
</div></aside>
</section>
<section>
<div class="sectionhead"><div><div class="eyebrow">Search output</div><h2>Public web results</h2></div><span class="count" id="result-count">No search performed</span></div>
<div class="results" id="results"><div class="empty">Enter an estate name and locality to begin searching public sources.</div></div>
</section>
<section>
<div class="sectionhead"><div><div class="eyebrow">Your private browser list</div><h2>Saved research leads <span class="count" id="lead-count">(0)</span></h2></div><input class="filter" id="filter" placeholder="Filter by name, locality, case, or address" aria-label="Filter saved leads"></div>
<div class="actions"><button class="secondary" id="export-button" type="button">Export backup</button></div>
<div class="leads" id="leads"><div class="empty">Your research list is ready. Save a search result or add a lead manually.</div></div>
</section>
<div class="warning"><strong>Verify before relying on a lead.</strong> Virginia probate records are maintained by local Circuit Court clerks, and online access varies by locality. Search results can be incomplete or unrelated. Confirm the estate record with the clerk and independently verify property ownership, liens, authority to sell, and all property details. Do not save Social Security numbers, account details, or confidential information here.</div>
<footer class="foot">Intro 2 Society · Independent probate research tool · Not affiliated with Tranchi AI · Entries are stored only in this browser on this device.</footer>
</div>
<script>
(function(){
const KEY="i2s.probate.leads.v1";
const $=id=>document.getElementById(id);
let leads=[];
try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(saved))leads=saved;}catch(e){}
let currentResults=[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(leads));}catch(e){$("notice").textContent="Browser storage is unavailable. Export a backup to keep your entries.";}}
function escLink(value){try{const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch(e){return "";}}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function renderResults(){
const root=$("results");root.replaceChildren();$("result-count").textContent=currentResults.length+" result(s)";
if(!currentResults.length){root.append(node("div","empty","No results to display. Try another spelling or locality, or use the official court links."));return;}
currentResults.forEach(item=>{
const card=node("article","result"),url=escLink(item.url),heading=url?node("a","",item.title):node("span","",item.title);
if(url){heading.href=url;heading.target="_blank";heading.rel="noopener noreferrer";}
const h=node("h3");h.append(heading);card.append(h);card.append(node("p","",item.description||"No description supplied."));
const meta=node("div","resultmeta");meta.append(node("span","",item.sourceType+(item.date?" · "+item.date:"")));
const save=node("button","small","Save as lead");save.type="button";save.addEventListener("click",()=>{const name=$("decedent").value.trim(),locality=$("locality").value.trim();leads.unshift({id:crypto.randomUUID(),decedent:name,locality:locality,caseNumber:"",filingDate:"",propertyAddress:"",sourceUrl:url,notes:item.description||"",status:"Needs review",createdAt:new Date().toISOString()});persist();renderLeads();$("notice").textContent="Saved as an unverified research lead.";});meta.append(save);card.append(meta);root.append(card);
});
}
function renderLeads(){
const root=$("leads"),term=$("filter").value.trim().toLowerCase();root.replaceChildren();
const filtered=leads.filter(l=>[l.decedent,l.locality,l.caseNumber,l.propertyAddress,l.notes].join(" ").toLowerCase().includes(term));
$("lead-count").textContent="("+leads.length+")";
if(!filtered.length){root.append(node("div","empty",leads.length?"No saved leads match that filter.":"Your research list is ready. Save a search result or add a lead manually."));return;}
filtered.forEach(lead=>{
const card=node("article","lead"),top=node("div","leadtop"),left=node("div"),title=node("h3","",lead.decedent||"Unnamed estate");left.append(title);left.append(node("p","",(lead.locality||"Locality not entered")+(lead.caseNumber?" · Ref: "+lead.caseNumber:"")));if(lead.propertyAddress)left.append(node("p","",lead.propertyAddress));if(lead.filingDate)left.append(node("p","","Record date: "+lead.filingDate));if(lead.notes)left.append(node("p","",lead.notes));
if(lead.sourceUrl){const link=escLink(lead.sourceUrl);if(link){const a=node("a","","Open saved source ↗");a.href=link;a.target="_blank";a.rel="noopener noreferrer";left.append(a);}}
const right=node("div"),status=document.createElement("select");status.className="status";["Needs review","Clerk confirmed","Property verified","Archived"].forEach(s=>{const op=document.createElement("option");op.value=s;op.textContent=s;status.append(op);});status.value=lead.status||"Needs review";status.setAttribute("aria-label","Verification status");status.addEventListener("change",()=>{lead.status=status.value;persist();});right.append(status);
const del=node("button","small","Delete");del.type="button";del.style.marginTop="8px";del.addEventListener("click",()=>{leads=leads.filter(x=>x.id!==lead.id);persist();renderLeads();});right.append(del);top.append(left,right);card.append(top);root.append(card);
});
}
$("search-form").addEventListener("submit",async e=>{
e.preventDefault();const decedent=$("decedent").value.trim(),locality=$("locality").value.trim();if(!decedent||!locality)return;
const button=$("search-button");button.disabled=true;button.textContent="Searching…";$("notice").textContent="";currentResults=[];renderResults();
try{const response=await fetch("/api/probate-search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decedent,locality})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Public search failed.");currentResults=Array.isArray(data.results)?data.results:[];renderResults();if(!currentResults.length)$("notice").textContent="No public web results were returned. Try another spelling or use the official court links.";}
catch(err){$("notice").textContent=err.message||"Search failed. Please try again.";}
finally{button.disabled=false;button.textContent="Search public sources";}
});
$("add-button").addEventListener("click",()=>{
const decedent=prompt("Estate or decedent name:");if(!decedent||!decedent.trim())return;const locality=prompt("Virginia county or independent city:","Lynchburg City");if(!locality||!locality.trim())return;
leads.unshift({id:crypto.randomUUID(),decedent:decedent.trim(),locality:locality.trim(),caseNumber:"",filingDate:"",propertyAddress:"",sourceUrl:"",notes:"",status:"Needs review",createdAt:new Date().toISOString()});persist();renderLeads();$("notice").textContent="Manual research lead saved.";
});
$("filter").addEventListener("input",renderLeads);
$("export-button").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(leads,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="intro2society-probate-leads.json";a.click();URL.revokeObjectURL(url);});
renderLeads();
})();
</script>
</body></html>`;
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/probate" || url.pathname === "/probate/") {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      return new Response(request.method === "HEAD" ? null : page, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
        }
      });
    }
    return new Response("Not found", { status: 404 });
  }
};
