import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
  const { user, organization } = useAuth();
  const [departmentName, setDepartmentName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (user?.role === 'department_head' && user?.department_id) {
      api(`/departments/${user.department_id}`)
        .then((d) => { if (!cancelled) setDepartmentName(d?.name || null); })
        .catch(() => { if (!cancelled) setDepartmentName(null); });
    }
    return () => { cancelled = true; };
  }, [user?.role, user?.department_id]);

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
