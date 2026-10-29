import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const STATUSES = ["New", "Contacted", "Qualified", "Won"] as const;
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: Target },
  { id: "activities", label: "Activities", icon: CalendarClock },
  { id: "reports", label: "Reports", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type LeadStatus = (typeof STATUSES)[number];
type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  value: number;
  status: LeadStatus;
};
type LeadInput = Omit<Lead, "id">;
type PageId = (typeof NAV_ITEMS)[number]["id"];
type Notice = { message: string; tone: "success" | "error" | "info" };
type ActivityItem = {
  id: string;
  leadId: string;
  date: string;
  note: string;
  completed: boolean;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
    } catch {
      message = `Request failed (${response.status})`;
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

async function requestWithoutBody(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, init);
  if (response.ok) return;
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") message = body.error;
  } catch {
    message = `Request failed (${response.status})`;
  }
  throw new Error(message);
}

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadResults, setLeadResults] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterRevision, setFilterRevision] = useState(0);
  const [page, setPage] = useState<PageId>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [busyLeadId, setBusyLeadId] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityLeadId, setActivityLeadId] = useState("");
  const [activityDate, setActivityDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [activityNote, setActivityNote] = useState("");
  const [compactRows, setCompactRows] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function refreshLeads() {
    try {
      const result = await requestJson<{ data: Lead[]; total: number }>("/leads");
      setLeads(result.data);
      if (!query.trim() && statusFilter === "All") setLeadResults(result.data);
      if (page === "leads") setFilterLoading(true);
      setFilterRevision((current) => current + 1);
      setNotice((current) => current?.tone === "error" ? null : current);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load leads.";
      setNotice({ message: `Could not load leads: ${message}`, tone: "error" });
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitialLeads() {
      try {
        const result = await requestJson<{ data: Lead[]; total: number }>("/leads");
        if (active) {
          setLeads(result.data);
          setLeadResults(result.data);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load leads.";
        if (active) setNotice({ message: `Could not load leads: ${message}`, tone: "error" });
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialLeads();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (page !== "leads") return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setFilterLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (statusFilter !== "All") params.set("status", statusFilter);
      const queryString = params.toString();
      const suffix = queryString ? `?${queryString}` : "";
      try {
        const result = await requestJson<{ data: Lead[]; total: number }>(`/leads${suffix}`);
        if (active) setLeadResults(result.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not search leads.";
        if (active) setNotice({ message: `Could not search leads: ${message}`, tone: "error" });
      } finally {
        if (active) setFilterLoading(false);
      }
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, query, statusFilter, filterRevision]);

  const pipelineValue = leads
    .filter((lead) => lead.status !== "Won")
    .reduce((total, lead) => total + lead.value, 0);
  const wonValue = leads
    .filter((lead) => lead.status === "Won")
    .reduce((total, lead) => total + lead.value, 0);
  const qualified = leads.filter((lead) => lead.status === "Qualified").length;
  const won = leads.filter((lead) => lead.status === "Won").length;
  const currentPageLabel = NAV_ITEMS.find((item) => item.id === page)?.label ?? "Dashboard";

  async function createLead(input: LeadInput) {
    try {
      await requestJson<{ data: Lead }>("/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      setShowForm(false);
      const refreshed = await refreshLeads();
      setNotice({
        message: refreshed
          ? "Lead created successfully."
          : "Lead was created, but the latest list could not be refreshed.",
        tone: refreshed ? "success" : "error",
      });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Could not create lead.",
        tone: "error",
      });
    }
  }

  async function changeStatus(id: string, status: LeadStatus) {
    setBusyLeadId(id);
    try {
      await requestJson<{ data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const refreshed = await refreshLeads();
      setNotice({
        message: refreshed
          ? `Lead status updated to ${status}.`
          : "Lead status was updated, but the latest list could not be refreshed.",
        tone: refreshed ? "success" : "error",
      });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Could not update lead status.",
        tone: "error",
      });
    } finally {
      setBusyLeadId("");
    }
  }

  async function deleteLead(lead: Lead) {
    if (!window.confirm(`Delete the lead for ${lead.name}?`)) return;
    setBusyLeadId(lead.id);
    try {
      await requestWithoutBody(`/leads/${encodeURIComponent(lead.id)}`, { method: "DELETE" });
      const refreshed = await refreshLeads();
      setNotice({
        message: refreshed
          ? "Lead deleted successfully."
          : "Lead was deleted, but the latest list could not be refreshed.",
        tone: refreshed ? "success" : "error",
      });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Could not delete lead.",
        tone: "error",
      });
    } finally {
      setBusyLeadId("");
    }
  }

  function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityLeadId || !activityNote.trim()) return;
    setActivities((current) => [
      {
        id: `${Date.now()}`,
        leadId: activityLeadId,
        date: activityDate,
        note: activityNote.trim(),
        completed: false,
      },
      ...current,
    ]);
    setActivityNote("");
    setNotice({
      message: "Follow-up added for this browser session. Activities are not saved by the backend.",
      tone: "info",
    });
  }

  const pageContent = (() => {
    if (page === "dashboard") {
      return (
        <>
          <div className="welcome-row">
            <div>
              <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
              <h1 className="welcome-heading">{getGreeting(clock)} <span aria-hidden="true">✳</span></h1>
              <p>Here’s what’s happening with your sales pipeline today.</p>
            </div>
            <button className="primary-button" onClick={() => { setPage("leads"); setShowForm(true); }}>
              <Plus size={18} /> Add new lead
            </button>
          </div>
          <div className="section-heading">
            <div><h2>Overview</h2><p>Monitor your sales performance in real time.</p></div>
          </div>
          <Metrics leads={leads} pipelineValue={pipelineValue} qualified={qualified} won={won} />
          <section className="leads-panel">
            <div className="panel-heading">
              <div><h2>Recent leads</h2><p>Manage your prospects and keep opportunities moving.</p></div>
              <button className="secondary-button" onClick={() => { setPage("leads"); setShowForm(true); }}>
                <Plus size={16} /> New lead
              </button>
            </div>
            <LeadTable
              leads={leads.slice(0, 5)}
              busyLeadId={busyLeadId}
              onChangeStatus={changeStatus}
              onDelete={deleteLead}
              loading={loading}
            />
            <div className="table-footer">
              <span>Showing {Math.min(leads.length, 5)} of {leads.length} leads</span>
              <button className="text-button" onClick={() => setPage("leads")}>View all leads</button>
            </div>
          </section>
        </>
      );
    }

    if (page === "leads") {
      return (
        <>
          <ViewHeader
            eyebrow="YOUR CONTACTS AND OPPORTUNITIES"
            title="Leads"
            description="Create, find, and update your sales prospects."
            action={<button className="primary-button" onClick={() => setShowForm((open) => !open)}><Plus size={18} /> New lead</button>}
          />
          {showForm && <LeadForm onSubmit={createLead} onCancel={() => setShowForm(false)} />}
          <section className="leads-panel">
            <div className="panel-heading">
              <div><h2>All leads</h2><p>{leadResults.length} matching {leadResults.length === 1 ? "lead" : "leads"}</p></div>
            </div>
            <div className="table-tools">
              <label className="search-box">
                <Search size={17} aria-hidden="true" />
                <input aria-label="Search leads" placeholder="Search name, company or email..." value={query} onChange={(event) => { setFilterLoading(true); setQuery(event.target.value); }} />
              </label>
              <label className="filter-label">Status
                <select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setFilterLoading(true); setStatusFilter(event.target.value); }}>
                  {["All", ...STATUSES].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              {(query || statusFilter !== "All") && (
                <button className="text-button" onClick={() => { setQuery(""); setStatusFilter("All"); }}>Clear filters</button>
              )}
            </div>
            <LeadTable
              leads={leadResults}
              busyLeadId={busyLeadId}
              onChangeStatus={changeStatus}
              onDelete={deleteLead}
              loading={loading || filterLoading}
              compact={compactRows}
            />
            <div className="table-footer"><span>Showing {leadResults.length} of {leads.length} leads</span><span>Changes are saved through the TatvaFlow API.</span></div>
          </section>
        </>
      );
    }

    if (page === "pipeline") {
      return (
        <>
          <ViewHeader eyebrow="OPPORTUNITY FLOW" title="Pipeline" description="Review your open and won opportunities by status." />
          <div className="pipeline-summary">
            <MetricCard title="Open pipeline" value={money(pipelineValue)} detail="Excludes won deals" icon={<Target size={19} />} tone="violet" />
            <MetricCard title="Won value" value={money(wonValue)} detail={`${won} ${won === 1 ? "deal" : "deals"} closed`} icon={<Check size={19} />} tone="green" />
          </div>
          <div className="pipeline-grid">
            {STATUSES.map((status) => {
              const statusLeads = leads.filter((lead) => lead.status === status);
              const total = statusLeads.reduce((sum, lead) => sum + lead.value, 0);
              return (
                <section className="pipeline-column" key={status}>
                  <div className="pipeline-column-heading">
                    <span className={`status-dot status-${status.toLowerCase()}`} />
                    <h2>{status}</h2><span className="pipeline-count">{statusLeads.length}</span>
                  </div>
                  <p className="pipeline-total">{money(total)}</p>
                  {statusLeads.length === 0
                    ? <p className="empty-card">No leads in this stage.</p>
                    : statusLeads.map((lead) => (
                      <article className="pipeline-card" key={lead.id}>
                        <strong>{lead.name}</strong><span>{lead.company}</span>
                        <b>{money(lead.value)}</b>
                        <label className="pipeline-status-label">Move to
                          <select aria-label={`Move ${lead.name} to status`} value={lead.status} disabled={busyLeadId === lead.id} onChange={(event) => void changeStatus(lead.id, event.target.value as LeadStatus)}>
                            {STATUSES.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}
                </section>
              );
            })}
          </div>
        </>
      );
    }

    if (page === "activities") {
      const orderedActivities = [...activities].sort((a, b) => a.date.localeCompare(b.date));
      return (
        <>
          <ViewHeader eyebrow="FOLLOW-UPS" title="Activities" description="Plan and track follow-ups during this browser session." />
          <div className="info-banner">Follow-up activities are held in page memory only. They are cleared when you reload and are not stored by the backend.</div>
          {leads.length === 0 ? (
            <EmptyPanel title="Add a lead first" message="Follow-up activities are linked to leads. Create a lead before adding an activity." />
          ) : (
            <form className="activity-form" onSubmit={addActivity}>
              <h2>Schedule a follow-up</h2>
              <div className="activity-form-grid">
                <label>Lead
                  <select value={activityLeadId} onChange={(event) => setActivityLeadId(event.target.value)} required>
                    <option value="">Choose a lead</option>
                    {leads.map((lead) => <option value={lead.id} key={lead.id}>{lead.name} — {lead.company}</option>)}
                  </select>
                </label>
                <label>Follow-up date<input type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} required /></label>
                <label className="activity-note-field">Note<input value={activityNote} onChange={(event) => setActivityNote(event.target.value)} placeholder="e.g. Send the revised proposal" maxLength={240} required /></label>
                <button className="primary-button" type="submit"><Plus size={16} /> Add follow-up</button>
              </div>
            </form>
          )}
          <section className="leads-panel activity-list">
            <div className="panel-heading"><div><h2>Follow-up list</h2><p>{activities.length} {activities.length === 1 ? "activity" : "activities"} in this session</p></div></div>
            {orderedActivities.length === 0
              ? <EmptyPanel title="No follow-ups yet" message="Add a follow-up above to keep track of your next steps." />
              : <ul className="activity-items">{orderedActivities.map((activity) => {
                const lead = leads.find((item) => item.id === activity.leadId);
                return (
                  <li className={activity.completed ? "activity-item completed" : "activity-item"} key={activity.id}>
                    <button className="activity-check" type="button" aria-label={activity.completed ? "Mark follow-up incomplete" : "Mark follow-up complete"} onClick={() => setActivities((current) => current.map((item) => item.id === activity.id ? { ...item, completed: !item.completed } : item))}><Check size={16} /></button>
                    <div className="activity-copy"><strong>{activity.note}</strong><span>{lead?.name ?? "Lead removed"}{lead ? ` · ${lead.company}` : ""}</span></div>
                    <time dateTime={activity.date}>{new Date(`${activity.date}T00:00:00`).toLocaleDateString()}</time>
                    <button className="icon-button activity-delete" type="button" aria-label="Delete follow-up" onClick={() => setActivities((current) => current.filter((item) => item.id !== activity.id))}><Trash2 size={16} /></button>
                  </li>
                );
              })}</ul>}
          </section>
        </>
      );
    }

    if (page === "reports") {
      const average = leads.length ? leads.reduce((sum, lead) => sum + lead.value, 0) / leads.length : 0;
      const wonRate = leads.length ? Math.round((won / leads.length) * 100) : 0;
      return (
        <>
          <ViewHeader eyebrow="SALES PERFORMANCE" title="Reports" description="Summaries are calculated from the leads currently returned by the API." />
          <div className="metrics-grid report-metrics">
            <MetricCard title="Total deal value" value={money(leads.reduce((sum, lead) => sum + lead.value, 0))} detail="All recorded lead values" icon={<Activity size={19} />} tone="blue" />
            <MetricCard title="Average deal value" value={money(average)} detail="Across all leads" icon={<ArrowUpRight size={19} />} tone="violet" />
            <MetricCard title="Won value" value={money(wonValue)} detail="Closed-won leads" icon={<ArrowDownRight size={19} />} tone="green" />
            <MetricCard title="Won lead share" value={`${wonRate}%`} detail={`${won} of ${leads.length} leads`} icon={<Target size={19} />} tone="orange" />
          </div>
          <section className="report-panel">
            <div className="panel-heading"><div><h2>Lead distribution</h2><p>Current lead count and total value by status.</p></div></div>
            {leads.length === 0
              ? <EmptyPanel title="No report data yet" message="Create leads to see your sales distribution." />
              : <div className="distribution-list">{STATUSES.map((status) => {
                const group = leads.filter((lead) => lead.status === status);
                const share = (group.length / leads.length) * 100;
                const amount = group.reduce((sum, lead) => sum + lead.value, 0);
                return <div className="distribution-row" key={status}>
                  <div className="distribution-label"><strong>{status}</strong><span>{group.length} · {money(amount)}</span></div>
                  <div className="distribution-track"><div className={`distribution-fill fill-${status.toLowerCase()}`} style={{ width: `${share}%` }} /></div>
                </div>;
              })}</div>}
          </section>
        </>
      );
    }

    return (
      <>
        <ViewHeader eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Adjust how lead information is displayed in this session." />
        <section className="settings-panel">
          <div className="settings-option">
            <div><h2>Compact lead rows</h2><p>Reduce table row spacing to fit more leads on screen. This preference lasts for this browser session.</p></div>
            <label className="toggle-control"><input type="checkbox" checked={compactRows} onChange={(event) => setCompactRows(event.target.checked)} /><span>Compact rows</span></label>
          </div>
          <div className="settings-option">
            <div><h2>Workspace data</h2><p>Lead records are stored in the running API process. No authentication or database-backed persistence is configured.</p></div>
            <button className="secondary-button" onClick={() => { setLoading(true); void refreshLeads(); }} disabled={loading}>Refresh leads</button>
          </div>
          <div className="settings-option">
            <div><h2>Follow-up activities</h2><p>Activities are available during this page session only and are not sent to the backend.</p></div>
            <button className="secondary-button" onClick={() => setPage("activities")}>Open activities</button>
          </div>
        </section>
      </>
    );
  })();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Command size={22} /></div>
          <span>tatva<span className="brand-light">flow</span></span>
          <span className="brand-badge">CRM</span>
        </div>
        <div className="workspace">
          <div className="workspace-icon"><Building2 size={18} /></div>
          <div><strong>Acme Workspace</strong><small>Portfolio workspace</small></div>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button className={`nav-item${page === id ? " active" : ""}`} type="button" key={id} onClick={() => { setPage(id); setNotice(null); }} aria-current={page === id ? "page" : undefined}>
              <Icon size={18} /> {label}
              {id === "leads" && <span className="nav-count">{leads.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><CircleHelp size={20} /><div><strong>Need a hand?</strong><small>Explore your CRM workspace</small></div></div>
          <div className="profile"><div className="avatar">TF</div><div><strong>TatvaFlow</strong><small>Portfolio CRM</small></div></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{currentPageLabel}</strong></div>
          <div className="top-actions">
            <span className="today-label">{clock.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
            <button className="icon-button" aria-label="Notifications are not configured" title="Notifications are not configured" disabled><Bell size={19} /></button>
            <div className="avatar">TF</div>
          </div>
        </header>
        <section className={`page-content${compactRows ? " compact-rows" : ""}`}>
          {notice && <div className={`notice notice-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.message}</div>}
          {loading && <div className="loading-banner" role="status">Loading lead data…</div>}
          {pageContent}
          <footer className="page-footer">TatvaFlow CRM <span>•</span> Portfolio MVP <span>•</span> React, TypeScript & Express</footer>
        </section>
      </main>
    </div>
  );
}

function ViewHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="view-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Metrics({ leads, pipelineValue, qualified, won }: { leads: Lead[]; pipelineValue: number; qualified: number; won: number }) {
  return <div className="metrics-grid">
    <MetricCard title="Total leads" value={String(leads.length)} detail="All current records" icon={<Users size={19} />} tone="blue" />
    <MetricCard title="Pipeline value" value={money(pipelineValue)} detail="Open opportunities" icon={<Target size={19} />} tone="violet" />
    <MetricCard title="Qualified leads" value={String(qualified)} detail="Ready for next steps" icon={<ArrowUpRight size={19} />} tone="green" />
    <MetricCard title="Deals won" value={String(won)} detail="Successfully closed" icon={<ArrowDownRight size={19} />} tone="orange" />
  </div>;
}

function MetricCard({ title, value, detail, icon, tone }: { title: string; value: string; detail: string; icon: ReactNode; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-title">{title}</div><div className="metric-value">{value}</div><div className="metric-change">{detail}</div></article>;
}

function LeadForm({ onSubmit, onCancel }: { onSubmit: (lead: LeadInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(value);
    if (!name.trim() || !company.trim() || !email.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), company: company.trim(), email: email.trim(), value: amount, status: "New" });
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="lead-form" onSubmit={(event) => void submit(event)}>
    <div className="form-heading"><h2>Create a lead</h2><button type="button" className="text-button" onClick={onCancel}>Cancel</button></div>
    <div className="form-grid">
      <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Aditi Rao" maxLength={120} autoComplete="name" required /></label>
      <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" maxLength={160} autoComplete="organization" required /></label>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" maxLength={254} autoComplete="email" required /></label>
      <label>Deal value (₹)<input type="number" min="1" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="50000" required /></label>
    </div>
    <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save lead"}</button>
  </form>;
}

function LeadTable({ leads, busyLeadId, onChangeStatus, onDelete, loading = false, compact = false }: {
  leads: Lead[];
  busyLeadId: string;
  onChangeStatus: (id: string, status: LeadStatus) => void;
  onDelete: (lead: Lead) => void;
  loading?: boolean;
  compact?: boolean;
}) {
  return <div className={`table-wrap${compact ? " table-compact" : ""}`}>
    <table>
      <thead><tr><th>CONTACT</th><th>COMPANY</th><th>DEAL VALUE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan={5} className="empty-state">Loading leads…</td></tr>}
        {!loading && leads.map((lead) => (
          <tr key={lead.id}>
            <td><div className="contact-cell"><div className="contact-avatar">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><strong>{lead.name}</strong><small>{lead.email}</small></div></div></td>
            <td>{lead.company}</td><td className="money-cell">{money(lead.value)}</td>
            <td><select className={`status-select status-${lead.status.toLowerCase()}`} aria-label={`Status for ${lead.name}`} value={lead.status} disabled={busyLeadId === lead.id} onChange={(event) => onChangeStatus(lead.id, event.target.value as LeadStatus)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
            <td><button className="icon-button row-delete" aria-label={`Delete ${lead.name}`} title={`Delete ${lead.name}`} disabled={busyLeadId === lead.id} onClick={() => onDelete(lead)}><Trash2 size={15} /></button></td>
          </tr>
        ))}
        {!loading && leads.length === 0 && <tr><td colSpan={5} className="empty-state">No leads to display. Create a lead or adjust your filters.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return <div className="empty-panel"><strong>{title}</strong><p>{message}</p></div>;
}

export default App;
