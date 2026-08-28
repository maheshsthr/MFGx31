import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import ConfirmDialog from '../components/ConfirmDialog';
import BellIcon from '../components/BellIcon';
import './Sidebar.css';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: '◈' },
  { label: 'Departments', path: '/departments', icon: '⬡' },
  { label: 'Transfers', path: '/transfers', icon: '⇄' },
  { label: 'Notifications', path: '/notifications', icon: 'bell' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

const DEPT_HEAD_NAV_ITEMS = [
  { label: 'My Department', path: '/app/dashboard', icon: '◈' },
  { label: 'Employees', path: '/app/employees', icon: '◉' },
  { label: 'Machinery', path: '/app/machinery', icon: '⚙' },
  { label: 'Resources', path: '/app/resources', icon: '▦' },
  { label: 'Transfers', path: '/app/transfers', icon: '⇄' },
  { label: 'Notifications', path: '/app/notifications', icon: 'bell' },
  { label: 'Settings', path: '/app/settings', icon: '⚙' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : DEPT_HEAD_NAV_ITEMS;

  const handleLogoutClick = () => setConfirmLogout(true);

  const handleLogout = async () => {
    setConfirmLogout(false);
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar-brand">
        <Brand size={30} round={8} light textSize={1.1} />
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">✕</button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">
              {item.icon === 'bell' ? <BellIcon size={17} className="sidebar-bell-icon" /> : item.icon}
            </span>
            <span className="sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.full_name?.charAt(0)}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.full_name}</span>
            <span className="sidebar-user-role">{isAdmin ? 'Admin' : 'Dept. Head'}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogoutClick} title="Sign out">
          ⏻
        </button>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to leave? You'll need to log in again."
        confirmLabel="Sign out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </aside>
  );
}
