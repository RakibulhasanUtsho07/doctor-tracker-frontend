"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { apiRequest, ApiClientError, getApiBaseUrl } from "../lib/api-client";

type Section = "dashboard" | "doctors" | "patients";
type IconName = "dashboard" | "doctors" | "patients" | "menu" | "close" | "shield" | "arrow-up-right" | "sparkles" | "activity" | "calendar" | "database" | "chevron-right" | "layers" | "clock";

const navigation: Array<{ id: Section; label: string; description: string; icon: IconName }> = [
  { id: "dashboard", label: "Dashboard", description: "Overview and activity", icon: "dashboard" },
  { id: "doctors", label: "Doctors", description: "Directory and profiles", icon: "doctors" },
  { id: "patients", label: "Patients", description: "Records and care teams", icon: "patients" }
];

const sectionCopy: Record<Section, { title: string; eyebrow: string; description: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "WORKSPACE OVERVIEW", description: "A clear starting point for the people and work behind your practice." },
  doctors: { title: "Doctors", eyebrow: "CARE TEAM", description: "The doctor directory will live here when the API-connected screens are added." },
  patients: { title: "Patients", eyebrow: "PATIENT RECORDS", description: "A focused workspace for patient records and doctor relationships is coming next." }
};

type AdminUser = { id: string; email: string; role: string };
type AuthSession = { user: AdminUser; csrfToken: string; expiresAt: string };
type DashboardDay = { date: string; doctorsCreated: number; patientsCreated: number };
type DashboardSummary = {
  totals: { doctors: number; patients: number };
  patientsPerDoctor: Array<{ doctorId: string; doctorName: string; patientCount: number }>;
  dateStatistics: { from: string; to: string; days: DashboardDay[] };
};
type AuthStatus = "checking" | "signed-out" | "signed-in" | "unavailable";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  let drawing: ReactNode = null;
  switch (name) {
    case "dashboard":
      drawing = <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>;
      break;
    case "doctors":
      drawing = <><path d="M8 4.5a3 3 0 0 0-6 0v4a7 7 0 0 0 14 0V7" /><path d="M16 3v4h4" /><circle cx="16" cy="3" r="1.5" /><path d="M9 15v1.5a4.5 4.5 0 0 0 9 0V15" /><circle cx="13.5" cy="12.5" r="1.5" /></>;
      break;
    case "patients":
      drawing = <><circle cx="9" cy="8" r="3.25" /><path d="M2.8 20v-1.2a6.2 6.2 0 0 1 12.4 0V20" /><path d="M16 4.8a3.25 3.25 0 0 1 0 6.3M18.2 14a5.5 5.5 0 0 1 3 4.8V20" /></>;
      break;
    case "menu":
      drawing = <><path d="M4 6h16M4 12h16M4 18h16" /></>;
      break;
    case "close":
      drawing = <><path d="m6 6 12 12M18 6 6 18" /></>;
      break;
    case "shield":
      drawing = <><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>;
      break;
    case "arrow-up-right":
      drawing = <><path d="M7 17 17 7M8 7h9v9" /></>;
      break;
    case "sparkles":
      drawing = <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>;
      break;
    case "activity":
      drawing = <><path d="M3 12h4l3-8 4 16 3-8h4" /></>;
      break;
    case "calendar":
      drawing = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>;
      break;
    case "database":
      drawing = <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>;
      break;
    case "chevron-right":
      drawing = <><path d="m9 18 6-6-6-6" /></>;
      break;
    case "layers":
      drawing = <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>;
      break;
    case "clock":
      drawing = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
      break;
  }
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{drawing}</svg>;
}

function AppBrand({ onActivate }: { onActivate: () => void }) {
  return (
    <a className="brand" href="#main-content" onClick={onActivate} aria-label="Doctor Tracker home">
      <span className="brand-mark" aria-hidden="true"><span /></span>
      <span className="brand-copy"><strong>doctor<span>tracker</span></strong><small>CARE OPERATIONS</small></span>
    </a>
  );
}

function Sidebar({ section, onNavigate, isOpen, onClose }: { section: Section; onNavigate: (next: Section) => void; isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {isOpen && <button type="button" className="mobile-scrim" aria-label="Close navigation menu" onClick={onClose} />}
      <aside id="primary-sidebar" className={"sidebar " + (isOpen ? "sidebar--open" : "")} aria-label="Primary sidebar">
        <div className="sidebar-top">
          <AppBrand onActivate={() => onNavigate("dashboard")} />
          <button type="button" className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="workspace-selector" aria-label="Current workspace">
          <span className="workspace-glyph"><Icon name="layers" size={18} /></span>
          <span className="workspace-label"><strong>Care workspace</strong><small>ADMIN CONSOLE</small></span>
          <Icon name="chevron-right" size={16} />
        </div>
        <div className="nav-heading">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <button type="button" key={item.id} className={"nav-link " + (section === item.id ? "nav-link--active" : "")} aria-current={section === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
              <span className="nav-link-icon"><Icon name={item.icon} size={19} /></span>
              <span className="nav-link-copy"><span>{item.label}</span><small>{item.description}</small></span>
              {section === item.id && <span className="nav-active-mark" aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-card">
          <span className="privacy-icon"><Icon name="shield" size={17} /></span>
          <div><strong>Privacy comes first</strong><p>Patient information stays out of this preview. Secure API integration comes next.</p></div>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar" aria-hidden="true">UI</span>
          <span className="profile-copy"><strong>Preview user</strong><small>Not signed in</small></span>
          <span className="profile-status" title="Preview only" aria-label="Preview only" />
        </div>
      </aside>
    </>
  );
}

function LiveMetricCard({ icon, title, value, detail, accent }: { icon: IconName; title: string; value: number; detail: string; accent: "green" | "lavender" | "amber" }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={"metric-icon metric-icon--" + accent}><Icon name={icon} size={19} /></span>
        <span className="metric-state">LIVE API</span>
      </div>
      <h3>{title}</h3>
      <div className="metric-value"><span>{value.toLocaleString()}</span><small>records</small></div>
      <p>{detail}</p>
    </article>
  );
}

function DailyActivityChart({ days }: { days: DashboardDay[] }) {
  const chartDays = days.slice(-30);
  const maxValue = Math.max(1, ...chartDays.map((day) => Math.max(day.doctorsCreated, day.patientsCreated)));
  const width = 620;
  const height = 150;
  const plotHeight = 112;
  const slotWidth = width / Math.max(1, chartDays.length);
  const barWidth = Math.max(2, Math.min(8, slotWidth * 0.27));
  const doctorTotal = days.reduce((sum, day) => sum + day.doctorsCreated, 0);
  const patientTotal = days.reduce((sum, day) => sum + day.patientsCreated, 0);
  const labelIndexes = Array.from(new Set([0, Math.floor((chartDays.length - 1) / 2), chartDays.length - 1]));

  return (
    <div className="chart-content">
      {chartDays.length === 0 ? (
        <p className="empty-state">No dates were returned for this range.</p>
      ) : (
        <>
          <div className="chart-legend" aria-label="Chart series">
            <span><i className="legend-doctors" /> Doctors created</span>
            <span><i className="legend-patients" /> Patients created</span>
          </div>
          <div className="daily-chart-wrap">
            <svg className="daily-chart" viewBox={"0 0 " + width + " " + height} role="img" aria-labelledby="daily-chart-title daily-chart-description">
              <title id="daily-chart-title">Daily doctor and patient creation</title>
              <desc id="daily-chart-description">{doctorTotal} doctors and {patientTotal} patients created across {days.length} selected UTC days. The chart shows the final {chartDays.length} days of this range.</desc>
              {[0, 1, 2, 3].map((line) => {
                const y = 10 + (plotHeight / 3) * line;
                return <line key={line} x1="0" x2={width} y1={y} y2={y} className="chart-grid-line" />;
              })}
              {chartDays.map((day, index) => {
                const groupX = index * slotWidth;
                const doctorHeight = day.doctorsCreated === 0 ? 0 : (day.doctorsCreated / maxValue) * plotHeight;
                const patientHeight = day.patientsCreated === 0 ? 0 : (day.patientsCreated / maxValue) * plotHeight;
                return (
                  <g key={day.date}>
                    <rect x={groupX + slotWidth * 0.18} y={10 + plotHeight - doctorHeight} width={barWidth} height={doctorHeight} rx="2" className="doctor-bar">
                      <title>{day.date}: {day.doctorsCreated} doctors created</title>
                    </rect>
                    <rect x={groupX + slotWidth * 0.18 + barWidth + 2} y={10 + plotHeight - patientHeight} width={barWidth} height={patientHeight} rx="2" className="patient-bar">
                      <title>{day.date}: {day.patientsCreated} patients created</title>
                    </rect>
                  </g>
                );
              })}
              {labelIndexes.map((index) => {
                const day = chartDays[index];
                if (!day) return null;
                const x = index * slotWidth + slotWidth / 2;
                return <text key={day.date} x={x} y="145" textAnchor="middle" className="chart-axis-label">{day.date.slice(5)}</text>;
              })}
            </svg>
          </div>
          <p className="chart-summary">Across the selected period: <strong>{doctorTotal}</strong> doctors and <strong>{patientTotal}</strong> patients created. {days.length > 30 ? "The visual plots the most recent 30 days in the chosen range; all days remain available below." : "Zero-count days are included."}</p>
          <details className="chart-data">
            <summary>View all {days.length} daily values</summary>
            <div className="chart-table-wrap">
              <table>
                <caption>UTC daily creation counts for the selected date range</caption>
                <thead><tr><th scope="col">UTC date</th><th scope="col">Doctors</th><th scope="col">Patients</th></tr></thead>
                <tbody>{days.map((day) => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.doctorsCreated}</td><td>{day.patientsCreated}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function PatientAssociationChart({ rows }: { rows: DashboardSummary["patientsPerDoctor"] }) {
  const ranked = [...rows].sort((left, right) => right.patientCount - left.patientCount || left.doctorName.localeCompare(right.doctorName)).slice(0, 6);
  const maxValue = Math.max(1, ...ranked.map((row) => row.patientCount));
  return (
    <div className="association-content">
      <p className="chart-summary">Current linked-patient counts, ranked across {rows.length} doctors. Detached patient records are not assigned to a doctor.</p>
      {ranked.length === 0 ? (
        <div className="empty-state"><span className="empty-state-icon"><Icon name="doctors" size={20} /></span><strong>No doctor records yet</strong><p>Doctor associations will appear after records are created through the secured API.</p></div>
      ) : (
        <ol className="association-list">
          {ranked.map((row, index) => (
            <li key={row.doctorId} className="association-row">
              <span className="association-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="association-detail">
                <span className="association-name">{row.doctorName}</span>
                <span className="association-track"><span style={{ width: ((row.patientCount / maxValue) * 100) + "%" }} /></span>
              </span>
              <strong className="association-count">{row.patientCount}</strong>
            </li>
          ))}
        </ol>
      )}
      <p className="association-footnote">Showing up to six doctors with the most currently associated patients.</p>
    </div>
  );
}

function DashboardView({
  onNavigate,
  data,
  loading,
  error,
  fromDate,
  toDate,
  rangeError,
  onFromChange,
  onToChange,
  onRangeSubmit,
  onRefresh
}: {
  onNavigate: (next: Section) => void;
  data: DashboardSummary | null;
  loading: boolean;
  error: string;
  fromDate: string;
  toDate: string;
  rangeError: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRangeSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
}) {
  const days = data?.dateStatistics.days ?? [];
  return (
    <>
      <section className="welcome-panel" aria-labelledby="welcome-heading">
        <div className="welcome-copy">
          <div className="welcome-kicker"><Icon name="sparkles" size={15} /> A CALMER WAY TO MANAGE CARE</div>
          <h2 id="welcome-heading">More clarity.<br /><span>Less busywork.</span></h2>
          <p>Your workspace is connected to the administrator API. Review current doctor and patient records, then explore creation trends over a date range.</p>
          <button type="button" className="primary-button" onClick={() => onNavigate("doctors")}>Explore doctor directory <Icon name="arrow-up-right" size={17} /></button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit art-orbit--one" /><div className="art-orbit art-orbit--two" />
          <div className="art-spark art-spark--one">✳</div><div className="art-spark art-spark--two">✦</div>
          <div className="art-window">
            <div className="art-window-head"><span className="art-window-mark"><span /></span><span className="art-window-line" /><span className="art-window-dots"><i /><i /><i /></span></div>
            <div className="art-window-body"><div className="art-sidebar-lines"><i /><i /><i /><i /></div><div className="art-content-lines"><span className="art-label">LIVE API WORKSPACE</span><div className="art-skeleton art-skeleton--long" /><div className="art-skeleton art-skeleton--medium" /><div className="art-mini-grid"><i /><i /><i /></div><div className="art-chart"><i /><i /><i /><i /><i /><i /><i /></div></div></div>
          </div>
          <div className="art-floating-card"><span className="art-floating-icon"><Icon name="shield" size={17} /></span><span><strong>Session protected</strong><small>Cookie-based admin access</small></span></div>
        </div>
      </section>

      <section className="metrics-section" aria-labelledby="metrics-heading" aria-busy={loading}>
        <div className="section-heading"><div><p className="section-kicker">AT A GLANCE</p><h2 id="metrics-heading">Your practice, in focus</h2></div><span className="connection-note"><span /> {loading ? "Updating from API" : "Database-backed metrics"}</span></div>
        <div className="metrics-grid">
          <LiveMetricCard icon="doctors" title="Doctor records" value={data?.totals.doctors ?? 0} detail="All current doctor records, independent of date filters." accent="green" />
          <LiveMetricCard icon="patients" title="Patient records" value={data?.totals.patients ?? 0} detail="All current patient records, including detached patients." accent="lavender" />
          <LiveMetricCard icon="activity" title="Daily activity" value={days.reduce((total, day) => total + day.doctorsCreated + day.patientsCreated, 0)} detail="Doctor and patient records created within the selected dates." accent="amber" />
        </div>
        {loading && <p className="inline-status" role="status">Loading dashboard metrics from the secured API…</p>}
        {error && <div className="dashboard-error" role="alert"><Icon name="activity" size={18} /><span><strong>Dashboard could not be loaded</strong><small>{error}</small></span><button type="button" className="secondary-button" onClick={onRefresh}>Try again</button></div>}
      </section>

      <section className="filter-panel" aria-labelledby="date-range-heading">
        <div className="filter-panel-copy"><span className="filter-icon"><Icon name="calendar" size={19} /></span><span><strong id="date-range-heading">Creation activity</strong><small>Inclusive UTC dates · up to 366 days</small></span></div>
        <form className="range-form" onSubmit={onRangeSubmit}>
          <label>From<input type="date" value={fromDate} max={toDate || undefined} required onChange={(event) => onFromChange(event.target.value)} /></label>
          <label>To<input type="date" value={toDate} min={fromDate || undefined} required onChange={(event) => onToChange(event.target.value)} /></label>
          <button type="submit" className="primary-button" disabled={loading}>Apply range</button>
          <button type="button" className="icon-button refresh-button" aria-label="Refresh dashboard" title="Refresh dashboard" onClick={onRefresh} disabled={loading}><Icon name="activity" /></button>
        </form>
        {rangeError && <p className="range-error" role="alert">{rangeError}</p>}
        {data && <p className="selected-range-note">Showing {data.dateStatistics.from} through {data.dateStatistics.to} in UTC. Totals and current doctor associations are all-time values.</p>}
      </section>

      <section className="analytics-grid" aria-label="Dashboard analytics" aria-busy={loading}>
        <article className="analytics-panel" aria-labelledby="activity-heading">
          <div className="analytics-heading"><div><p className="section-kicker">CREATION TRENDS</p><h2 id="activity-heading">Daily activity</h2></div><span className="analytics-period">{data ? data.dateStatistics.days.length + " days" : "—"}</span></div>
          {data ? <DailyActivityChart days={data.dateStatistics.days} /> : <div className="chart-loading" role="status">Waiting for dashboard data…</div>}
        </article>
        <article className="analytics-panel" aria-labelledby="association-heading">
          <div className="analytics-heading"><div><p className="section-kicker">CARE TEAM SNAPSHOT</p><h2 id="association-heading">Patients per doctor</h2></div><span className="analytics-period">{data ? data.patientsPerDoctor.length + " doctors" : "—"}</span></div>
          {data ? <PatientAssociationChart rows={data.patientsPerDoctor} /> : <div className="chart-loading" role="status">Waiting for dashboard data…</div>}
        </article>
      </section>

      <section className="lower-grid" aria-label="Workspace modules">
        <div className="modules-panel">
          <div className="section-heading section-heading--compact"><div><p className="section-kicker">YOUR WORKSPACE</p><h2>Built around your workflow</h2></div></div>
          <div className="module-list">
            <button type="button" className="module-card" onClick={() => onNavigate("doctors")}><span className="module-icon module-icon--green"><Icon name="doctors" size={21} /></span><span className="module-copy"><strong>Doctor directory</strong><small>Doctor records will be managed in the next UI milestone.</small><span className="module-status">COMING NEXT</span></span><span className="module-arrow"><Icon name="arrow-up-right" size={18} /></span></button>
            <button type="button" className="module-card" onClick={() => onNavigate("patients")}><span className="module-icon module-icon--lavender"><Icon name="patients" size={21} /></span><span className="module-copy"><strong>Patient records</strong><small>Patient management and doctor links follow next.</small><span className="module-status">PLANNED</span></span><span className="module-arrow"><Icon name="arrow-up-right" size={18} /></span></button>
          </div>
        </div>
        <aside className="next-panel" aria-labelledby="next-heading">
          <div className="next-panel-heading"><span className="next-panel-icon"><Icon name="shield" size={18} /></span><span className="section-kicker">SAFE BY DESIGN</span></div>
          <h2 id="next-heading">Your session stays out of browser storage.</h2>
          <p>Authentication uses the server-issued HttpOnly cookie. The CSRF token stays in memory and is sent only with protected state-changing requests.</p>
          <ol className="milestone-list">
            <li className="milestone-list-item milestone-list-item--done"><span className="milestone-marker">✓</span><span><strong>Secure sign-in</strong><small>Server-validated administrator session</small></span><span className="milestone-tag">CONNECTED</span></li>
            <li className="milestone-list-item"><span className="milestone-marker">2</span><span><strong>Doctor management</strong><small>Create, search and update records</small></span></li>
            <li className="milestone-list-item"><span className="milestone-marker">3</span><span><strong>Patient management</strong><small>Relationship-aware record workflows</small></span></li>
          </ol>
        </aside>
      </section>
      <p className="page-disclaimer"><Icon name="shield" size={14} /> Real API metrics are shown only after administrator authentication. The directory screens are not implemented in this milestone.</p>
    </>
  );
}

function SignInView({ onSubmit, pending, error, notice }: {
  onSubmit: (email: string, password: string) => Promise<boolean>;
  pending: boolean;
  error: string;
  notice: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await onSubmit(email.trim(), password);
    if (success) setPassword("");
  }

  return (
    <main className="auth-page">
      <a className="skip-link" href="#sign-in-form">Skip to sign-in form</a>
      <div className="auth-backdrop auth-backdrop--one" aria-hidden="true" />
      <div className="auth-backdrop auth-backdrop--two" aria-hidden="true" />
      <section className="auth-shell" aria-labelledby="sign-in-heading">
        <a className="auth-brand" href="#sign-in-heading" aria-label="Doctor Tracker">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>doctor<span>tracker</span></strong><small>CARE OPERATIONS</small></span>
        </a>
        <div className="auth-panel">
          <div className="auth-symbol"><Icon name="shield" size={25} /></div>
          <p className="section-kicker">ADMINISTRATOR ACCESS</p>
          <h1 id="sign-in-heading">Welcome back.</h1>
          <p className="auth-subtitle">Sign in to continue to your care workspace.</p>
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          {error && <p className="auth-error" id="login-error" role="alert">{error}</p>}
          <form id="sign-in-form" className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Administrator email</label>
            <input id="admin-email" name="email" type="email" autoComplete="username" inputMode="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@clinic.com" disabled={pending} />
            <div className="password-label-row"><label htmlFor="admin-password">Password</label><span>Administrator account only</span></div>
            <div className="password-field">
              <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" maxLength={1024} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={pending} />
              <button type="button" className="password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)} disabled={pending}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            <button type="submit" className="auth-submit" disabled={pending || !email.trim() || !password}>{pending ? <><span className="button-spinner" aria-hidden="true" /> Signing in…</> : <>Sign in securely <Icon name="arrow-up-right" size={17} /></>}</button>
          </form>
          <div className="auth-security-note"><Icon name="shield" size={17} /><p><strong>Private administrator workspace</strong><span>Sessions are managed by the API using an HttpOnly cookie. Credentials and session tokens are never saved to localStorage.</span></p></div>
        </div>
        <p className="auth-footer">No public registration. Your administrator account must be provisioned by the system operator.</p>
      </section>
    </main>
  );
}

function AuthStatusView({ error, onRetry }: { error: string; onRetry: () => void }) {
  const isMissingConfig = !getApiBaseUrl();
  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop--one" aria-hidden="true" />
      <div className="auth-backdrop auth-backdrop--two" aria-hidden="true" />
      <section className="auth-status-card" aria-labelledby="auth-status-heading">
        <span className="auth-symbol"><Icon name={isMissingConfig ? "database" : "activity"} size={25} /></span>
        <p className="section-kicker">{isMissingConfig ? "CONFIGURATION REQUIRED" : "CONNECTION CHECK"}</p>
        <h1 id="auth-status-heading">{isMissingConfig ? "Connect your API first." : "We couldn't verify your session."}</h1>
        <p>{error}</p>
        {isMissingConfig && <pre className="env-snippet">NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1</pre>}
        <button type="button" className="auth-submit" onClick={onRetry}><span>Try again</span><Icon name="arrow-up-right" size={17} /></button>
        <p className="auth-status-foot">No credentials are stored in this browser preview.</p>
      </section>
    </main>
  );
}

function ModulePlaceholder({ section, onNavigate }: { section: Exclude<Section, "dashboard">; onNavigate: (next: Section) => void }) {
  const isDoctors = section === "doctors";
  return (
    <section className="placeholder-page" aria-labelledby="placeholder-heading">
      <div className={"placeholder-illustration " + (isDoctors ? "placeholder-illustration--green" : "placeholder-illustration--lavender")}><Icon name={isDoctors ? "doctors" : "patients"} size={36} /></div>
      <p className="section-kicker">{isDoctors ? "STEP 8 · DOCTOR MANAGEMENT" : "STEP 9 · PATIENT MANAGEMENT"}</p>
      <h2 id="placeholder-heading">{isDoctors ? "Your doctor directory starts here." : "Patient records, handled with care."}</h2>
      <p className="placeholder-description">{isDoctors ? "The responsive shell is ready. Search, filters, forms and persisted doctor records will be added in the doctor-screen milestone." : "This area is reserved for patient search, editing and relationship-safe actions in the patient-screen milestone."}</p>
      <div className="placeholder-notice" role="status"><span className="placeholder-notice-icon"><Icon name="database" size={18} /></span><span><strong>No records are displayed</strong><small>This page is a navigation placeholder. It is not connected to the API and does not contain sample patient data.</small></span></div>
      <button type="button" className="secondary-button" onClick={() => onNavigate("dashboard")}><Icon name="chevron-right" size={16} /> Return to dashboard</button>
    </section>
  );
}

export default function AdminShell() {
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousSectionRef = useRef<Section>("dashboard");
  const restoreMenuFocusRef = useRef(false);
  const copy = sectionCopy[section];

  useEffect(() => {
    if (previousSectionRef.current !== section) {
      previousSectionRef.current = section;
      pageHeadingRef.current?.focus();
    }
  }, [section]);

  useEffect(() => {
    if (!mobileNavOpen) {
      if (restoreMenuFocusRef.current) {
        menuButtonRef.current?.focus();
        restoreMenuFocusRef.current = false;
      }
      return;
    }

    document.querySelector<HTMLButtonElement>("#primary-sidebar .nav-link")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        restoreMenuFocusRef.current = true;
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  function closeNavigation() {
    restoreMenuFocusRef.current = true;
    setMobileNavOpen(false);
  }

  function navigate(next: Section) {
    restoreMenuFocusRef.current = false;
    if (section === next) pageHeadingRef.current?.focus();
    setSection(next);
    setMobileNavOpen(false);
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar section={section} onNavigate={navigate} isOpen={mobileNavOpen} onClose={closeNavigation} />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-leading">
            <button ref={menuButtonRef} type="button" className="icon-button mobile-menu-button" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileNavOpen} aria-controls="primary-sidebar" onClick={() => mobileNavOpen ? closeNavigation() : setMobileNavOpen(true)}><Icon name={mobileNavOpen ? "close" : "menu"} size={20} /></button>
            <nav className="breadcrumbs" aria-label="Breadcrumb"><span>Workspace</span><Icon name="chevron-right" size={14} /><strong aria-current="page">{copy.title}</strong></nav>
          </div>
          <div className="topbar-trailing"><span className="preview-pill"><span /> UI PREVIEW</span><span className="topbar-divider" aria-hidden="true" /><span className="topbar-avatar" aria-hidden="true">UI</span><span className="topbar-user"><strong>Preview user</strong><small>Preview workspace</small></span></div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className="page-intro">
            <div><p className="section-kicker"><span className="intro-kicker-dot" /> {copy.eyebrow}</p><h1 ref={pageHeadingRef} tabIndex={-1}>{section === "dashboard" ? "Good systems make better care." : copy.title}</h1><p className="page-subtitle">{copy.description}</p></div>
            <div className="page-intro-side"><span className="intro-date-icon"><Icon name="clock" size={16} /></span><span><strong>Foundation phase</strong><small>Live data not connected</small></span></div>
          </div>
          {section === "dashboard" ? <DashboardView onNavigate={navigate} /> : <ModulePlaceholder section={section} onNavigate={navigate} />}
          <footer className="app-footer"><span><span className="footer-mark" aria-hidden="true">+</span> Doctor Tracker <span className="footer-separator">·</span> Admin workspace</span><span>Built for clarity, designed for care.</span></footer>
        </main>
      </div>
    </div>
  );
}
