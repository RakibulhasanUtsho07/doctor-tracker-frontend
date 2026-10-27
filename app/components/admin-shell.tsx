"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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

function MetricPlaceholder({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className="metric-icon"><Icon name={icon} size={19} /></span><span className="metric-state">API pending</span></div>
      <h3>{title}</h3>
      <div className="metric-value" aria-label={title + ": not connected yet"}><span aria-hidden="true">—</span><small>not connected</small></div>
      <p>{detail}</p>
    </article>
  );
}

function DashboardView({ onNavigate }: { onNavigate: (next: Section) => void }) {
  return (
    <>
      <section className="welcome-panel" aria-labelledby="welcome-heading">
        <div className="welcome-copy">
          <div className="welcome-kicker"><Icon name="sparkles" size={15} /> A CALMER WAY TO MANAGE CARE</div>
          <h2 id="welcome-heading">More clarity.<br /><span>Less busywork.</span></h2>
          <p>A thoughtful home for doctor and patient administration. Start with a clean foundation, then connect the data that matters.</p>
          <button type="button" className="primary-button" onClick={() => onNavigate("doctors")}>Explore your workspace <Icon name="arrow-up-right" size={17} /></button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit art-orbit--one" />
          <div className="art-orbit art-orbit--two" />
          <div className="art-spark art-spark--one">✳</div><div className="art-spark art-spark--two">✦</div>
          <div className="art-window">
            <div className="art-window-head"><span className="art-window-mark"><span /></span><span className="art-window-line" /><span className="art-window-dots"><i /><i /><i /></span></div>
            <div className="art-window-body">
              <div className="art-sidebar-lines"><i /><i /><i /><i /></div>
              <div className="art-content-lines"><span className="art-label">ILLUSTRATIVE UI</span><div className="art-skeleton art-skeleton--long" /><div className="art-skeleton art-skeleton--medium" /><div className="art-mini-grid"><i /><i /><i /></div><div className="art-chart"><i /><i /><i /><i /><i /><i /><i /></div></div>
            </div>
          </div>
          <div className="art-floating-card"><span className="art-floating-icon"><Icon name="shield" size={17} /></span><span><strong>Built with care</strong><small>Privacy-aware by design</small></span></div>
        </div>
      </section>

      <section className="metrics-section" aria-labelledby="metrics-heading">
        <div className="section-heading"><div><p className="section-kicker">AT A GLANCE</p><h2 id="metrics-heading">Your practice, in focus</h2></div><span className="preview-note"><span /> Live data is not connected</span></div>
        <div className="metrics-grid">
          <MetricPlaceholder icon="doctors" title="Doctor records" detail="The live directory will appear after API integration." />
          <MetricPlaceholder icon="patients" title="Patient records" detail="Patient totals will be loaded from the secured API." />
          <MetricPlaceholder icon="activity" title="Daily activity" detail="Daily creation trends will be driven by dashboard metrics." />
        </div>
      </section>

      <section className="lower-grid" aria-label="Workspace modules and upcoming work">
        <div className="modules-panel">
          <div className="section-heading section-heading--compact"><div><p className="section-kicker">YOUR WORKSPACE</p><h2>Built around your workflow</h2></div></div>
          <div className="module-list">
            <button type="button" className="module-card" onClick={() => onNavigate("doctors")}><span className="module-icon module-icon--green"><Icon name="doctors" size={21} /></span><span className="module-copy"><strong>Doctor directory</strong><small>Search, organize and manage your care team.</small><span className="module-status">NEXT MODULE</span></span><span className="module-arrow"><Icon name="arrow-up-right" size={18} /></span></button>
            <button type="button" className="module-card" onClick={() => onNavigate("patients")}><span className="module-icon module-icon--lavender"><Icon name="patients" size={21} /></span><span className="module-copy"><strong>Patient records</strong><small>Keep patient details and doctor relationships clear.</small><span className="module-status">PLANNED</span></span><span className="module-arrow"><Icon name="arrow-up-right" size={18} /></span></button>
          </div>
        </div>
        <aside className="next-panel" aria-labelledby="next-heading">
          <div className="next-panel-heading"><span className="next-panel-icon"><Icon name="calendar" size={18} /></span><span className="section-kicker">DELIVERY PLAN</span></div>
          <h2 id="next-heading">A solid foundation, one step at a time.</h2>
          <p>This screen is a UI foundation preview. Real records and sign-in will be integrated in the next milestones.</p>
          <ol className="milestone-list">
            <li className="milestone-list-item milestone-list-item--done"><span className="milestone-marker">✓</span><span><strong>Application shell</strong><small>Navigation, layout and accessibility basics</small></span><span className="milestone-tag">CURRENT</span></li>
            <li className="milestone-list-item"><span className="milestone-marker">2</span><span><strong>Sign-in & dashboard</strong><small>Secure session and live metrics</small></span></li>
            <li className="milestone-list-item"><span className="milestone-marker">3</span><span><strong>Doctor & patient flows</strong><small>Records connected to the API</small></span></li>
          </ol>
        </aside>
      </section>
      <p className="page-disclaimer"><Icon name="shield" size={14} /> Preview only. No real patient data or live record counts are shown on this screen.</p>
    </>
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
