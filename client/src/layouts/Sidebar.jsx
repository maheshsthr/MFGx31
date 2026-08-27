import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from '../components/Brand';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: '◈' },
  { label: 'Departments', path: '/departments', icon: '⬡' },
  { label: 'Transfers', path: '/transfers', icon: '⇄' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar-brand">
        <Brand size={30} round={8} light textSize={1.1} />
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">✕</button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
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
            <span className="sidebar-user-role">{user?.role === 'admin' ? 'Admin' : 'Dept. Head'}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
          ⏻
        </button>
      </div>
    </aside>
  );
}
