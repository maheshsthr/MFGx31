import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  DUMMY_DEPARTMENTS,
  DUMMY_EMPLOYEES,
  DUMMY_MACHINERY,
  DUMMY_RESOURCES,
  DUMMY_TRANSFERS,
  CHART_DATA,
} from '../data/dummyData';

/* Wraps a real page replica in a browser frame, scaled to ~55% */
function PreviewFrame({ children, scale = 0.55 }) {
  return (
    <div className="lp-frame">
      <div className="lp-frame-bar">
        <span className="lp-frame-dot" />
        <span className="lp-frame-dot" />
        <span className="lp-frame-dot" />
        <span className="lp-frame-url">mfgx31.vercel.app</span>
      </div>
      <div className="lp-frame-viewport">
        <div className="lp-frame-canvas" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function LpBell({ size = 15, badge }) {
  return (
    <span className="lp-bell-svg">
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {badge > 0 && <span className="lp-bell-badge">{badge > 99 ? '99+' : badge}</span>}
    </span>
  );
}

function PreviewSidebar({ active }) {
  const items = [
    { icon: '◈', label: 'Dashboard', key: 'dash' },
    { icon: '⬡', label: 'Departments', key: 'dept' },
    { icon: '⇄', label: 'Transfers', key: 'transfers' },
    { bell: true, label: 'Notifications', key: 'notif' },
    { icon: '⚙', label: 'Settings', key: 'set' },
  ];
  return (
    <div className="lp-sidebar">
      <div className="lp-brand">
        <span className="lp-brand-bold">MFG</span>
        <span className="lp-brand-light">x31</span>
      </div>
      <div className="lp-sidebar-nav">
        {items.map((it) => (
          <div key={it.key} className={`lp-sidebar-item ${it.key === active ? 'active' : ''}`}>
            <span className="lp-sidebar-icon">{it.bell ? <LpBell /> : it.icon}</span>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div className="lp-sidebar-footer">
        <div className="lp-user-avatar">R</div>
        <div className="lp-user-info">
          <span className="lp-user-name">Rajesh Kumar</span>
          <span className="lp-user-role">Admin</span>
        </div>
      </div>
    </div>
  );
}

function PreviewTopbar({ title, badge }) {
  return (
    <div className="lp-topbar">
      <div className="lp-welcome">
        <div className="lp-topbar-title">{title}</div>
      </div>
      <div className="lp-topbar-right">
        <div className="lp-search">
          <span>⌕</span>
          <input readOnly placeholder="Search..." />
        </div>
        <LpBell badge={badge} />
      </div>
    </div>
  );
}

/* ===== DASHBOARD REPLICA ===== */
function DashboardPreview() {
  const stats = [
    { label: 'Total Employees', value: '150', trend: '▲ +2 this month', dark: true },
    { label: 'Departments', value: '6', trend: '▲ All active', dark: false },
    { label: 'Machinery', value: '12', trend: '▼ 2 in maintenance', dark: false },
    { label: 'Resources', value: '12,480', trend: '▲ +12% from last month', dark: false },
  ];

  const ranked = DUMMY_DEPARTMENTS.map((d) => ({
    name: d.name,
    count: DUMMY_EMPLOYEES.filter((e) => e.department_id === d.id && e.status === 'active').length,
  })).sort((a, b) => b.count - a.count).slice(0, 4);

  const recent = DUMMY_TRANSFERS.slice(0, 3);

  return (
    <div className="lp-page">
      <PreviewSidebar active="dash" />
      <div className="lp-main">
        <PreviewTopbar title="Dashboard" />        <div className="lp-content">
          <div className="lp-stats">
            {stats.map((s, i) => (
              <div key={i} className={`lp-stat ${s.dark ? 'dark' : ''}`}>
                <span className="lp-stat-label">{s.label}</span>
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-trend">{s.trend}</span>
              </div>
            ))}
          </div>
          <div className="lp-grid">
            <div className="lp-card">
              <div className="lp-card-head"><strong>Overview</strong><span className="lp-muted">Jan — Aug 2026</span></div>
              <div className="lp-chart" style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA}>
                    <defs>
                      <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F0F0F" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#0F0F0F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#8A8A8A' }} axisLine={false} tickLine={false} width={30} />
                    <Area type="monotone" dataKey="employees" stroke="#0F0F0F" strokeWidth={2} fill="url(#lpGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lp-card">
              <div className="lp-card-head"><strong>Departments by Headcount</strong></div>
              {ranked.map((d, i) => (
                <div key={d.name} className="lp-rank">
                  <div className="lp-rank-left">
                    <span className="lp-rank-num">{i + 1}</span>
                    <span className="lp-rank-name">{d.name}</span>
                  </div>
                  <span className="lp-rank-value">{d.count} emp.</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-grid lp-grid-2">
            <div className="lp-card">
              <div className="lp-card-head"><strong>Recent Transfers</strong></div>
              {recent.map((t) => (
                <div key={t.id} className="lp-transfer">
                  <span className="lp-transfer-icon">◈</span>
                  <div className="lp-transfer-info">
                    <span className="lp-transfer-name">{t.item_name}</span>
                    <span className="lp-transfer-route">{t.from_name} → {t.to_name}</span>
                  </div>
                  <span className="lp-muted">{new Date(t.transferred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
            </div>
            <div className="lp-card">
              <div className="lp-card-head"><strong>Resources</strong></div>
              {DUMMY_RESOURCES.slice(0, 3).map((r) => (
                <div key={r.id} className="lp-resource">
                  <span className="lp-resource-name">{r.name}</span>
                  <span className="lp-resource-qty">{r.quantity.toLocaleString()} {r.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== DEPARTMENTS REPLICA ===== */
function DepartmentsPreview() {
  const depts = DUMMY_DEPARTMENTS.slice(0, 4).map((d) => ({
    ...d,
    emp: DUMMY_EMPLOYEES.filter((e) => e.department_id === d.id && e.status === 'active').length,
    mach: DUMMY_MACHINERY.filter((m) => m.department_id === d.id).length,
  }));

  return (
    <div className="lp-page">
      <PreviewSidebar active="dept" />
      <div className="lp-main">
        <PreviewTopbar title="Departments" />
        <div className="lp-content">
          <div className="lp-dept-header">
            <span className="lp-dept-count">{depts.length} Departments · {depts.reduce((s, d) => s + d.emp, 0)} Total Employees</span>
            <span className="lp-add-btn">+ Add Department</span>
          </div>
          <div className="lp-dept-grid">
            {depts.map((d) => (
              <div key={d.id} className="lp-dept-card">
                <div className="lp-dept-top">
                  <span className="lp-dept-icon">⬡</span>
                  {d.head_profile_id && <span className="lp-dept-badge">Has Head</span>}
                </div>
                <strong className="lp-dept-name">{d.name}</strong>
                <p className="lp-dept-desc">{d.description}</p>
                <div className="lp-dept-metrics">
                  <span><strong>{d.emp}</strong> employees</span>
                  <span><strong>{d.mach}</strong> machines</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== SETTINGS REPLICA ===== */
function SettingsPreview() {
  const owners = [
    { name: 'Rajesh Kumar', role: 'Owner / MD', share: 55, first: true },
    { name: 'Priya Sharma', role: 'Partner / Director', share: 45, first: false },
  ];
  return (
    <div className="lp-page">
      <PreviewSidebar active="set" />
      <div className="lp-main">
        <PreviewTopbar title="Settings" />
        <div className="lp-content lp-content-narrow">
          <div className="lp-card lp-settings-card">
            <div className="lp-settings-head">
              <div>
                <strong className="lp-settings-title">Profile</strong>
                <span className="lp-muted">Rajesh Kumar — Admin</span>
              </div>
              <span className="lp-edit-btn">Edit Profile</span>
            </div>
            <div className="lp-settings-field">
              <label>Name</label>
              <div className="lp-input">Rajesh Kumar</div>
            </div>
            <div className="lp-settings-field">
              <label>Role</label>
              <div className="lp-input">Admin</div>
            </div>
          </div>

          <div className="lp-card lp-settings-card lp-danger-card">
            <div className="lp-settings-head">
              <div>
                <strong className="lp-settings-title danger">Danger Zone</strong>
                <span className="lp-muted">Irreversible actions. Proceed with caution.</span>
              </div>
            </div>
            <div className="lp-danger-item">
              <div>
                <strong>Edit Ownership Structure</strong>
                <span className="lp-muted">Add or adjust partner shares.</span>
              </div>
              <span className="lp-outline-btn">Edit Ownership</span>
            </div>
            <div className="lp-danger-item">
              <div>
                <strong>Delete Organization</strong>
                <span className="lp-muted">Permanently delete all data.</span>
              </div>
              <span className="lp-danger-btn">Delete Organization</span>
            </div>

            <div className="lp-owners">
              <div className="lp-owners-head">
                <strong>Ownership Structure</strong>
                <span className="lp-add-partner">+ Add Partner</span>
              </div>
              <div className="lp-owners-grid">
                {owners.map((o) => (
                  <div key={o.name} className="lp-owner-card">
                    <div className="lp-owner-top">
                      <div className={`lp-owner-av ${o.first ? '' : 'alt'}`}>{o.name.charAt(0)}</div>
                      <div>
                        <strong className="lp-owner-name">{o.name}</strong>
                        <div className="lp-muted">{o.role}</div>
                      </div>
                    </div>
                    <div className="lp-share-bar">
                      <div className={`lp-share-fill ${o.first ? '' : 'alt'}`} style={{ width: `${o.share}%` }} />
                    </div>
                    <span className="lp-share-label">{o.share}% ownership</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== NOTIFICATIONS REPLICA (page + bell popup) ===== */
function NotificationsPreview() {
  const items = [
    { title: 'Administrator moved an asset', msg: 'Rajesh Kumar moved Rapier Loom #1 to your department.', time: '2 min ago', unread: true },
    { title: 'New employees added', msg: 'Amit Sharma added 3 workers to Weaving.', time: '1 hr ago', unread: true },
    { title: 'Transfer request approved', msg: 'Your transfer of Jet Dyeing Machine was approved.', time: '3 hr ago', unread: false },
    { title: 'Machinery moved to maintenance', msg: 'Power Loom #3 was marked for maintenance.', time: 'Yesterday', unread: false },
    { title: 'Document uploaded', msg: 'SOP — Fabric Dyeing was uploaded.', time: '2 days ago', unread: false },
  ];
  const popupItems = items.slice(0, 5);
  return (
    <div className="lp-page">
      <PreviewSidebar active="notif" />
      <div className="lp-main">
        <PreviewTopbar title="Notifications" badge={3} />
        <div className="lp-content lp-notif-layout">
          {/*
            Left: the full notifications page.
            Right: the bell dropdown popup, shown open as a floating card.
          */}
          <div className="lp-notif-page">
            <div className="lp-notif-head">
              <div>
                <div className="lp-notif-title">Notifications</div>
                <span className="lp-muted">3 unread</span>
              </div>
              <div className="lp-notif-actions">
                <span className="lp-outline-btn">Mark all read</span>
                <span className="lp-notif-clear">Clear all</span>
              </div>
            </div>
            <div className="lp-notif-list">
              {items.map((n) => (
                <div key={n.title} className={`lp-notif-item ${n.unread ? 'unread' : ''}`}>
                  <span className="lp-notif-dot" />
                  <div className="lp-notif-body">
                    <div className="lp-notif-row">
                      <span className="lp-notif-item-title">{n.title}</span>
                      <span className="lp-muted">{n.time}</span>
                    </div>
                    <span className="lp-notif-msg">{n.msg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-notif-popup">
            <div className="lp-popup-head">
              <strong className="lp-popup-title">Notifications</strong>
              <span className="lp-popup-markall">Mark all read</span>
            </div>
            <div className="lp-popup-list">
              {popupItems.map((n) => (
                <div key={n.title} className={`lp-popup-item ${n.unread ? 'unread' : ''}`}>
                  <span className="lp-notif-dot" />
                  <div className="lp-notif-body">
                    <span className="lp-popup-item-title">{n.title}</span>
                    <span className="lp-popup-item-time">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="lp-popup-foot">View all →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PreviewFrame, DashboardPreview, DepartmentsPreview, SettingsPreview, NotificationsPreview };
