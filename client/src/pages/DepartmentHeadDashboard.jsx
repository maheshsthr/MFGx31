import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../layouts/Topbar';
import { api, getCached, setCached } from '../lib/api';
import { SkeletonStatCards, SkeletonList, Skeleton } from '../components/Skeletons';
import './DashboardPage.css';

export default function DepartmentHeadDashboard() {
  const [dept, setDept] = useState(() => (getCached('/departments') || [])[0] || null);
  const [employees, setEmployees] = useState(() => getCached('/employees') || []);
  const [machinery, setMachinery] = useState(() => getCached('/machinery') || []);
  const [resources, setResources] = useState(() => getCached('/resources') || []);
  const [transfers, setTransfers] = useState(() => getCached('/transfers') || []);
  const [loading, setLoading] = useState(() => !getCached('/departments'));
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [d, em, m, r, tr] = await Promise.all([
          api('/departments'),
          api('/employees'),
          api('/machinery'),
          api('/resources'),
          api('/transfers'),
        ]);
        const myDept = (d && d[0]) || null;
        setCached('/departments', d || []);
        setCached('/employees', em || []);
        setCached('/machinery', m || []);
        setCached('/resources', r || []);
        setCached('/transfers', tr || []);
        setDept(myDept);
        setEmployees(em || []);
        setMachinery(m || []);
        setResources(r || []);
        setTransfers(tr || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const inMaintenance = machinery.filter((m) => m.status === 'maintenance').length;
  const totalUnits = resources.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  const stats = [
    { label: 'Employees', value: activeEmployees, trend: `${employees.length} total`, positive: true, dark: true },
    { label: 'Machinery', value: machinery.length, trend: `${inMaintenance} in maintenance`, positive: false, dark: false },
    { label: 'Resources', value: totalUnits.toLocaleString(), trend: 'total units', positive: true, dark: false },
    { label: 'Transfers', value: transfers.length, trend: 'all time', positive: true, dark: false },
  ];

  const recentTransfers = transfers.slice(0, 4);

  return (
    <>
      <Topbar title subtitle="Manage your department's people, machines, and materials." />
      <div className="admin-content">
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        {loading ? (
          <div className="dept-hero-head"><Skeleton width={200} height={28} round={8} /></div>
        ) : dept ? (
          <div className="dept-hero-head">
            <h1 className="dept-hero-name">{dept.name}</h1>
            <p className="dept-hero-desc">{dept.description}</p>
          </div>
        ) : null}

        {loading ? (
          <SkeletonStatCards count={4} />
        ) : (
          <div className="dash-stats anim-stagger">
            {stats.map((s, i) => (
              <div key={i} className={`dash-stat-card hover-lift ${s.dark ? 'dark' : ''}`}>
                <span className="dash-stat-label">{s.label}</span>
                <span className="dash-stat-value stat-value-animate">{s.value}</span>
                <span className={`dash-stat-trend ${s.positive ? 'positive' : 'negative'}`}>
                  {s.positive ? '▲' : '▼'} {s.trend}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="dash-grid">
          {loading ? (
            <SkeletonList items={5} />
          ) : (
            <div className="dash-rank-card hover-lift">
              <div className="dash-card-header">
                <h3>Your Team</h3>
              </div>
              <div className="dash-rank-list">
                {employees.slice(0, 6).map((e) => (
                  <div key={e.id} className="dash-rank-item">
                    <div className="dash-rank-left">
                      <span className="dash-rank-num">{e.name.charAt(0)}</span>
                      <div>
                        <span className="dash-rank-name">{e.name}</span>
                        <span className="dash-rank-sub">{e.designation || '—'}</span>
                      </div>
                    </div>
                    <span className="dash-rank-value">{e.status}</span>
                  </div>
                ))}
                {employees.length === 0 && <div className="data-state" style={{ padding: '24px 8px' }}>No employees yet.</div>}
              </div>
            </div>
          )}

          {loading ? (
            <SkeletonList items={5} />
          ) : (
            <div className="dash-rank-card hover-lift">
              <div className="dash-card-header">
                <h3>Machinery Status</h3>
              </div>
              <div className="dash-rank-list">
                {machinery.slice(0, 6).map((m) => (
                  <div key={m.id} className="dash-rank-item">
                    <div className="dash-rank-left">
                      <span className="dash-rank-num">⚙</span>
                      <div>
                        <span className="dash-rank-name">{m.name}</span>
                        <span className="dash-rank-sub">{m.type || '—'}</span>
                      </div>
                    </div>
                    <span className="dash-rank-value">{m.status}</span>
                  </div>
                ))}
                {machinery.length === 0 && <div className="data-state" style={{ padding: '24px 8px' }}>No machinery yet.</div>}
              </div>
            </div>
          )}
        </div>

        <div className="dash-grid-bottom">
          {loading ? (
            <div className="dash-chart-card"><Skeleton height={180} round={12} /></div>
          ) : (
            <div className="dash-recent-card hover-lift">
              <div className="dash-card-header">
                <h3>Recent Transfers</h3>
                <Link to="/app/transfers" className="dash-card-link">View all →</Link>
              </div>
              <div className="dash-transfer-list">
                {recentTransfers.map((t) => (
                  <div key={t.id} className="dash-transfer-item">
                    <div className="dash-transfer-icon">{t.item_type === 'employee' ? '◈' : t.item_type === 'machinery' ? '⚙' : '▦'}</div>
                    <div className="dash-transfer-info">
                      <span className="dash-transfer-name">{t.item_name}</span>
                      <span className="dash-transfer-route">{t.from_name} → {t.to_name}</span>
                    </div>
                    <span className="dash-transfer-date">
                      {new Date(t.transferred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
                {recentTransfers.length === 0 && <div className="data-state" style={{ padding: '24px 8px' }}>No transfers yet.</div>}
              </div>
            </div>
          )}

          <div className="dash-upcoming-card hover-lift">
            <div className="dash-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="dept-quick-grid">
              <Link to="/app/employees" className="dept-quick-link">Employees</Link>
              <Link to="/app/machinery" className="dept-quick-link">Machinery</Link>
              <Link to="/app/resources" className="dept-quick-link">Resources</Link>
              <Link to="/app/transfers" className="dept-quick-link">New Transfer</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
