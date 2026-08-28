import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { timeAgo } from '../lib/time';
import BellIcon from './BellIcon';
import './NotificationBell.css';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  const isDept = user?.role === 'department_head';

  const loadUnread = useCallback(async () => {
    try {
      const d = await api('/notifications/unread-count');
      setUnread(d.count || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const d = await api('/notifications?limit=8');
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count so the badge stays fresh without a page refresh.
  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 20000);
    return () => clearInterval(t);
  }, [loadUnread]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = () => {
    if (!open) loadList();
    setOpen((o) => !o);
  };

  const resolveLink = (link) => {
    if (!link) return isDept ? '/app/dashboard' : '/dashboard';
    if (isDept && link.startsWith('/') && !link.startsWith('/app')) return `/app${link}`;
    return link;
  };

  const markRead = async (n) => {
    try {
      await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
    } catch {
      /* ignore */
    }
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
    } catch {
      /* ignore */
    }
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const clearAll = async () => {
    try {
      await api('/notifications', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    setNotifications([]);
    setUnread(0);
  };

  const openFromList = (n) => {
    markRead(n);
    setOpen(false);
    navigate(resolveLink(n.link));
  };

  const openAll = () => {
    setOpen(false);
    navigate(isDept ? '/app/notifications' : '/notifications');
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button className="topbar-bell notif-bell-btn" onClick={toggle} title="Notifications" aria-label="Notifications">
        <BellIcon />
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Notifications</span>
            {notifications.length > 0 && (
              <div className="notif-panel-actions">
                {unread > 0 && (
                  <button className="notif-readall" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                <button className="notif-clearall" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => openFromList(n)}
                >
                  <span className="notif-dot" />
                  <span className="notif-item-body">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-msg">{n.message}</span>
                    <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="notif-panel-foot">
            <button className="notif-viewall" onClick={openAll}>
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
