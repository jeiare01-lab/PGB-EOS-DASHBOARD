import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── SUPABASE CONFIG (REST API — no external library needed) ──────────────────
const SB_URL = "https://dfuuqhtlrqewipcmcspo.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmdXVxaHRscnFld2lwY21jc3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODY2MDYsImV4cCI6MjA4OTk2MjYwNn0.rm5ulcCR-u0RIzCP-0RYVmdi9t9G3Yz03p4QQ5881CU";
const HEADERS = { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
const HEADERS_RETURN = { ...HEADERS, "Prefer": "return=representation" };

const sbFetch = async (table, opts = {}) => {
  const { method = "GET", body, query = "" } = opts;
  const isPatch = method === "PATCH";
  const res = await fetch(`${SB_URL}/rest/v1/${table}${query}`, {
    method, headers: isPatch ? HEADERS : HEADERS_RETURN, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 || isPatch ? null : res.json();
};

const db = {
  select:  (table, query="") => sbFetch(table, { query: `?${query}&order=id` }),
  upsert:  (table, body)     => sbFetch(table, { method:"POST", body: Array.isArray(body)?body:[body], query:"?on_conflict=id" }),
  remove:  (table, id)       => sbFetch(table, { method:"DELETE", query:`?id=eq.${id}` }),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTORS = ["Construction & Manufacturing","Real Estate & Property Management","Human Capital Development","Maritime Logistics"];

const SEED_REVENUE = [
  { id:1,  company:"ABC",    full_name:"ABC Lightweight Block Corp.",                   sector:"Construction & Manufacturing",      annual_target:408000000,   q1_target:102000000, q1_actual:0, ytd_actual:0 },
  { id:2,  company:"CSI",    full_name:"CSI - Construction & Supply Inc.",               sector:"Construction & Manufacturing",      annual_target:600000000,   q1_target:150000000, q1_actual:0, ytd_actual:0 },
  { id:3,  company:"PSC",    full_name:"PSC - Primary Structures Corp.",                 sector:"Construction & Manufacturing",      annual_target:1000000000,  q1_target:500000000, q1_actual:0, ytd_actual:0 },
  { id:4,  company:"PHI",    full_name:"PHI Residential",                               sector:"Real Estate & Property Management", annual_target:2600000000,  q1_target:650000000, q1_actual:0, ytd_actual:0 },
  { id:5,  company:"PPC",    full_name:"PPC Commercial & Industrial",                   sector:"Real Estate & Property Management", annual_target:1000000000,  q1_target:250000000, q1_actual:0, ytd_actual:0 },
  { id:6,  company:"SEAMAN", full_name:"SEAMAN - Human Capital Development",             sector:"Human Capital Development",         annual_target:14637000,    q1_target:1000000,   q1_actual:0, ytd_actual:0 },
  { id:7,  company:"SKILLS", full_name:"SKILLS - Human Capital Development",             sector:"Human Capital Development",         annual_target:46769000,    q1_target:3000000,   q1_actual:0, ytd_actual:0 },
  { id:8,  company:"PSEFI",  full_name:"PSEFI - Human Capital Development",              sector:"Human Capital Development",         annual_target:33500000,    q1_target:4000000,   q1_actual:0, ytd_actual:0 },
  { id:9,  company:"PSI",    full_name:"PSI - Primary Skills Inc.",                     sector:"Human Capital Development",         annual_target:59300000,    q1_target:8000000,   q1_actual:0, ytd_actual:0 },
  { id:10, company:"PTMSI",  full_name:"PTMSI - Primary Trident Marine Solutions Inc.", sector:"Maritime Logistics",                annual_target:1400000000,  q1_target:350000000, q1_actual:0, ytd_actual:0 },
  { id:11, company:"AMICI",  full_name:"AMICI - Maritime Logistics",                    sector:"Maritime Logistics",                annual_target:254000000,   q1_target:63500000,  q1_actual:0, ytd_actual:0 },
  { id:12, company:"CSPIC",  full_name:"CSPIC - Cebu South Port Infrastructure Corp.", sector:"Maritime Logistics",                annual_target:120000000,   q1_target:30000000,  q1_actual:0, ytd_actual:0 },
];

const SEED_ROCKS = [
  { id:"r1",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"Transfer / Improvement of Batangas Yard",            owner:"JHL",           target:"100%",      progress:90,   status:"On Track",     notes:"Small area left; drainage to finish by end of March" },
  { id:"r2",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"Vibrating Screen for Sand",                          owner:"Engineering",   target:"100%",      progress:100,  status:"✓ Target Met", notes:"Testing done" },
  { id:"r3",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"Secure High Value Clients (≥2)",                     owner:"Sales",         target:"2 clients", progress:100,  status:"✓ Target Met", notes:"Secured 6" },
  { id:"r4",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"QR System (Odoo) — External Delivery",               owner:"ABC SID",       target:"Beta Test", progress:25,   status:"At Risk",      notes:"Queued after EPICS, Q2 target" },
  { id:"r5",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"Increase in Collection Efficiency",                  owner:"ABC SID",       target:"85%",       progress:75,   status:"On Track",     notes:"" },
  { id:"r6",  bu:"AAC",   sector:"Construction & Manufacturing",      initiative:"Fill Up Vacant RnF Positions",                       owner:"HR",            target:"6 pos.",    progress:33,   status:"At Risk",      notes:"2/6 filled" },
  { id:"r7",  bu:"PSC",   sector:"Construction & Manufacturing",      initiative:"Complete Phase 1 Structural Works",                  owner:"Ops",           target:"100%",      progress:65,   status:"On Track",     notes:"" },
  { id:"r8",  bu:"PSC",   sector:"Construction & Manufacturing",      initiative:"Safety Compliance Audit",                            owner:"QHSE",          target:"100%",      progress:100,  status:"✓ Target Met", notes:"Passed all criteria" },
  { id:"r9",  bu:"PHI",   sector:"Real Estate & Property Management", initiative:"Launch Residential Project Phase 2",                 owner:"PM",            target:"100%",      progress:50,   status:"On Track",     notes:"" },
  { id:"r10", bu:"PHI",   sector:"Real Estate & Property Management", initiative:"Collection Rate Improvement",                        owner:"Finance",       target:"90%",       progress:72,   status:"On Track",     notes:"" },
  { id:"r11", bu:"PSI",   sector:"Human Capital Development",         initiative:"Reach Households (target 1,760)",                    owner:"Ashlyn",        target:"8%",        progress:42.6, status:"At Risk",      notes:"Annual: 1760 | Quarter: 450 | Current: 192" },
  { id:"r12", bu:"PSI",   sector:"Human Capital Development",         initiative:"Japan Skilled Workers — Screening & Nihongo",        owner:"Ashlyn/Jean",   target:"60%",       progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r13", bu:"PSI",   sector:"Human Capital Development",         initiative:"Completion of Performance Plans",                    owner:"Ashlyn",        target:"30%",       progress:50,   status:"At Risk",      notes:"" },
  { id:"r14", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"Manpower Marina Safety Manning",                     owner:"OPS/HR",        target:"0.95",      progress:98,   status:"On Track",     notes:"" },
  { id:"r15", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"Operations Requirements based on Vessel Activities", owner:"OPS/HR",        target:"0.85",      progress:78,   status:"On Track",     notes:"" },
  { id:"r16", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"100% Categorization of Items for WH",               owner:"OPS/Whse",      target:"1",         progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r17", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"As Built Plan (ABP): Tug Boat",                     owner:"Tech Supt",     target:"1",         progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r18", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"As Built Plan (ABP): LCT",                          owner:"Tech Supt",     target:"0.95",      progress:95,   status:"On Track",     notes:"" },
  { id:"r19", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"Meeting Marina Requirements for Passenger Ships",   owner:"Tech Supt/OPS", target:"0.7",       progress:75,   status:"On Track",     notes:"" },
  { id:"r20", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"Accredit ≥2 New Subcon of AMICI/PTMSI",             owner:"SCM/BPM",       target:"2",         progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r21", bu:"PTMSI", sector:"Maritime Logistics",                initiative:"Rent to Own Program for Subcon",                    owner:"SCM/BPM/GM",    target:"1",         progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r22", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Identify Next-in-Line for Critical Roles",          owner:"Ops/HR",        target:"100%",      progress:67,   status:"At Risk",      notes:"Ops Head & QC identified; Commercial hiring ongoing" },
  { id:"r23", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Establish IDP to Address Succession Gaps",          owner:"Ops/HR",        target:"100%",      progress:50,   status:"At Risk",      notes:"IDP targeting Key Technical Training (Q2)" },
  { id:"r24", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Install 3 Additional Transformers in Shipyard",     owner:"GM/BPM/Ops",    target:"3 units",   progress:100,  status:"✓ Target Met", notes:"" },
  { id:"r25", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Identify Facilities Maintenance Team",              owner:"Ops/HR",        target:"100%",      progress:80,   status:"On Track",     notes:"" },
  { id:"r26", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Develop & Implement Standardized PMS",              owner:"OPS",           target:"1",         progress:10,   status:"Pending",      notes:"Follow through on maintenance program" },
  { id:"r27", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Implement Comprehensive Maintenance Program",       owner:"OPS",           target:"100%",      progress:80,   status:"On Track",     notes:"" },
  { id:"r28", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Accredit ≥2 New Structural Subcontractors",         owner:"SCM/BPM",       target:"2",         progress:100,  status:"✓ Target Met", notes:"A&A, C&A, Cleat Builders, Andes Ship Repair" },
  { id:"r29", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Draft & Align RTO Program with PSC",               owner:"SCM/BPM/GM",    target:"100%",      progress:100,  status:"✓ Target Met", notes:"Aligned & reviewed" },
  { id:"r30", bu:"AMICI", sector:"Maritime Logistics",                initiative:"Implement RTO Program for Subcontractors",          owner:"SCM/BPM/GM",    target:"100%",      progress:100,  status:"✓ Target Met", notes:"1 applicant for implementation" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => n>=1e9?`₱${(n/1e9).toFixed(2)}B`:n>=1e6?`₱${(n/1e6).toFixed(1)}M`:n>0?`₱${(n/1e3).toFixed(0)}K`:"₱0";
const pct  = (a,b) => b===0?0:Math.min(100,Math.round((a/b)*100));

const STATUS_CFG = {
  "✓ Target Met":{ bg:"#e8f5f0", text:"#0e7a5a", dot:"#0e7a5a" },
  "On Track":    { bg:"#e8f0fa", text:"#1a5fb4", dot:"#1a5fb4" },
  "At Risk":     { bg:"#fdf0e8", text:"#c0480a", dot:"#c0480a" },
  "Pending":     { bg:"#eef0f4", text:"#5a6478", dot:"#5a6478" },
};

const SECTOR_CLR = {
  "Construction & Manufacturing":      "#2e6da4",
  "Real Estate & Property Management": "#1a7a6e",
  "Human Capital Development":         "#5c4db1",
  "Maritime Logistics":                "#0e7490",
};

const ROLES = {
  "bi@pgb.com":    { password:"bi2026",    role:"BI",    label:"Business Integrator" },
  "admin@pgb.com": { password:"admin2026", role:"Admin", label:"Administrator" },
};

const C = { bg:"#e8edf5", surface:"#dce4f0", card:"#ffffff", border:"#b8c5d9", text:"#0a1628", muted:"#2d4a6e", accent:"#1a3f7a" };

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]               = useState(null);
  const [page,setPage]               = useState("overview");
  const [revenue,setRevenue]         = useState(SEED_REVENUE);
  const [rocks,setRocks]             = useState(SEED_ROCKS);
  const [syncStatus,setSyncStatus]   = useState("idle");
  const [lastSync,setLastSync]       = useState(null);
  const [loginEmail,setLoginEmail]   = useState("");
  const [loginPass,setLoginPass]     = useState("");
  const [loginErr,setLoginErr]       = useState("");
  const [activeSector,setActiveSector] = useState("All");
  const [rockModal,setRockModal]     = useState(null);
  const [revModal,setRevModal]       = useState(null);
  const pollRef = useRef(null);

  const isAdmin = user?.role==="Admin";
  const isOwner = user?.role==="BI"||isAdmin;

  // ── Audit Log helper ───────────────────────────────────────────────────────
  const writeAudit = async (action, tableName, recordId, fieldChanged, oldValue, newValue) => {
    try {
      await db.upsert("audit_log", {
        action, table_name: tableName, record_id: String(recordId),
        field_changed: fieldChanged,
        old_value: String(oldValue ?? ""), new_value: String(newValue ?? ""),
        changed_by: user?.email, changed_by_role: user?.role,
        changed_at: new Date().toISOString(),
      });
    } catch(e) { console.warn("Audit log failed:", e.message); }
  };

  // ── Poll Supabase every 15s for live updates ───────────────────────────────
  const fetchAll = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      const [rev, rks] = await Promise.all([
        db.select("revenue"),
        db.select("rocks"),
      ]);
      if (rev?.length)  setRevenue(rev);
      if (rks?.length)  setRocks(rks);
      setSyncStatus("live");
      setLastSync(new Date());
    } catch(e) {
      setSyncStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!user) { clearInterval(pollRef.current); return; }
    fetchAll();
    pollRef.current = setInterval(fetchAll, 15000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchAll]);

  // ── Write helpers ──────────────────────────────────────────────────────────
  const saveRevenue = async (row) => {
    try {
      const { id, updated_at, _activeQ, ...fields } = row;
      const clean = {
        ...fields,
        annual_target: Math.round(Number(fields.annual_target)||0),
        q1_target: Math.round(Number(fields.q1_target)||0),
        q1_actual: Math.round(Number(fields.q1_actual)||0),
        q2_target: Math.round(Number(fields.q2_target)||0),
        q2_actual: Math.round(Number(fields.q2_actual)||0),
        q3_target: Math.round(Number(fields.q3_target)||0),
        q3_actual: Math.round(Number(fields.q3_actual)||0),
        q4_target: Math.round(Number(fields.q4_target)||0),
        q4_actual: Math.round(Number(fields.q4_actual)||0),
      };
      // Find old values for audit
      const old = revenue.find(r=>r.id===row.id)||{};
      await sbFetch("revenue", { method:"PATCH", body:clean, query:`?id=eq.${id}` });
      setRevenue(prev => prev.map(r=>r.id===row.id?{...row,...clean}:r));
      setLastSync(new Date()); setSyncStatus("live");
      // Write audit entries for changed fields
      const auditFields = ["annual_target","q1_target","q1_actual","q2_target","q2_actual","q3_target","q3_actual","q4_target","q4_actual","company","full_name","sector"];
      for (const f of auditFields) {
        if (clean[f] !== undefined && String(clean[f]) !== String(old[f]??'')) {
          await writeAudit("UPDATE", "revenue", id, f, old[f]??'', clean[f]);
        }
      }
    } catch(e) { alert("Save failed: "+e.message); }
  };

  const saveRock = async (rock) => {
    const isNew = !rock.id;
    const payload = isNew ? {...rock, id:`r${Date.now()}`} : rock;
    try {
      const old = rocks.find(r=>r.id===rock.id)||{};
      if (isNew) {
        await db.upsert("rocks", payload);
        await writeAudit("CREATE", "rocks", payload.id, "initiative", "", payload.initiative);
      } else {
        const { id, updated_at, ...fields } = payload;
        await sbFetch("rocks", { method:"PATCH", body:fields, query:`?id=eq.${id}` });
        const auditFields = ["initiative","owner","target","progress","status","notes","bu","sector"];
        for (const f of auditFields) {
          if (fields[f] !== undefined && String(fields[f]) !== String(old[f]??'')) {
            await writeAudit("UPDATE", "rocks", id, f, old[f]??'', fields[f]);
          }
        }
      }
      setRocks(prev => isNew ? [...prev,payload] : prev.map(r=>r.id===payload.id?payload:r));
      setLastSync(new Date()); setSyncStatus("live");
    } catch(e) { alert("Save failed: "+e.message); }
  };

  const deleteRock = async (id) => {
    try {
      const rock = rocks.find(r=>r.id===id);
      await db.remove("rocks", id);
      setRocks(prev => prev.filter(r=>r.id!==id));
      await writeAudit("DELETE", "rocks", id, "initiative", rock?.initiative??'', "");
    } catch(e) { alert("Delete failed: "+e.message); }
  };

  const handleLogin = () => {
    const found = ROLES[loginEmail.toLowerCase()];
    if (found && found.password===loginPass) { setUser({email:loginEmail,...found}); setLoginErr(""); }
    else setLoginErr("Invalid credentials. Please try again.");
  };

  if (!user) return <Login email={loginEmail} setEmail={setLoginEmail} pass={loginPass} setPass={setLoginPass} err={loginErr} onLogin={handleLogin}/>;

  return (
    <div style={S.shell}>
      <Sidebar page={page} setPage={setPage} user={user} syncStatus={syncStatus} lastSync={lastSync} onRefresh={fetchAll} onLogout={()=>{setUser(null);setSyncStatus("idle");clearInterval(pollRef.current);}}/>
      <main style={S.main}>
        {page==="overview"  && <OverviewPage  revenue={revenue}  activeSector={activeSector} setActiveSector={setActiveSector} isOwner={isOwner} onEditRev={r=>setRevModal(r)}/>}
        {page==="rocks"     && <RocksPage     rocks={rocks}      isOwner={isOwner} onSave={saveRock} onDelete={deleteRock} modal={rockModal} setModal={setRockModal}/>}
        {page==="scorecard" && <ScorecardPage rocks={rocks}      revenue={revenue}/>}
        {page==="audit"     && <AuditPage     isAdmin={isAdmin}/>}
      </main>
      {revModal&&isOwner&&<RevModal data={revModal} isAdmin={isAdmin} onSave={async u=>{await saveRevenue(u);setRevModal(null);}} onClose={()=>setRevModal(null)}/>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({email,setEmail,pass,setPass,err,onLogin}) {
  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>PGB</div>
        <div style={S.loginSub}>EOS Executive Dashboard</div>
        <div style={{height:1,background:C.border,margin:"8px 0"}}/>
        <input style={S.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()}/>
        <input style={S.input} placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()}/>
        {err&&<div style={{color:"#c0392b",fontSize:12}}>{err}</div>}
        <button style={S.btnPrimary} onClick={onLogin}>Sign In</button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({page,setPage,user,syncStatus,lastSync,onRefresh,onLogout}) {
  const nav=[
    {id:"overview",  label:"Revenue Overview", icon:"▣"},
    {id:"rocks",     label:"Rocks Tracker",    icon:"◈"},
    {id:"scorecard", label:"Sector Scorecard",  icon:"◉"},
    ...(user?.role==="Admin"?[{id:"audit", label:"Audit Log", icon:"◎"}]:[]),
  ];
  const dotClr={idle:"#ccc",syncing:"#f2c94c",live:"#2a7a50",error:"#b85c1a"}[syncStatus];
  const dotLbl={idle:"Not connected",syncing:"Syncing…",live:"Live · Supabase",error:"Offline data"}[syncStatus];
  return (
    <nav style={S.sidebar}>
      <div>
        <div style={{padding:"0 24px 4px",display:"flex",flexDirection:"column"}}>
          <span style={{fontSize:22,fontWeight:900,letterSpacing:5,color:"#e2eaf5"}}>PGB</span>
          <span style={{fontSize:9,color:"#4a7096",letterSpacing:2,textTransform:"uppercase"}}>EOS Dashboard</span>
        </div>
        <div style={{padding:"4px 24px 8px",fontSize:11,color:"#4a8fd4",letterSpacing:2}}>Q1 · YTD 2026</div>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"2px 24px 12px"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:dotClr,flexShrink:0,display:"inline-block"}}/>
          <span style={{fontSize:10,color:"#4a7096"}}>{dotLbl}</span>
          {lastSync&&<span style={{fontSize:9,color:"#2d4a6e",marginLeft:"auto"}}>{lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
          <button onClick={onRefresh} title="Refresh" style={{background:"none",border:"none",cursor:"pointer",color:"#4a7096",fontSize:13,padding:"0 0 0 4px"}}>↻</button>
        </div>
        <div style={{height:1,background:"#1a2e4a",margin:"0 24px 16px"}}/>
        {nav.map(n=>(
          <button key={n.id} style={{...S.navBtn,...(page===n.id?S.navBtnActive:{})}} onClick={()=>setPage(n.id)}>
            <span style={{fontSize:16,width:20}}>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </div>
      <div style={{padding:"0 24px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:2,color:user.role==="Admin"?"#f59e0b":"#4a8fd4"}}>
          {user.label}{user.role==="Admin"&&<span style={{marginLeft:8,background:"#f59e0b",color:"#0a1628",fontSize:9,padding:"2px 6px",borderRadius:3,fontWeight:700}}>ADMIN</span>}
        </div>
        <div style={{fontSize:10,color:"#2d4a6e",marginBottom:12}}>{user.email}</div>
        <button style={S.btnGhost} onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const QUARTERS = ["Q1","Q2","Q3","Q4"];
const Q_MONTHS = { Q1:"Jan–Mar", Q2:"Apr–Jun", Q3:"Jul–Sep", Q4:"Oct–Dec" };

function OverviewPage({revenue,activeSector,setActiveSector,isOwner,onEditRev}) {
  const [activeQ, setActiveQ] = useState("Q1");
  const qT = k => `${activeQ.toLowerCase()}_${k}`;
  const filtered = activeSector==="All"?revenue:revenue.filter(r=>r.sector===activeSector);
  const g = k => filtered.reduce((s,r)=>s+(r[k]||0),0);

  // Selected quarter
  const tAnnual = g("annual_target");
  const tQT     = g(qT("target"));
  const tQA     = g(qT("actual"));

  // Full year YTD = sum of all quarters actual
  const tYTD = filtered.reduce((s,r)=>s+(r.q1_actual||0)+(r.q2_actual||0)+(r.q3_actual||0)+(r.q4_actual||0),0);

  // Sector rollup for selected quarter
  const sectorRollup = SECTORS.map(sec=>{
    const rows=revenue.filter(r=>r.sector===sec);
    return {
      sector: sec,
      annualTarget: rows.reduce((s,r)=>s+(r.annual_target||0),0),
      qTarget:      rows.reduce((s,r)=>s+(r[qT("target")]||0),0),
      qActual:      rows.reduce((s,r)=>s+(r[qT("actual")]||0),0),
      ytd:          rows.reduce((s,r)=>s+(r.q1_actual||0)+(r.q2_actual||0)+(r.q3_actual||0)+(r.q4_actual||0),0),
    };
  });

  return (
    <div style={S.page}>
      <PH title="Revenue Overview" sub={`Business Unit & Sector Performance · ${activeQ} 2026`}/>

      {/* Quarter Switcher */}
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,marginRight:4,letterSpacing:1}}>QUARTER:</span>
        {QUARTERS.map(q=>(
          <button key={q} onClick={()=>setActiveQ(q)} style={{
            padding:"6px 18px", borderRadius:4, border:`1px solid ${activeQ===q?"#1a3f7a":C.border}`,
            background: activeQ===q?"#1a3f7a":"none",
            color: activeQ===q?"#fff":C.muted,
            fontSize:12, fontWeight:activeQ===q?700:400, cursor:"pointer", letterSpacing:1,
          }}>{q}</button>
        ))}
        <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{Q_MONTHS[activeQ]} 2026</span>
      </div>

      {/* KPI Strip */}
      <div style={S.strip}>
        <KPI label="Annual Target"          val={fmt(tAnnual)} sub="FY 2026"                                        clr="#64748b"/>
        <KPI label={`${activeQ} Target`}    val={fmt(tQT)}     sub={Q_MONTHS[activeQ]}                              clr="#1a3f7a"/>
        <KPI label={`${activeQ} Actual`}    val={fmt(tQA)}     sub={`${pct(tQA,tQT)}% of ${activeQ} target`}        clr="#0e7490"/>
        <KPI label="Full Year YTD"          val={fmt(tYTD)}    sub={`${pct(tYTD,tAnnual)}% of annual`}              clr="#c0480a"/>
      </div>

      {/* Full Year Progress Bar */}
      <div style={{...S.card,padding:20,marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>Full Year Progress — All Quarters</div>
        {QUARTERS.map(q=>{
          const qt = filtered.reduce((s,r)=>s+(r[`${q.toLowerCase()}_target`]||0),0);
          const qa = filtered.reduce((s,r)=>s+(r[`${q.toLowerCase()}_actual`]||0),0);
          const p  = pct(qa,qt);
          const clr= p>=100?"#0e7a5a":p>=75?"#1a5fb4":p>=25?"#c0480a":"#b8c5d9";
          return (
            <div key={q} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:q===activeQ?700:400,color:q===activeQ?"#0a1628":C.muted}}>{q} {Q_MONTHS[q]}</span>
                <span style={{fontSize:11,color:C.muted}}>{fmt(qa)} / {fmt(qt)} <span style={{fontWeight:700,color:clr}}>{p}%</span></span>
              </div>
              <div style={{height:q===activeQ?8:5,background:C.border,borderRadius:3,overflow:"hidden",border:q===activeQ?`1px solid #1a3f7a`:"none"}}>
                <div style={{height:"100%",width:`${Math.min(p,100)}%`,background:clr,borderRadius:3,transition:"width 0.4s"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Filter */}
      <div style={S.filterRow}>
        {["All",...SECTORS].map(s=>(
          <button key={s} style={{...S.filterBtn,...(activeSector===s?S.filterBtnActive:{})}} onClick={()=>setActiveSector(s)}>
            {s==="All"?"All BUs":s==="Construction & Manufacturing"?"Construction":s==="Real Estate & Property Management"?"Real Estate":s==="Human Capital Development"?"Human Capital":s==="Maritime Logistics"?"Maritime":s}
          </button>
        ))}
      </div>

      {/* Sector Cards */}
      {activeSector==="All"&&<div style={S.sectorGrid}>{sectorRollup.map(s=><SectorCard key={s.sector} d={s} activeQ={activeQ}/>)}</div>}

      {/* BU Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Business Unit Revenue Detail — {activeQ} {Q_MONTHS[activeQ]}</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:C.surface}}>
            <th style={{...S.th,textAlign:"left"}}>Company</th>
            <th style={S.th}>Annual Target</th>
            <th style={S.th}>{activeQ} Target</th>
            <th style={S.th}>{activeQ} Actual</th>
            <th style={S.th}>{activeQ} Attainment</th>
            <th style={S.th}>YTD Actual</th>
            <th style={S.th}>YTD vs Annual</th>
            {isOwner&&<th style={S.th}>Edit</th>}
          </tr></thead>
          <tbody>{filtered.map((r,i)=>{
            const qp  = pct(r[qT("actual")]||0, r[qT("target")]||0);
            const ytd = (r.q1_actual||0)+(r.q2_actual||0)+(r.q3_actual||0)+(r.q4_actual||0);
            const ytdp= pct(ytd, r.annual_target||0);
            return <tr key={r.id} style={{background:i%2?C.surface:"transparent"}}>
              <td style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid rgba(0,0,0,0.05)`}}>
                <span style={S.buTag}>{r.company}</span><span style={{color:C.muted,fontSize:11}}>{r.full_name}</span>
              </td>
              <td style={S.td}>{fmt(r.annual_target||0)}</td>
              <td style={S.td}>{fmt(r[qT("target")]||0)}</td>
              <td style={S.td}>{fmt(r[qT("actual")]||0)}</td>
              <td style={S.td}><MBar pct={qp}   clr={qp  >=100?"#0e7a5a":qp  >=75?"#1a5fb4":"#c0480a"}/></td>
              <td style={S.td}>{fmt(ytd)}</td>
              <td style={S.td}><MBar pct={ytdp} clr={ytdp>=100?"#0e7a5a":ytdp>=75?"#1a5fb4":"#c0480a"}/></td>
              {isOwner&&<td style={S.td}><button style={S.editBtn} onClick={()=>onEditRev({...r,_activeQ:activeQ})}>Edit</button></td>}
            </tr>;
          })}</tbody>
        </table>
        {!isOwner&&<div style={{padding:"12px 20px",fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`}}>🔒 Read-only. Process Owners update via Google Sheets — syncs here every 15s via Supabase.</div>}
      </div>
    </div>
  );
}

function SectorCard({d, activeQ}) {
  const clr=SECTOR_CLR[d.sector]||"#1a3f7a";
  const qp = pct(d.qActual, d.qTarget);
  const ytdp = pct(d.ytd, d.annualTarget);
  return (
    <div style={{...S.sectorCard,borderTop:`3px solid ${clr}`}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{d.sector.split(" & ")[0].split(" ").slice(0,2).join(" ")}</div>
      <div style={{fontSize:10,color:C.muted,marginBottom:14}}>{d.sector}</div>
      <div style={{display:"flex",gap:16,marginBottom:12}}>
        <div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Annual Target</div><div style={{fontSize:14,fontWeight:700}}>{fmt(d.annualTarget)}</div></div>
        <div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{activeQ} Target</div><div style={{fontSize:14,fontWeight:700}}>{fmt(d.qTarget)}</div></div>
      </div>
      <PBar label={`${activeQ} Attainment`} p={qp}   clr={clr}/>
      <PBar label="YTD vs Annual"           p={ytdp} clr={clr}/>
    </div>
  );
}

// ─── ROCKS ────────────────────────────────────────────────────────────────────
function RocksPage({rocks,isOwner,onSave,onDelete,modal,setModal}) {
  const [fBU,setFBU]=useState("All"), [fSt,setFSt]=useState("All"), [saving,setSaving]=useState(false);
  const allBUs=["All",...Array.from(new Set(rocks.map(r=>r.bu)))];
  const filtered=rocks.filter(r=>(fBU==="All"||r.bu===fBU)&&(fSt==="All"||r.status===fSt));
  const n=rocks.length, met=rocks.filter(r=>r.status==="✓ Target Met").length;
  const onT=rocks.filter(r=>r.status==="On Track").length, atR=rocks.filter(r=>r.status==="At Risk").length;
  const pend=rocks.filter(r=>r.status==="Pending").length;
  const avg=n?Math.round(rocks.reduce((s,r)=>s+(r.progress||0),0)/n):0;
  const grouped={};
  filtered.forEach(r=>{if(!grouped[r.bu])grouped[r.bu]=[];grouped[r.bu].push(r);});
  return (
    <div style={S.page}>
      <PH title="Rocks Tracker" sub="Strategic Initiatives Progress · Q1 2026"/>
      <div style={S.strip}>
        <KPI label="Total Rocks"       val={n}        sub="across all BUs"                            clr="#64748b"/>
        <KPI label="Target Met"        val={met}      sub={`${n?Math.round(met/n*100):0}% complete`}  clr="#0e7a5a"/>
        <KPI label="On Track"          val={onT}      sub="progressing well"                          clr="#1a5fb4"/>
        <KPI label="At Risk / Pending" val={atR+pend} sub="needs attention"                           clr="#c0480a"/>
        <KPI label="Avg Progress"      val={`${avg}%`} sub="all initiatives"                          clr="#2563eb"/>
      </div>
      <div style={{...S.filterRow,justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <select style={S.select} value={fBU} onChange={e=>setFBU(e.target.value)}>{allBUs.map(b=><option key={b}>{b}</option>)}</select>
          <select style={S.select} value={fSt}  onChange={e=>setFSt(e.target.value)}>{["All","✓ Target Met","On Track","At Risk","Pending"].map(s=><option key={s}>{s}</option>)}</select>
        </div>
        {isOwner&&<button style={S.btnPrimary} onClick={()=>setModal("add")}>+ Add Rock</button>}
      </div>
      {Object.entries(grouped).map(([bu,rows])=>(
        <div key={bu} style={S.buGroup}>
          <div style={S.buGroupHdr}>
            <span style={{...S.buTag,fontSize:12,padding:"3px 10px"}}>{bu}</span>
            <span style={{fontSize:11,color:C.muted,flex:1}}>{rows[0].sector}</span>
            <span style={{fontSize:11,color:C.muted}}>{rows.length} rocks</span>
          </div>
          {rows.map(rock=><RockRow key={rock.id} rock={rock} isOwner={isOwner} onEdit={()=>setModal(rock)} onDelete={async()=>{if(window.confirm("Delete this rock?"))await onDelete(rock.id);}}/>)}
        </div>
      ))}
      {modal&&isOwner&&<RockModal rock={modal==="add"?null:modal} saving={saving} onSave={async r=>{setSaving(true);await onSave(r);setSaving(false);setModal(null);}} onClose={()=>setModal(null)}/>}
    </div>
  );
}

function RockRow({rock,isOwner,onEdit,onDelete}) {
  const cfg=STATUS_CFG[rock.status]||STATUS_CFG["Pending"], p=rock.progress||0;
  const pc=p>=100?"#0e7a5a":p>=70?"#1a5fb4":p>=40?"#c0480a":"#dc2626";
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:20,padding:"14px 18px",borderBottom:`1px solid rgba(0,0,0,0.06)`}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13,color:C.text,fontWeight:500,marginBottom:4}}>{rock.initiative}</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.muted}}>Owner: {rock.owner}</span>
          <span style={{fontSize:11,color:C.muted}}>Target: {rock.target}</span>
          {rock.notes&&<span style={{fontSize:11,color:"#334155",fontStyle:"italic"}}>{rock.notes}</span>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:240}}>
        <div style={{width:"100%"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:C.muted}}>Progress</span>
            <span style={{fontSize:11,fontWeight:700,color:pc}}>{p}%</span>
          </div>
          <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden",position:"relative"}}>
            <div style={{height:"100%",borderRadius:3,width:`${Math.min(p,100)}%`,background:pc,transition:"width 0.4s"}}/>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:2,background:"rgba(0,0,0,0.2)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginTop:2}}><span>0%</span><span>Target: {rock.target}</span></div>
        </div>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:cfg.bg,color:cfg.text}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot}}/>{rock.status}
        </span>
        {isOwner&&<div style={{display:"flex",gap:6}}><button style={S.editBtn} onClick={onEdit}>Edit</button><button style={{...S.editBtn,color:"#c0392b"}} onClick={onDelete}>Del</button></div>}
      </div>
    </div>
  );
}

// ─── SCORECARD ────────────────────────────────────────────────────────────────
function ScorecardPage({rocks,revenue}) {
  const [sec,setSec]=useState(SECTORS[0]);
  const sR=rocks.filter(r=>r.sector===sec), sV=revenue.filter(r=>r.sector===sec);
  const tA=sV.reduce((s,r)=>s+(r.annual_target||0),0), tQ1T=sV.reduce((s,r)=>s+(r.q1_target||0),0);
  const tQ1A=sV.reduce((s,r)=>s+(r.q1_actual||0),0), tYTD=sV.reduce((s,r)=>s+(r.ytd_actual||0),0);
  const n=sR.length, met=sR.filter(r=>r.status==="✓ Target Met").length;
  const onT=sR.filter(r=>r.status==="On Track").length, atR=sR.filter(r=>r.status==="At Risk").length;
  const pend=sR.filter(r=>r.status==="Pending").length;
  const avg=n?Math.round(sR.reduce((s,r)=>s+(r.progress||0),0)/n):0;
  const clr=SECTOR_CLR[sec]||"#7a8c7e";
  return (
    <div style={S.page}>
      <PH title="Sector Scorecard" sub="Deep-dive performance by sector · Q1 & YTD 2026"/>
      <div style={S.filterRow}>
        {SECTORS.map(s=>(
          <button key={s} style={{...S.filterBtn,...(sec===s?{...S.filterBtnActive,borderColor:SECTOR_CLR[s]}:{})}} onClick={()=>setSec(s)}>
            {s==="Construction & Manufacturing"?"Construction":s==="Real Estate & Property Management"?"Real Estate":s==="Human Capital Development"?"Human Capital":s==="Maritime Logistics"?"Maritime":""}
          </button>
        ))}
      </div>
      <div style={{borderLeft:`4px solid ${clr}`,paddingLeft:16,marginBottom:24}}>
        <div style={{fontSize:18,fontWeight:700,color:C.text}}>{sec}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={S.panel}>
          <div style={S.panelTitle}>Revenue Performance</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            <MP label="Annual Target" val={fmt(tA)}/>
            <MP label="Q1 Target"     val={fmt(tQ1T)}/>
            <MP label="Q1 Actual"     val={fmt(tQ1A)} hi/>
            <MP label="YTD Actual"    val={fmt(tYTD)} hi/>
          </div>
          <PBar label={`Q1: ${fmt(tQ1A)} of ${fmt(tQ1T)}`}     p={pct(tQ1A,tQ1T)}  clr={clr} showPct/>
          <PBar label={`YTD: ${fmt(tYTD)} of ${fmt(tA)}`}      p={pct(tYTD,tA)}    clr={clr} showPct/>
          <div style={{marginTop:20}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>By Business Unit</div>
            {sV.map(r=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{...S.buTag,minWidth:54,textAlign:"center"}}>{r.company}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:3}}>
                    <span>Q1: {fmt(r.q1_actual||0)} / {fmt(r.q1_target||0)}</span><span>{pct(r.q1_actual||0,r.q1_target||0)}%</span>
                  </div>
                  <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct(r.q1_actual||0,r.q1_target||0)}%`,background:clr,borderRadius:3}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.panel}>
          <div style={S.panelTitle}>Rocks Summary</div>
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:12}}>
            <Donut met={met} onT={onT} atR={atR} pend={pend} n={n}/>
            <div>
              {[["#0e7a5a","Target Met",met],["#1a5fb4","On Track",onT],["#c0480a","At Risk",atR],["#64748b","Pending",pend]].map(([c,l,v])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:c}}/><span style={{fontSize:12,color:"#334155"}}>{l}</span><span style={{fontSize:12,fontWeight:700,color:"#0f1c2e",marginLeft:"auto"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <PBar label="Avg Rock Progress" p={avg} clr={clr} showPct/>
          <div style={{marginTop:20}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Rocks Detail</div>
            {sR.map(r=>{
              const cfg=STATUS_CFG[r.status]||STATUS_CFG["Pending"], p=r.progress||0;
              const pc=p>=100?"#0e7a5a":p>=70?"#1a5fb4":p>=40?"#c0480a":"#dc2626";
              return (
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:150}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#1d4ed8",marginRight:6}}>{r.bu}</span>
                    <span style={{fontSize:11,color:"#334155"}}>{r.initiative}</span>
                  </div>
                  <div style={{minWidth:180}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:C.muted}}>{r.target}</span><span style={{color:pc,fontWeight:700,fontSize:13}}>{p}%</span>
                    </div>
                    <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,background:pc,borderRadius:3}}/></div>
                  </div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:cfg.bg,color:cfg.text,marginLeft:8}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot}}/>{r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function RockModal({rock,saving,onSave,onClose}) {
  const [f,setF]=useState(rock?{...rock}:{bu:"",sector:SECTORS[0],initiative:"",owner:"",target:"",progress:0,status:"On Track",notes:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Overlay onClose={onClose}>
      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:6}}>{rock?"Edit Rock":"Add New Rock"}</div>
      <div style={{fontSize:11,color:C.accent,marginBottom:16,fontStyle:"italic"}}>Saved to Supabase — visible to all users instantly.</div>
      {[["Business Unit","bu","text"],["Initiative","initiative","text"],["Owner","owner","text"],["Target","target","text"]].map(([l,k])=>(
        <MF key={k} label={l}><input style={S.modalInput} value={f[k]} onChange={e=>s(k,e.target.value)}/></MF>
      ))}
      <MF label="Sector"><select style={S.modalInput} value={f.sector} onChange={e=>s("sector",e.target.value)}>{SECTORS.map(x=><option key={x}>{x}</option>)}</select></MF>
      <MF label={`Progress: ${f.progress}%`}><input type="range" min={0} max={100} step={0.5} value={f.progress} onChange={e=>s("progress",Number(e.target.value))} style={{width:"100%",accentColor:C.accent}}/></MF>
      <MF label="Status"><select style={S.modalInput} value={f.status} onChange={e=>s("status",e.target.value)}>{["✓ Target Met","On Track","At Risk","Pending"].map(x=><option key={x}>{x}</option>)}</select></MF>
      <MF label="Notes"><textarea style={{...S.modalInput,height:60,resize:"vertical"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></MF>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <button style={S.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
        <button style={S.btnPrimary} onClick={()=>onSave(f)} disabled={saving}>{saving?"Saving…":"Save to Supabase"}</button>
      </div>
    </Overlay>
  );
}

function RevModal({data,onSave,onClose,isAdmin}) {
  const [f,setF]=useState({...data}), [saving,setSaving]=useState(false);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const activeQ = data._activeQ || "Q1";
  const qSections = [
    {q:"Q1", label:"Q1 (Jan–Mar)", t:"q1_target", a:"q1_actual"},
    {q:"Q2", label:"Q2 (Apr–Jun)", t:"q2_target", a:"q2_actual"},
    {q:"Q3", label:"Q3 (Jul–Sep)", t:"q3_target", a:"q3_actual"},
    {q:"Q4", label:"Q4 (Oct–Dec)", t:"q4_target", a:"q4_actual"},
  ];
  return (
    <Overlay onClose={onClose}>
      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:6}}>Update Revenue — {data.company}</div>
      <div style={{fontSize:11,color:C.accent,marginBottom:16,fontStyle:"italic"}}>Changes sync to all connected users in real time.</div>
      {isAdmin && <>
        <MF label="Company Code"><input style={S.modalInput} value={f.company} onChange={e=>s("company",e.target.value)}/></MF>
        <MF label="Full Company Name"><input style={S.modalInput} value={f.full_name} onChange={e=>s("full_name",e.target.value)}/></MF>
        <MF label="Sector">
          <select style={S.modalInput} value={f.sector} onChange={e=>s("sector",e.target.value)}>
            {SECTORS.map(x=><option key={x}>{x}</option>)}
          </select>
        </MF>
        <div style={{height:1,background:C.border,margin:"4px 0 12px"}}/>
      </>}
      <MF label="Annual Target (₱)"><input style={S.modalInput} type="number" value={f.annual_target||0} onChange={e=>s("annual_target",Number(e.target.value))}/></MF>
      <div style={{height:1,background:C.border,margin:"4px 0 12px"}}/>
      {qSections.map(({q,label,t,a})=>(
        <div key={q} style={{marginBottom:12,padding:12,borderRadius:6,border:`1px solid ${q===activeQ?"#1a3f7a":C.border}`,background:q===activeQ?"rgba(26,63,122,0.04)":"transparent"}}>
          <div style={{fontSize:11,fontWeight:700,color:q===activeQ?"#1a3f7a":C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
            {label}{q===activeQ&&<span style={{marginLeft:8,background:"#1a3f7a",color:"#fff",fontSize:9,padding:"1px 6px",borderRadius:3}}>Active</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <MF label="Target (₱)"><input style={S.modalInput} type="number" value={f[t]||0} onChange={e=>s(t,Number(e.target.value))}/></MF>
            <MF label="Actual (₱)"><input style={S.modalInput} type="number" value={f[a]||0} onChange={e=>s(a,Number(e.target.value))}/></MF>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <button style={S.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
        <button style={S.btnPrimary} onClick={async()=>{setSaving(true);await onSave(f);}} disabled={saving}>{saving?"Saving…":"Save to Supabase"}</button>
      </div>
    </Overlay>
  );
}

function Overlay({children,onClose}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(15,28,46,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={onClose}><div style={{background:"#ffffff",border:`1px solid ${C.border}`,borderRadius:10,padding:28,width:440,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(15,28,46,0.2)"}} onClick={e=>e.stopPropagation()}>{children}</div></div>;
}
function MF({label,children}) {
  return <div style={{marginBottom:12}}><div style={{fontSize:11,color:"#334155",textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontWeight:600}}>{label}</div>{children}</div>;
}

// ─── AUDIT LOG PAGE ───────────────────────────────────────────────────────────
function AuditPage({isAdmin}) {
  const [logs,setLogs]         = useState([]);
  const [loading,setLoading]   = useState(true);
  const [filterTable,setFilterTable] = useState("All");
  const [filterAction,setFilterAction] = useState("All");
  const [filterUser,setFilterUser] = useState("All");

  useEffect(()=>{
    const fetch = async()=>{
      setLoading(true);
      try {
        const data = await sbFetch("audit_log",{ query:"?order=changed_at.desc&limit=200" });
        setLogs(data||[]);
      } catch(e){ console.warn(e); }
      setLoading(false);
    };
    fetch();
  },[]);

  const allUsers   = ["All",...Array.from(new Set(logs.map(l=>l.changed_by)))];
  const allTables  = ["All","revenue","rocks"];
  const allActions = ["All","CREATE","UPDATE","DELETE"];

  const filtered = logs.filter(l=>{
    if(filterTable!=="All"  && l.table_name!==filterTable)   return false;
    if(filterAction!=="All" && l.action!==filterAction)      return false;
    if(filterUser!=="All"   && l.changed_by!==filterUser)    return false;
    return true;
  });

  const actionColor = a => a==="CREATE"?"#0e7a5a":a==="DELETE"?"#c0480a":"#1a3f7a";
  const actionBg    = a => a==="CREATE"?"#e8f5f0":a==="DELETE"?"#fdf0e8":"#e8edf5";

  const formatField = f => f.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const formatVal   = v => {
    if(v===""||v===null||v===undefined) return "—";
    const n = Number(v);
    if(!isNaN(n)&&v!==""&&n>1000) return `₱${n.toLocaleString()}`;
    return v;
  };

  return (
    <div style={S.page}>
      <PH title="Audit Log" sub="Complete record of all data changes · Admin only"/>

      {/* Stats strip */}
      <div style={S.strip}>
        <KPI label="Total Changes" val={logs.length}                                          sub="all time"       clr="#1a3f7a"/>
        <KPI label="Created"       val={logs.filter(l=>l.action==="CREATE").length}           sub="new records"    clr="#0e7a5a"/>
        <KPI label="Updated"       val={logs.filter(l=>l.action==="UPDATE").length}           sub="field edits"    clr="#0e7490"/>
        <KPI label="Deleted"       val={logs.filter(l=>l.action==="DELETE").length}           sub="removed"        clr="#c0480a"/>
      </div>

      {/* Filters */}
      <div style={{...S.filterRow,gap:8,marginBottom:20}}>
        <select style={S.select} value={filterTable}  onChange={e=>setFilterTable(e.target.value)}>
          {allTables.map(t=><option key={t}>{t==="All"?"All Tables":t}</option>)}
        </select>
        <select style={S.select} value={filterAction} onChange={e=>setFilterAction(e.target.value)}>
          {allActions.map(a=><option key={a}>{a==="All"?"All Actions":a}</option>)}
        </select>
        <select style={S.select} value={filterUser}   onChange={e=>setFilterUser(e.target.value)}>
          {allUsers.map(u=><option key={u}>{u==="All"?"All Users":u}</option>)}
        </select>
        <span style={{fontSize:11,color:C.muted,marginLeft:"auto",alignSelf:"center"}}>{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Change History</div>
        {loading ? (
          <div style={{padding:40,textAlign:"center",color:C.muted,fontSize:13}}>Loading audit log…</div>
        ) : filtered.length===0 ? (
          <div style={{padding:40,textAlign:"center",color:C.muted,fontSize:13}}>No entries found.</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:C.surface}}>
              <th style={S.th}>Date & Time</th>
              <th style={S.th}>Action</th>
              <th style={S.th}>Table</th>
              <th style={S.th}>Record</th>
              <th style={S.th}>Field</th>
              <th style={{...S.th,textAlign:"left"}}>Old Value</th>
              <th style={{...S.th,textAlign:"left"}}>New Value</th>
              <th style={S.th}>Changed By</th>
            </tr></thead>
            <tbody>
              {filtered.map((l,i)=>(
                <tr key={l.id} style={{background:i%2?C.surface:"transparent"}}>
                  <td style={{...S.td,whiteSpace:"nowrap",fontSize:11}}>
                    {new Date(l.changed_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}<br/>
                    <span style={{color:C.muted,fontSize:10}}>{new Date(l.changed_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                  </td>
                  <td style={S.td}>
                    <span style={{background:actionBg(l.action),color:actionColor(l.action),padding:"3px 8px",borderRadius:12,fontSize:11,fontWeight:700}}>
                      {l.action}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{...S.buTag,fontSize:10}}>{l.table_name}</span>
                  </td>
                  <td style={{...S.td,fontSize:11,color:C.muted}}>{l.record_id}</td>
                  <td style={{...S.td,fontSize:11,color:"#334155",fontWeight:500}}>{formatField(l.field_changed||"")}</td>
                  <td style={{...S.td,textAlign:"left",fontSize:11,color:"#c0480a",maxWidth:160}}>
                    <span style={{display:"inline-block",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatVal(l.old_value)}</span>
                  </td>
                  <td style={{...S.td,textAlign:"left",fontSize:11,color:"#0e7a5a",maxWidth:160}}>
                    <span style={{display:"inline-block",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatVal(l.new_value)}</span>
                  </td>
                  <td style={S.td}>
                    <div style={{fontSize:11,fontWeight:600,color:C.text}}>{l.changed_by?.split("@")[0]}</div>
                    <div style={{fontSize:10,color:C.muted}}>{l.changed_by_role}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
function PH({title,sub}) {
  return <div style={{marginBottom:28}}><h1 style={{fontSize:26,fontWeight:700,color:C.text,margin:0,letterSpacing:-0.5}}>{title}</h1><p style={{fontSize:12,color:C.muted,margin:"4px 0 0",letterSpacing:1}}>{sub}</p></div>;
}
function KPI({label,val,sub,clr}) {
  return (
    <div style={{flex:"1 1 150px",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 18px",borderTop:`3px solid ${clr}`,minWidth:130,boxShadow:"0 2px 8px rgba(15,28,46,0.08)"}}>
      <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:600}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:clr,lineHeight:1}}>{val}</div>
      <div style={{fontSize:11,color:"#334155",marginTop:4}}>{sub}</div>
    </div>
  );
}
function PBar({label,p,clr,showPct}) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:C.muted}}>{label}</span>
        {showPct&&<span style={{fontSize:11,fontWeight:700,color:clr}}>{p}%</span>}
      </div>
      <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:3,width:`${Math.min(p,100)}%`,background:clr,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}
function MBar({pct:p,clr}) {
  return <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:4,borderRadius:2,width:`${Math.min(p,100)}%`,background:clr,flex:1,maxWidth:80}}/><span style={{fontSize:11,fontWeight:700,minWidth:36,textAlign:"right",color:clr}}>{p}%</span></div>;
}
function MP({label,val,hi}) {
  return <div style={{display:"flex",flexDirection:"column",gap:2}}><span style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>{label}</span><span style={{fontSize:15,fontWeight:700,color:hi?"#0f1c2e":"#334155"}}>{val}</span></div>;
}
function Donut({met,onT,atR,pend,n}) {
  if(!n) return null;
  const segs=[{v:met,c:"#0e7a5a"},{v:onT,c:"#1a5fb4"},{v:atR,c:"#c0480a"},{v:pend,c:"#94a3b8"}];
  const r=40,circ=2*Math.PI*r; let off=0;
  return (
    <svg width="110" height="110" viewBox="0 0 100 100">
      {segs.map((sg,i)=>{const dash=(sg.v/n)*circ;const el=<circle key={i} cx={50} cy={50} r={r} fill="none" stroke={sg.c} strokeWidth="14" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off+circ*0.25} style={{transform:"rotate(-90deg)",transformOrigin:"50px 50px"}}/>;off+=dash;return el;})}
      <text x="50" y="46" textAnchor="middle" fill="#0f1c2e" fontSize="14" fontWeight="700">{Math.round(((met+onT)/n)*100)}%</text>
      <text x="50" y="58" textAnchor="middle" fill="#475569" fontSize="8">on/met</text>
    </svg>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  shell:    { display:"flex",height:"100vh",background:C.bg,fontFamily:"'DM Mono','Courier New',monospace",color:C.text,overflow:"hidden" },
  main:     { flex:1,overflow:"auto",padding:"32px 40px" },
  loginWrap:{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"linear-gradient(135deg,#0a1628 0%,#1a3f7a 100%)",fontFamily:"'DM Mono','Courier New',monospace" },
  loginCard:{ background:"#ffffff",border:`1px solid #b8c5d9`,borderRadius:12,padding:"48px 40px",width:360,display:"flex",flexDirection:"column",gap:14,boxShadow:"0 20px 60px rgba(10,22,40,0.4)" },
  loginLogo:{ fontSize:36,fontWeight:900,color:"#0a1628",letterSpacing:6 },
  loginSub: { fontSize:12,color:"#2d4a6e",letterSpacing:2,textTransform:"uppercase" },
  sidebar:  { width:230,background:"#0a1628",borderRight:`1px solid #1a2e4a`,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"28px 0" },
  navBtn:   { display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 24px",border:"none",background:"none",color:"#7a9cc0",fontSize:12,cursor:"pointer",textAlign:"left",letterSpacing:0.5 },
  navBtnActive:{ background:"rgba(26,63,122,0.3)",color:"#e2eaf5",borderLeft:`2px solid #4a8fd4` },
  page:     { maxWidth:1200 },
  strip:    { display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" },
  filterRow:{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" },
  filterBtn:{ background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:11,padding:"6px 14px",cursor:"pointer",borderRadius:4,letterSpacing:0.5 },
  filterBtnActive:{ background:"rgba(26,63,122,0.1)",color:"#1a3f7a",borderColor:"#1a3f7a" },
  select:   { background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"7px 12px",fontSize:12,borderRadius:4,cursor:"pointer" },
  sectorGrid:{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:24 },
  sectorCard:{ background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:18,boxShadow:"0 2px 8px rgba(15,28,46,0.08)" },
  card:     { background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 0",marginBottom:24,boxShadow:"0 2px 8px rgba(15,28,46,0.08)" },
  cardTitle:{ fontSize:13,fontWeight:700,color:C.text,letterSpacing:1,textTransform:"uppercase",padding:"0 20px 16px",borderBottom:`1px solid ${C.border}` },
  th:       { padding:"10px 14px",color:"#475569",fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:1,textAlign:"center" },
  td:       { padding:"12px 14px",textAlign:"center",color:C.muted,borderBottom:`1px solid rgba(15,28,46,0.06)` },
  buTag:    { background:"rgba(26,63,122,0.12)",color:"#1a3f7a",padding:"3px 8px",borderRadius:4,fontSize:11,fontWeight:700,whiteSpace:"nowrap" },
  buGroup:  { background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(15,28,46,0.08)" },
  buGroupHdr:{ display:"flex",alignItems:"center",gap:12,padding:"12px 18px",background:"#f1f5f9",borderBottom:`1px solid ${C.border}` },
  panel:    { background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:20,boxShadow:"0 2px 8px rgba(15,28,46,0.08)" },
  panelTitle:{ fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:2,marginBottom:16,borderBottom:`1px solid ${C.border}`,paddingBottom:10 },
  btnPrimary:{ background:"#1a3f7a",color:"#fff",border:"none",padding:"9px 18px",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:0.5 },
  btnGhost: { background:"none",color:"#7a9cc0",border:`1px solid #1a2e4a`,padding:"9px 18px",borderRadius:5,cursor:"pointer",fontSize:12,letterSpacing:0.5 },
  editBtn:  { background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:11,padding:"4px 10px",cursor:"pointer",borderRadius:4 },
  input:    { background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"10px 14px",borderRadius:5,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit" },
  modalInput:{ background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 12px",borderRadius:5,fontSize:13,width:"100%",boxSizing:"border-box",fontFamily:"inherit" },
};
