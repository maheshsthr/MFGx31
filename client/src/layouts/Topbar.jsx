import { useAuth } from '../context/AuthContext';
import { DUMMY_DEPARTMENTS } from '../data/dummyData';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
  const { user, organization } = useAuth();

  const isDeptHead = user?.role === 'department_head';
  const departmentName = isDeptHead
    ? DUMMY_DEPARTMENTS.find((d) => d.id === user.department_id)?.name
    : null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        {title && (
          <div className="topbar-heading">
            <h1 className="topbar-title">
              Welcome, {organization?.name}
              {departmentName ? <span className="topbar-title-sep"> | </span> : null}
              {departmentName}
            </h1>
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <span className="topbar-search-icon">⌕</span>
          <input type="text" placeholder="Search..." className="topbar-search-input" />
        </div>
        <button className="topbar-bell" title="Notifications">
          <span>🔔</span>
          <span className="topbar-bell-dot"></span>
        </button>
      </div>
    </header>
  );
}
