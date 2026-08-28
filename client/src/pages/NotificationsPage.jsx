import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { api, getCached, setCached } from '../lib/api';
import Topbar from '../layouts/Topbar';
import { timeAgo, formatDateTime } from '../lib/time';
import './NotificationsPage.css';

const NOTIF_PATH = '/notifications?limit=100';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { query } = useSearch();
  const [notifications, setNotifications] = useState(() => getCached(NOTIF_PATH) || []);
  const [loading, setLoading] = useState(() => !getCached(NOTIF_PATH));
  const [error, setError] = useState(null);

  const isDept = user?.role === 'department_head';

  const load = useCallback(async () => {
    try {
      const d = await api(NOTIF_PATH);
      setCached(NOTIF_PATH, d.notifications || []);
      setNotifications(d.notifications || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolveLink = (link) => {
    if (!link) return isDept ? '/app/dashboard' : '/dashboard';
    if (isDept && link.startsWith('/') && !link.startsWith('/app')) return `/app${link}`;
    return link;
  };

  const open = async (n) => {
    if (!n.read) {
      try {
        await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
      } catch {
        /* ignore */
      }
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) navigate(resolveLink(n.link));
  };

  const markAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
    } catch {
      /* ignore */
    }
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const clearAll = async () => {
    try {
      await api('/notifications', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const q = query.trim().toLowerCase();
  const filteredNotifs = q
    ? notifications.filter((n) =>
        [n.title, n.message].some((v) => v && String(v).toLowerCase().includes(q)),
      )
    : notifications;

  return (
    <>
      <Topbar title="Notifications" subtitle="Activity across your organization" />
      <div className="admin-content">
        <div className="notif-page-head">
          <div>
            <h2 className="notif-page-title">Notifications</h2>
            <span className="notif-page-meta">{unreadCount} unread</span>
          </div>
          {notifications.length > 0 && (
            <div className="notif-page-actions">
              {unreadCount > 0 && (
                <button className="notif-page-markall" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              <button className="notif-page-markall notif-page-clear" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {!loading && error && <div className="data-state">⚠ {error}</div>}

        {loading ? (
          <div className="data-state" style={{ padding: '40px 0' }}>Loading…</div>
        ) : filteredNotifs.length === 0 ? (
          <div className="data-state" style={{ padding: '40px 0' }}>{q ? `No notifications match "${query}".` : 'No notifications yet.'}</div>
        ) : (
          <div className="notif-page-list">
            {filteredNotifs.map((n) => (
              <button
                key={n.id}
                className={`notif-page-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => open(n)}
              >
                <span className="notif-page-dot" />
                <span className="notif-page-body">
                  <span className="notif-page-row">
                    <span className="notif-page-item-title">{n.title}</span>
                    <span className="notif-page-time">{timeAgo(n.created_at)}</span>
                  </span>
                  {n.message && <span className="notif-page-msg">{n.message}</span>}
                  <span className="notif-page-fulltime">{formatDateTime(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
