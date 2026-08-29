import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { timeAgo } from '../lib/time';
import BellIcon from './BellIcon';
import './NotificationToasts.css';

export default function NotificationToasts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [closing, setClosing] = useState([]);

  const isDept = user?.role === 'department_head';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api('/notifications?limit=100');
        if (cancelled) return;
        setToasts((d.notifications || []).filter((n) => !n.read));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveLink = (link) => {
    if (!link) return isDept ? '/app/dashboard' : '/dashboard';
    if (isDept && link.startsWith('/') && !link.startsWith('/app')) return `/app${link}`;
    return link;
  };

  // Closing a toast only hides the transient popup — the notification stays
  // available (unread) in the bell popup/notification page.
  const dismiss = (id) => {
    setClosing((prev) => [...prev, id]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setClosing((prev) => prev.filter((c) => c !== id));
    }, 280);
  };

  const open = async (n) => {
    if (!n.read) {
      try {
        await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
      } catch {
        /* ignore */
      }
    }
    navigate(resolveLink(n.link));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="notif-toasts" role="region" aria-label="Notifications">
      {toasts.map((n) => (
        <div
          key={n.id}
          className={`notif-toast ${closing.includes(n.id) ? 'closing' : ''}`}
        >
          <span className="notif-toast-icon"><BellIcon size={15} /></span>
          <button type="button" className="notif-toast-body" onClick={() => open(n)}>
            <span className="notif-toast-title">{n.title}</span>
            {n.message && <span className="notif-toast-msg">{n.message}</span>}
            <span className="notif-toast-time">{timeAgo(n.created_at)}</span>
          </button>
          <button
            type="button"
            className="notif-toast-close"
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss notification"
            title="Move to notification popup"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}