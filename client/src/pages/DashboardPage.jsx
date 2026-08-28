import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Topbar from '../layouts/Topbar';
import { api, getCached, setCached } from '../lib/api';
import { SkeletonStatCards, SkeletonList, Skeleton } from '../components/Skeletons';
import './DashboardPage.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="chart-tooltip-value">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [departments, setDepartments] = useState(() => getCached('/departments') || []);
  const [employees, setEmployees] = useState(() => getCached('/employees') || []);
  const [machinery, setMachinery] = useState(() => getCached('/machinery') || []);
  const [resources, setResources] = useState(() => getCached('/resources') || []);
  const [transfers, setTransfers] = useState(() => getCached('/transfers') || []);
  const [events, setEvents] = useState(() => getCached('/events') || []);
  const [loading, setLoading] = useState(() => !getCached('/departments'));
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [d, em, m, r, tr, ev] = await Promise.all([
          api('/departments'),
          api('/employees'),
          api('/machinery'),
          api('/resources'),
          api('/transfers'),
          api('/events'),
        ]);
        setCached('/departments', d || []);
        setCached('/employees', em || []);
        setCached('/machinery', m || []);
        setCached('/resources', r || []);
        setCached('/transfers', tr || []);
        setCached('/events', ev || []);
        setDepartments(d || []);
        setEmployees(em || []);
        setMachinery(m || []);
        setResources(r || []);
        setTransfers(tr || []);
        setEvents(ev || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    { label: 'Total Employees', value: employees.filter((e) => e.status === 'active').length, trend: 'active', positive: true, dark: true },
    { label: 'Departments', value: departments.length, trend: 'All active', positive: true, dark: false },
    { label: 'Machinery', value: machinery.length, trend: `${machinery.filter((m) => m.status === 'maintenance').length} in maintenance`, positive: false, dark: false },
    { label: 'Resources', value: resources.reduce((s, r) => s + (Number(r.quantity) || 0), 0).toLocaleString(), trend: 'total units', positive: true, dark: false },
  ];

  const deptData = departments.map((d) => ({
    ...d,
    headcount: employees.filter((e) => e.department_id === d.id && e.status === 'active').length,
    machineCount: machinery.filter((m) => m.department_id === d.id).length,
  }));
  const deptHeadcount = [...deptData].sort((a, b) => b.headcount - a.headcount);
  const chartData = deptData.map((d) => ({
    month: d.name,
    employees: d.headcount,
    machinery: d.machineCount,
    resources: resources.filter((r) => r.department_id === d.id).length,
  }));
  const recentTransfers = transfers.slice(0, 4);
  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 4)
    .map((ev) => ({
      title: ev.title,
      date: new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            dept: ev.department_id ? (departments.find((d) => d.id === ev.department_id)?.name || 'Department') : 'All',
    }));

  return (
    <>
      <Topbar
        title
        subtitle={`Here's what's happening at your organization today.`}
      />
      <div className="admin-content">
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
            <div className="dash-chart-card"><Skeleton height={260} round={12} /></div>
          ) : (
            <div className="dash-chart-card hover-lift">
              <div className="dash-card-header">
                <h3>Overview</h3>
                <span className="dash-card-period">Jan — Aug 2026</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBlack" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F0F0F" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#0F0F0F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="employees" name="Employees" stroke="#0F0F0F" strokeWidth={2} fill="url(#gradBlack)" />
                  <Area type="monotone" dataKey="machinery" name="Machinery" stroke="#8A8A8A" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {loading ? (
            <SkeletonList items={5} />
          ) : (
            <div className="dash-rank-card hover-lift">
              <div className="dash-card-header">
                <h3>Departments by Headcount</h3>
              </div>
              <div className="dash-rank-list">
                {deptHeadcount.map((d, i) => (
                  <Link to={`/departments/${d.id}`} key={d.id} className="dash-rank-item">
                    <div className="dash-rank-left">
                      <span className="dash-rank-num">{i + 1}</span>
                      <div>
                        <span className="dash-rank-name">{d.name}</span>
                        <span className="dash-rank-sub">{d.machineCount} machines</span>
                      </div>
                    </div>
                    <span className="dash-rank-value">{d.headcount} emp.</span>
                  </Link>
                ))}
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
                <Link to="/transfers" className="dash-card-link">View all →</Link>
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
                {recentTransfers.length === 0 && (
                  <div className="dash-empty">No transfers yet.</div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="dash-chart-card"><Skeleton height={180} round={12} /></div>
          ) : (
            <div className="dash-upcoming-card hover-lift">
              <div className="dash-card-header">
                <h3>Upcoming Events</h3>
              </div>
              <div className="dash-event-list">
                            {upcomingEvents.map((ev, i) => (
                <div key={i} className="dash-event-item">
                  <div className="dash-event-date-block">
                    <span className="dash-event-day">{ev.date.split(' ')[1]}</span>
                    <span className="dash-event-month">{ev.date.split(' ')[0]}</span>
                  </div>
                  <div className="dash-event-info">
                    <span className="dash-event-title">{ev.title}</span>
                    <span className="dash-event-dept">{ev.dept}</span>
                  </div>
                </div>
              ))}
                {upcomingEvents.length === 0 && (
                  <div className="dash-empty">No events yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
