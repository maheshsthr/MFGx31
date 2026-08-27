import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Topbar from '../layouts/Topbar';
import { useAuth } from '../context/AuthContext';
import {
  DUMMY_DEPARTMENTS,
  DUMMY_EMPLOYEES,
  DUMMY_MACHINERY,
  DUMMY_RESOURCES,
  DUMMY_TRANSFERS,
  CHART_DATA,
} from '../data/dummyData';
import './DashboardPage.css';

const stats = [
  {
    label: 'Total Employees',
    value: DUMMY_EMPLOYEES.filter((e) => e.status === 'active').length,
    trend: '+2 this month',
    positive: true,
    dark: true,
  },
  {
    label: 'Departments',
    value: DUMMY_DEPARTMENTS.length,
    trend: 'All active',
    positive: true,
    dark: false,
  },
  {
    label: 'Machinery',
    value: DUMMY_MACHINERY.length,
    trend: `${DUMMY_MACHINERY.filter((m) => m.status === 'maintenance').length} in maintenance`,
    positive: false,
    dark: false,
  },
  {
    label: 'Resources',
    value: DUMMY_RESOURCES.reduce((sum, r) => sum + r.quantity, 0).toLocaleString(),
    trend: '+12% from last month',
    positive: true,
    dark: false,
  },
];

const deptHeadcount = DUMMY_DEPARTMENTS.map((d) => ({
  ...d,
  headcount: DUMMY_EMPLOYEES.filter((e) => e.department_id === d.id && e.status === 'active').length,
  machineCount: DUMMY_MACHINERY.filter((m) => m.department_id === d.id).length,
})).sort((a, b) => b.headcount - a.headcount);

const recentTransfers = DUMMY_TRANSFERS.slice(0, 4);

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
  const { user } = useAuth();

  return (
    <>
      <Topbar
        title
        subtitle={`Here's what's happening at your organization today.`}
      />
      <div className="admin-content">
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

        <div className="dash-grid">
          <div className="dash-chart-card hover-lift">
            <div className="dash-card-header">
              <h3>Overview</h3>
              <span className="dash-card-period">Jan — Aug 2026</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
        </div>

        <div className="dash-grid-bottom">
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
            </div>
          </div>

          <div className="dash-upcoming-card hover-lift">
            <div className="dash-card-header">
              <h3>Upcoming Events</h3>
            </div>
            <div className="dash-event-list">
              {[
                { title: 'New QC Protocol Training', date: 'Aug 28', dept: 'Quality Control' },
                { title: 'Furnace Maintenance Shutdown', date: 'Sep 5', dept: 'Copper Plant' },
                { title: 'Rolling Mill Calibration', date: 'Sep 10', dept: 'Rolling Sheet Mill' },
                { title: 'Annual Safety Audit', date: 'Sep 15', dept: 'All Departments' },
              ].map((ev, i) => (
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
