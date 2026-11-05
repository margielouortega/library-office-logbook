import { useEffect, useMemo, useState } from "react";
import { BookOpen, Users, ClipboardList, Clock3, Search, Plus, Download, LogOut, Pencil, Trash2, LayoutDashboard, FileText, RefreshCw, X, CalendarDays, Building2, CheckCircle2, Menu } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const OFFICES = [
  "Library Office",
  "ACT Dean's Office",
  "ACT Faculty Office",
  "School of Information Technology",
  "School of Business and Management",
  "School of Education",
  "School of Arts and Sciences",
  "Registrar's Office",
  "Guidance Office",
  "Accounting Office",
  "Other"
];
const today = () => new Date().toLocaleDateString("en-CA");
const nowTime = () => new Date().toTimeString().slice(0, 5);
const emptyForm = () => ({ visitorName: "", purpose: "", office: "Library Office", visitDate: today(), timeIn: nowTime(), timeOut: "", remarks: "" });

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed. Check that the backend server is running.");
  return data;
}
function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}
function downloadCSV(rows) {
  const headers = ["Visitor", "Purpose", "Office", "Date", "Time In", "Time Out", "Status", "Remarks"];
  const values = rows.map(v => [v.visitorName, v.purpose, v.office, v.visitDate, v.timeIn, v.timeOut || "", v.timeOut ? "Completed" : "Inside", v.remarks || ""]);
  const csv = [headers, ...values].map(row => row.map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `visitor-log-${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [visitors, setVisitors] = useState([]);
  const [allVisitors, setAllVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState(today());
  const [filterMonth, setFilterMonth] = useState(today().slice(0, 7));
  const [filterOffice, setFilterOffice] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [mobileNav, setMobileNav] = useState(false);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [list, all] = await Promise.all([api("/visitors"), api("/visitors")]);
      setVisitors(list); setAllVisitors(all);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let list = [...visitors];
    if (page === "reports" || page === "history") {
      if (filterType === "day") list = list.filter(v => v.visitDate === filterDate);
      if (filterType === "month") list = list.filter(v => v.visitDate.startsWith(filterMonth));
      if (filterOffice) list = list.filter(v => v.office === filterOffice);
    }
    if (statusFilter === "inside") list = list.filter(v => !v.timeOut);
    if (statusFilter === "completed") list = list.filter(v => Boolean(v.timeOut));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => [v.visitorName, v.purpose, v.office].some(x => (x || "").toLowerCase().includes(q)));
    }
    return list;
  }, [visitors, page, filterType, filterDate, filterMonth, filterOffice, statusFilter, search]);

  const todayRecords = allVisitors.filter(v => v.visitDate === today());
  const insideCount = allVisitors.filter(v => !v.timeOut).length;
  const monthCount = allVisitors.filter(v => v.visitDate.startsWith(today().slice(0, 7))).length;

  function openAdd() { setEditing(null); setForm(emptyForm()); setModalOpen(true); }
  function openEdit(v) { setEditing(v); setForm({ ...v }); setModalOpen(true); }
  function change(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  async function saveVisitor(e) {
    e.preventDefault(); setNotice(""); setError("");
    try {
      const payload = { ...form };
      if (editing) await api(`/visitors/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      else await api("/visitors", { method: "POST", body: JSON.stringify(payload) });
      setModalOpen(false); setNotice(editing ? "Visitor record updated." : "Visitor successfully registered.");
      await loadData();
    } catch (e) { setError(e.message); }
  }
  async function timeOut(id) {
    try { await api(`/visitors/${id}/time-out`, { method: "PATCH", body: JSON.stringify({ timeOut: nowTime() }) }); setNotice("Time-out recorded."); await loadData(); }
    catch (e) { setError(e.message); }
  }
  async function removeVisitor(v) {
    if (!window.confirm(`Delete the log for ${v.visitorName}? This cannot be undone.`)) return;
    try { await api(`/visitors/${v.id}`, { method: "DELETE" }); setNotice("Visitor record deleted."); await loadData(); }
    catch (e) { setError(e.message); }
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "visitors", label: "Visitor Registration", icon: Users },
    { id: "history", label: "Visitor History", icon: ClipboardList },
    { id: "reports", label: "Reports", icon: FileText }
  ];
  const title = navItems.find(n => n.id === page)?.label || "Dashboard";

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
      <div className="brand"><img className="brand-logo" src="/st-josephs-college-logo.jpg" alt="St. Joseph’s College of Baggao official seal"/><div className="brand-copy"><strong>ST. JOSEPH’S</strong><span>LIBRARY OFFICE LOG BOOK</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button></div>
      <div className="nav-caption">MAIN MENU</div>
      <nav>{navItems.map(item => <button key={item.id} className={`nav-link ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); setMobileNav(false); setSearch(""); }}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="side-note"><div className="side-note-icon"><Building2 size={17}/></div><div><b>Visitor Management</b><small>Campus office log system</small></div></div><small className="version">React JS · Node.js · JSON storage</small></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="top-left"><button className="menu-toggle" onClick={() => setMobileNav(true)}><Menu/></button><div><div className="breadcrumb">LIBRARY OFFICE <span>/</span> {title.toUpperCase()}</div><h1>{title}</h1></div></div><div className="top-right"><div className="date-chip"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div><div className="avatar">LO</div></div></header>

      <section className="content">
        {error && <div className="alert error"><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}
        {notice && <div className="alert success"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}

        {page === "dashboard" && <>
          <div className="welcome-row"><div><p className="eyebrow">WELCOME TO THE LOG BOOK</p><h2>Visitor activity overview</h2><p className="muted">Monitor visitors, office visits, and daily log activity.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={17}/> Register Visitor</button></div>
          <div className="stats-grid">
            <Stat icon={Users} label="Today's Visitors" value={todayRecords.length} hint="Total visits today"/>
            <Stat icon={Clock3} label="Currently Inside" value={insideCount} hint="Awaiting time-out"/>
            <Stat icon={ClipboardList} label="This Month" value={monthCount} hint="Recorded visits"/>
            <Stat icon={Building2} label="Offices" value={OFFICES.length} hint="Available destinations"/>
          </div>
          <div className="panel"><div className="panel-head"><div><h3>Recent visitor activity</h3><p>Latest visitor entries across all offices</p></div><button className="text-btn" onClick={() => setPage("history")}>View all <span>→</span></button></div>
            <VisitorTable rows={allVisitors.slice(0, 6)} onEdit={openEdit} onTimeOut={timeOut} onDelete={removeVisitor} loading={loading}/>
          </div>
          <div className="bottom-grid"><div className="panel"><div className="panel-head"><div><h3>Office destinations</h3><p>Available offices for visitor registration</p></div></div><div className="office-list">{OFFICES.slice(0, 6).map((o, i) => <div className="office-item" key={o}><span className="office-number">{String(i + 1).padStart(2, "0")}</span><span>{o}</span><Building2 size={16}/></div>)}</div></div>
            <div className="report-callout"><div className="callout-icon"><FileText size={22}/></div><h3>Need a visitor report?</h3><p>Filter visitor logs by day or month, review office activity, and export records to CSV.</p><button className="light-btn" onClick={() => setPage("reports")}>Open Reports <span>→</span></button></div></div>
        </>}

        {page === "visitors" && <>
          <div className="welcome-row"><div><p className="eyebrow">VISITOR RECORDS</p><h2>Register and manage visitors</h2><p className="muted">Record the visitor's details, purpose, office, and time-in.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={17}/> Register Visitor</button></div>
          <div className="panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitor, purpose, or office..."/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="inside">Currently inside</option><option value="completed">Completed</option></select><button className="icon-btn" title="Refresh" onClick={loadData}><RefreshCw size={17}/></button></div><VisitorTable rows={filtered} onEdit={openEdit} onTimeOut={timeOut} onDelete={removeVisitor} loading={loading}/></div>
        </>}

        {page === "history" && <>
          <div className="welcome-row"><div><p className="eyebrow">VISIT LOG ARCHIVE</p><h2>Visitor history</h2><p className="muted">Review previous and current visitor records.</p></div><button className="outline-btn" onClick={() => downloadCSV(filtered)}><Download size={17}/> Export CSV</button></div>
          <FilterBar {...{filterType,setFilterType,filterDate,setFilterDate,filterMonth,setFilterMonth,filterOffice,setFilterOffice}}/>
          <div className="panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitor, purpose, or office..."/></div><span className="result-count">{filtered.length} record(s)</span></div><VisitorTable rows={filtered} onEdit={openEdit} onTimeOut={timeOut} onDelete={removeVisitor} loading={loading}/></div>
        </>}

        {page === "reports" && <>
          <div className="welcome-row"><div><p className="eyebrow">ANALYTICS & EXPORTS</p><h2>Visitor reports</h2><p className="muted">Generate daily or monthly visitor reports by office.</p></div><button className="primary-btn" onClick={() => downloadCSV(filtered)}><Download size={17}/> Download CSV</button></div>
          <FilterBar {...{filterType,setFilterType,filterDate,setFilterDate,filterMonth,setFilterMonth,filterOffice,setFilterOffice}}/>
          <div className="stats-grid report-stats"><Stat icon={Users} label="Filtered Visits" value={filtered.length} hint="Matching records"/><Stat icon={Clock3} label="Currently Inside" value={filtered.filter(v => !v.timeOut).length} hint="No time-out yet"/><Stat icon={CheckCircle2} label="Completed" value={filtered.filter(v => v.timeOut).length} hint="Time-out recorded"/></div>
          <div className="panel"><div className="panel-head"><div><h3>Report details</h3><p>{filterType === "day" ? `Date: ${formatDate(filterDate)}` : filterType === "month" ? `Month: ${filterMonth}` : "All dates"}{filterOffice ? ` · ${filterOffice}` : ""}</p></div><span className="report-total">{filtered.length} VISITS</span></div><VisitorTable rows={filtered} onEdit={openEdit} onTimeOut={timeOut} onDelete={removeVisitor} loading={loading}/></div>
        </>}
        <footer>St. Joseph’s College of Baggao, Inc. <span>•</span> Library Office Log Book Management System</footer>
      </section>
    </main>

    {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}><div className="modal"><div className="modal-head"><div><p className="eyebrow">{editing ? "UPDATE RECORD" : "NEW ENTRY"}</p><h2>{editing ? "Edit visitor details" : "Visitor registration"}</h2></div><button className="icon-btn" onClick={() => setModalOpen(false)}><X/></button></div><form onSubmit={saveVisitor}>
      <div className="form-grid"><label className="full">Visitor full name *<input required value={form.visitorName} onChange={e => change("visitorName", e.target.value)} placeholder="Enter visitor's complete name"/></label>
      <label className="full">Purpose of visit *<textarea required rows="3" value={form.purpose} onChange={e => change("purpose", e.target.value)} placeholder="State the reason for the visit"/></label>
      <label className="full">Office / School to visit *<select required value={form.office} onChange={e => change("office", e.target.value)}>{OFFICES.map(o => <option key={o}>{o}</option>)}</select></label>
      <label>Date *<input type="date" required value={form.visitDate} onChange={e => change("visitDate", e.target.value)}/></label>
      <label>Time-in *<input type="time" required value={form.timeIn} onChange={e => change("timeIn", e.target.value)}/></label>
      <label>Time-out<input type="time" value={form.timeOut} onChange={e => change("timeOut", e.target.value)}/></label>
      <label className="full">Remarks (optional)<textarea rows="2" value={form.remarks} onChange={e => change("remarks", e.target.value)} placeholder="Additional notes"/></label></div>
      <div className="modal-actions"><button type="button" className="outline-btn" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-btn">{editing ? "Save Changes" : "Save Visitor"}</button></div>
    </form></div></div>}
  </div>;
}

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}
function FilterBar({ filterType, setFilterType, filterDate, setFilterDate, filterMonth, setFilterMonth, filterOffice, setFilterOffice }) {
  return <div className="filter-panel"><div className="filter-title"><span><ClipboardList size={17}/> Filter records</span><span className="filter-note">Choose a period and destination</span></div><div className="filter-controls"><select value={filterType} onChange={e => setFilterType(e.target.value)}><option value="all">All dates</option><option value="day">Per day</option><option value="month">Per month</option></select>{filterType === "day" && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}/ >}{filterType === "month" && <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}/>}<select value={filterOffice} onChange={e => setFilterOffice(e.target.value)}><option value="">All offices / schools</option>{OFFICES.map(o => <option key={o}>{o}</option>)}</select></div></div>;
}
function VisitorTable({ rows, onEdit, onTimeOut, onDelete, loading }) {
  if (loading) return <div className="empty-state"><div className="spinner"/><p>Loading visitor records...</p></div>;
  if (!rows.length) return <div className="empty-state"><div className="empty-icon"><ClipboardList size={25}/></div><b>No visitor records found</b><p>New registrations will appear here.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>VISITOR</th><th>PURPOSE / OFFICE</th><th>DATE</th><th>TIME IN</th><th>TIME OUT</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{rows.map(v => <tr key={v.id}><td><div className="visitor-name">{v.visitorName}</div><div className="visitor-remarks">{v.remarks || "Visitor"}</div></td><td><div className="purpose">{v.purpose}</div><div className="office-tag">{v.office}</div></td><td className="nowrap">{formatDate(v.visitDate)}</td><td className="time-cell">{v.timeIn || "—"}</td><td className="time-cell">{v.timeOut || "—"}</td><td><span className={`status ${v.timeOut ? "completed" : "inside"}`}>{v.timeOut ? "Completed" : "Inside"}</span></td><td><div className="actions">{!v.timeOut && <button className="action-btn checkout" title="Record time-out" onClick={() => onTimeOut(v.id)}><LogOut size={15}/></button>}<button className="action-btn" title="Edit" onClick={() => onEdit(v)}><Pencil size={15}/></button><button className="action-btn delete" title="Delete" onClick={() => onDelete(v)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}