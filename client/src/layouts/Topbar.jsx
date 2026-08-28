import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { api } from '../lib/api';
import NotificationBell from '../components/NotificationBell';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
  const { user, organization } = useAuth();
  const { query, setQuery } = useSearch();
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
          <svg className="topbar-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this page..."
            className="topbar-search-input"
          />
          {query && (
            <button className="topbar-search-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
