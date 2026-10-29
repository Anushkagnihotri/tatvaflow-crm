
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  Command,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
  Target,
  CalendarClock,
  MoreHorizontal,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:4000/api";

type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  value: number;
  status: "New" | "Contacted" | "Qualified" | "Won";
  lastContact?: string;
};

const initialLeads: Lead[] = [
  { id: "1", name: "Aarav Mehta", company: "Nexora Technologies", email: "aarav@nexora.example", value: 85000, status: "Qualified", lastContact: "2 hours ago" },
  { id: "2", name: "Priya Sharma", company: "BluePeak Solutions", email: "priya@bluepeak.example", value: 62000, status: "Contacted", lastContact: "Yesterday" },
  { id: "3", name: "Rohan Desai", company: "Vertex Industries", email: "rohan@vertex.example", value: 120000, status: "New", lastContact: "Not contacted" },
  { id: "4", name: "Sneha Kapoor", company: "Orbit Systems", email: "sneha@orbit.example", value: 95000, status: "Qualified", lastContact: "Today" },
  { id: "5", name: "Kabir Joshi", company: "Greenline Retail", email: "kabir@greenline.example", value: 44000, status: "Won", lastContact: "2 days ago" },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const response = await fetch(`${API_URL}/leads`);

        if (!response.ok) {
          throw new Error("Failed to fetch leads");
        }

        const result: { data: Lead[]; total: number } =
          await response.json();

        setLeads(result.data);
      } catch (error) {
        console.error("Error loading leads:", error);
        setNotice(
          "Could not load leads. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesSearch = `${lead.name} ${lead.company} ${lead.email}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesSearch &&
          (statusFilter === "All" || lead.status === statusFilter);
      }),
    [leads, query, statusFilter]
  );

  const pipelineValue = leads
    .filter((lead) => lead.status !== "Won")
    .reduce((total, lead) => total + lead.value, 0);

  const qualified = leads.filter((lead) => lead.status === "Qualified").length;
  const won = leads.filter((lead) => lead.status === "Won").length;

  async function addLead(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const amount = Number(value);

  if (
    !name.trim() ||
    !company.trim() ||
    !email.trim() ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setNotice("Enter valid lead details and a positive deal value.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        value: amount,
        status: "New",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create lead");
    }

    const result: { data: Lead } = await response.json();

    setLeads((current) => [
      { ...result.data, lastContact: "Not contacted" },
      ...current,
    ]);

    setName("");
    setCompany("");
    setEmail("");
    setValue("");
    setShowForm(false);
    setNotice("Lead saved successfully to the backend.");
  } catch (error) {
    console.error("Error creating lead:", error);
    setNotice("Could not save the lead. Please try again.");
  }
}

async function changeStatus(id: string, status: Lead["status"]) {
  try {
    const response = await fetch(`${API_URL}/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }

    const result: { data: Lead } = await response.json();

    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? { ...result.data, lastContact: lead.lastContact }
          : lead
      )
    );

    setNotice(`Status saved as ${status}.`);
  } catch (error) {
    console.error("Status update failed:", error);
    setNotice("Status could not be saved. Please try again.");
  }
}

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
          <div><strong>Acme Workspace</strong><small>Free workspace</small></div>
          <ChevronDown size={16} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          <a className="nav-item active" href="#dashboard"><LayoutDashboard size={18} /> Dashboard</a>
          <a className="nav-item" href="#leads"><Users size={18} /> Leads <span className="nav-count">{leads.length}</span></a>
          <a className="nav-item" href="#pipeline"><Target size={18} /> Pipeline</a>
          <a className="nav-item" href="#activities"><CalendarClock size={18} /> Activities</a>
          <a className="nav-item" href="#reports"><Activity size={18} /> Reports</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={20} />
            <div><strong>Need a hand?</strong><small>Explore your CRM workspace</small></div>
          </div>
          <a className="nav-item" href="#settings"><Settings size={18} /> Settings</a>
          <div className="profile">
            <div className="avatar">AA</div>
            <div><strong>Anushka Agnihotri</strong><small>Workspace admin</small></div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      <main className="main-area" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Dashboard</strong></div>
          <div className="top-actions">
            <span className="today-label">Thursday, 29 October</span>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="avatar">AA</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
              <h1>Good morning, Anushka <span>✳</span></h1>
              <p>Here’s what’s happening with your sales pipeline today.</p>
            </div>
            <button className="primary-button" onClick={() => { setShowForm(!showForm); setNotice(""); }}>
              <Plus size={18} /> Add new lead
            </button>
          </div>

          {notice && <div className="notice" role="status">{notice}</div>}

          {showForm && (
            <form className="lead-form" onSubmit={addLead}>
              <div className="form-heading"><h2>Create a lead</h2><button type="button" className="text-button" onClick={() => setShowForm(false)}>Cancel</button></div>
              <div className="form-grid">
                <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi Rao" required /></label>
                <label>Company<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" required /></label>
                <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required /></label>
                <label>Deal value (₹)<input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="50000" required /></label>
              </div>
              <button className="primary-button" type="submit">Save lead</button>
            </form>
          )}

          <div className="section-heading"><div><h2>Overview</h2><p>Monitor your sales performance in real time.</p></div><button className="filter-button">Last 30 days <ChevronDown size={15} /></button></div>

          <div className="metrics-grid">
            <Metric title="Total leads" value={String(leads.length)} change="Active records" icon={<Users size={19} />} tone="blue" />
            <Metric title="Pipeline value" value={money(pipelineValue)} change="Open opportunities" icon={<Target size={19} />} tone="violet" />
            <Metric title="Qualified leads" value={String(qualified)} change="Ready for next steps" icon={<ArrowUpRight size={19} />} tone="green" />
            <Metric title="Deals won" value={String(won)} change="Successfully closed" icon={<ArrowDownRight size={19} />} tone="orange" />
          </div>

          <section className="leads-panel" id="leads">
            <div className="panel-heading">
              <div><h2>Recent leads</h2><p>Manage your prospects and keep opportunities moving.</p></div>
              <button className="secondary-button" onClick={() => setShowForm(true)}><Plus size={16} /> New lead</button>
            </div>
            <div className="table-tools">
              <div className="search-box"><Search size={17} /><input aria-label="Search leads" placeholder="Search name, company or email..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {["All", "New", "Contacted", "Qualified", "Won"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>CONTACT</th><th>COMPANY</th><th>DEAL VALUE</th><th>STATUS</th><th>LAST ACTIVITY</th></tr></thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td><div className="contact-cell"><div className="contact-avatar">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{lead.name}</strong><small>{lead.email}</small></div></div></td>
                      <td>{lead.company}</td>
                      <td className="money-cell">{money(lead.value)}</td>
                      <td><select className={`status-select status-${lead.status.toLowerCase()}`} aria-label={`Status for ${lead.name}`} value={lead.status} onChange={(e) => changeStatus(lead.id, e.target.value as Lead["status"])}>{["New", "Contacted", "Qualified", "Won"].map((status) => <option key={status}>{status}</option>)}</select></td>
                      <td className="muted-cell">{lead.lastContact}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && <tr><td colSpan={5} className="empty-state">No leads match your search.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
  <span>Showing {filteredLeads.length} of {leads.length} leads</span>
  <span>{loading ? "Loading leads..." : "Connected to TatvaFlow API"}</span>
</div>
          </section>

          <footer className="page-footer">TatvaFlow CRM <span>•</span> Portfolio MVP <span>•</span> Built with React & TypeScript</footer>
        </section>
      </main>
    </div>
  );
}

function Metric({ title, value, change, icon, tone }: {
  title: string; value: string; change: string; icon: React.ReactNode; tone: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-change">{change}</div>
    </article>
  );
}

export default App;
