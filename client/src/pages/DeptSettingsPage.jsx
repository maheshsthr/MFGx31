import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Topbar from '../layouts/Topbar';
import ConfirmDialog from '../components/ConfirmDialog';
import './SettingsPage.css';

export default function DeptSettingsPage() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  function handleLogout() {
    setConfirmLogout(true);
  }

  async function doLogout() {
    setConfirmLogout(false);
    await logout();
    navigate('/');
  }

  return (
    <div className="admin-content">
      <Topbar title subtitle="Your profile and account." />
      <div className="settings">
        <div className="settings-section anim-slide-up">
          <div className="settings-section-header">
            <div>
              <h2 className="settings-section-title">Profile</h2>
              <p className="settings-section-desc">
                {organization?.name || ''} — {user?.full_name} · {user?.role === 'admin' ? 'Admin' : 'Department Head'}
              </p>
            </div>
          </div>
          <div className="settings-edit-panel reveal revealed" style={{ border: 'none', padding: '4px 0' }}>
            <div className="settings-field">
              <label>Name</label>
              <input value={user?.full_name || ''} readOnly />
            </div>
            <div className="settings-field">
              <label>Email</label>
              <input value={user?.email || ''} readOnly />
            </div>
          </div>
        </div>

        <div className="settings-section settings-danger anim-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="settings-section-header">
            <div>
              <h2 className="settings-section-title danger">Account</h2>
              <p className="settings-section-desc">Sign out of your department account.</p>
            </div>
          </div>
          <div className="settings-danger-grid">
            <div className="settings-danger-item">
              <div>
                <h3>Log Out</h3>
                <p>End your session. You will need your allotted credentials to log back in.</p>
              </div>
              <button className="settings-danger-btn outline press-effect" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
        <ConfirmDialog
          open={confirmLogout}
          title="Sign out?"
          message="Are you sure you want to leave? You'll need to log in again."
          confirmLabel="Sign out"
          danger
          onConfirm={doLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      </div>
    </div>
  );
}
