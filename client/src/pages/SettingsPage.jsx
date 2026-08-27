import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';

const PARTNER_BLANK = { name: '', email: '', role: '', ownership_share: 50 };

const OWNERS = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@metalworks.in', role: 'Owner / Managing Director', ownership_share: 55 },
  { id: 2, name: 'Priya Sharma', email: 'priya@metalworks.in', role: 'Partner / Director', ownership_share: 45 },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileRole, setProfileRole] = useState(user?.role || '');

  const [showOwnership, setShowOwnership] = useState(false);
  const [owners, setOwners] = useState(OWNERS);

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', role: '', ownership_share: 50 });

  const [showDangerModal, setShowDangerModal] = useState(false);

  function openAddPartner() {
    setEditingPartner(null);
    setPartnerForm({ ...PARTNER_BLANK });
    setShowPartnerModal(true);
  }

  function openEditPartner(owner) {
    setEditingPartner(owner.id);
    setPartnerForm({ name: owner.name, email: owner.email, role: owner.role, ownership_share: owner.ownership_share });
    setShowPartnerModal(true);
  }

  function savePartner(e) {
    e.preventDefault();
    if (editingPartner) {
      setOwners(owners.map(o => o.id === editingPartner ? { ...o, ...partnerForm } : o));
    } else {
      setOwners([...owners, { ...partnerForm, id: Date.now() }]);
    }
    setShowPartnerModal(false);
  }

  function removePartner(id) {
    setOwners(owners.filter(o => o.id !== id));
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const totalShare = owners.reduce((s, o) => s + o.ownership_share, 0);

  return (
    <div className="admin-content">
    <div className="settings">
      {/* Header */}
      <div className="settings-header anim-fade-in">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your organization, profile, and preferences.</p>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section anim-slide-up">
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-desc">{user?.name} — {user?.role}</p>
          </div>
          <button
            className="settings-edit-btn press-effect"
            onClick={() => { setShowProfile(!showProfile); setProfileName(user?.name || ''); setProfileRole(user?.role || ''); }}
          >
            {showProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        {showProfile && (
          <div className="settings-edit-panel reveal revealed">
            <div className="settings-field">
              <label>Name</label>
              <input value={profileName} onChange={e => setProfileName(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Role</label>
              <input value={profileRole} onChange={e => setProfileRole(e.target.value)} />
            </div>
            <button className="settings-save-btn press-effect">Save Changes</button>
          </div>
        )}
      </div>

      {/* Danger Zone — Ownership editing button */}
      <div className="settings-section settings-danger anim-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title danger">Danger Zone</h2>
            <p className="settings-section-desc">Irreversible actions. Proceed with caution.</p>
          </div>
        </div>
        <div className="settings-danger-grid">
          <div className="settings-danger-item">
            <div>
              <h3>Edit Ownership Structure</h3>
              <p>Add, remove, or adjust partner shares and ownership details.</p>
            </div>
            <button className="settings-danger-btn outline press-effect" onClick={() => setShowOwnership(!showOwnership)}>
              {showOwnership ? 'Close' : 'Edit Ownership'}
            </button>
          </div>
          <div className="settings-danger-item">
            <div>
              <h3>Transfer Ownership</h3>
              <p>Transfer your admin and ownership to another partner.</p>
            </div>
            <button className="settings-danger-btn outline press-effect">Transfer Ownership</button>
          </div>
          <div className="settings-danger-item">
            <div>
              <h3>Delete Organization</h3>
              <p>Permanently delete this organization and all its data. This cannot be undone.</p>
            </div>
            <button className="settings-danger-btn press-effect" onClick={() => setShowDangerModal(true)}>Delete Organization</button>
          </div>
          <div className="settings-danger-item">
            <div>
              <h3>Log Out</h3>
              <p>Sign out of your account.</p>
            </div>
            <button className="settings-danger-btn outline press-effect" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        {/* Inline ownership editor inside danger zone */}
        {showOwnership && (
          <div className="settings-ownership-inline reveal revealed">
            <div className="settings-ownership-header-row">
              <div>
                <h3>Ownership Structure</h3>
                <p className="settings-section-desc">Add, remove, or adjust partner shares.</p>
              </div>
              <button className="settings-add-partner-btn press-effect" onClick={openAddPartner}>+ Add Partner</button>
            </div>

            <div className="settings-owners-grid">
              {owners.map(owner => (
                <div key={owner.id} className="settings-owner-card">
                  <div className="settings-owner-top">
                    <div className="settings-owner-avatar">{owner.name.charAt(0)}</div>
                    <div className="settings-owner-info">
                      <h4>{owner.name}</h4>
                      <span className="settings-owner-role">{owner.role}</span>
                    </div>
                  </div>
                  <div className="settings-owner-contact">
                    <span>{owner.email}</span>
                  </div>
                  <div className="settings-owner-share">
                    <div className="settings-share-bar">
                      <div className="settings-share-fill" style={{ width: `${owner.ownership_share}%` }}></div>
                    </div>
                    <span className="settings-share-label">{owner.ownership_share}% ownership</span>
                  </div>
                  <div className="settings-owner-actions">
                    <button className="settings-owner-action-btn press-effect" onClick={() => openEditPartner(owner)}>Edit</button>
                    {owners.length > 1 && (
                      <button className="settings-owner-action-btn danger press-effect" onClick={() => removePartner(owner.id)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {owners.length > 1 && (
              <div className="settings-ownership-total">
                <div className="settings-total-bar-wrap">
                  <div className="settings-total-bar">
                    {owners.map((o, i) => (
                      <div
                        key={o.id}
                        className="settings-total-segment"
                        style={{
                          width: `${o.ownership_share}%`,
                          backgroundColor: ['#0F0F0F', '#333', '#666', '#999'][i % 4],
                        }}
                      />
                    ))}
                  </div>
                  <span className="settings-total-label">Total: <strong>{totalShare}%</strong> {totalShare === 100 ? '— Perfectly balanced' : `— ${totalShare > 100 ? 'Over-allocated' : `${100 - totalShare}% unallocated`}`}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="settings-modal-overlay" onClick={() => setShowPartnerModal(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <h3>{editingPartner ? 'Edit Partner' : 'Add Partner'}</h3>
            <form onSubmit={savePartner}>
              <div className="settings-modal-row">
                <div className="settings-field">
                  <label>Name</label>
                  <input value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} required />
                </div>
                <div className="settings-field">
                  <label>Email</label>
                  <input type="email" value={partnerForm.email} onChange={e => setPartnerForm({ ...partnerForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="settings-modal-row">
                <div className="settings-field">
                  <label>Role</label>
                  <input value={partnerForm.role} onChange={e => setPartnerForm({ ...partnerForm, role: e.target.value })} placeholder="e.g. Co-owner, Director" />
                </div>
                <div className="settings-field">
                  <label>Ownership Share (%)</label>
                  <input type="number" min="1" max="99" value={partnerForm.ownership_share} onChange={e => setPartnerForm({ ...partnerForm, ownership_share: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="settings-modal-actions">
                <button type="button" className="settings-modal-cancel press-effect" onClick={() => setShowPartnerModal(false)}>Cancel</button>
                <button type="submit" className="settings-modal-save press-effect">{editingPartner ? 'Save Changes' : 'Add Partner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Org Modal */}
      {showDangerModal && (
        <div className="settings-modal-overlay" onClick={() => setShowDangerModal(false)}>
          <div className="settings-modal settings-modal-danger" onClick={e => e.stopPropagation()}>
            <h3>⚠ Delete Organization?</h3>
            <p>This action is irreversible. All data — departments, employees, machinery, transfers, and documents — will be permanently deleted.</p>
            <div className="settings-modal-actions">
              <button className="settings-modal-cancel press-effect" onClick={() => setShowDangerModal(false)}>Cancel</button>
              <button className="settings-modal-delete press-effect" onClick={() => setShowDangerModal(false)}>Permanently Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
