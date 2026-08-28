import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { useSearch } from '../context/SearchContext';
import { api, getCached, setCached } from '../lib/api';
import { SkeletonText } from '../components/Skeletons';
import ConfirmDialog from '../components/ConfirmDialog';
import './DepartmentsPage.css';

function buildDepartments(depts, employees, machinery) {
  return (depts || []).map((d) => ({
    ...d,
    employeeCount: (employees || []).filter((e) => e.department_id === d.id).length,
    machineCount: (machinery || []).filter((m) => m.department_id === d.id).length,
  }));
}

export default function DepartmentsPage() {
  const { query } = useSearch();
  const [showModal, setShowModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', address: '', head_name: '', head_email: '', head_password: '' });
  const [departments, setDepartments] = useState(() =>
    buildDepartments(getCached('/departments'), getCached('/employees'), getCached('/machinery')));
  const [loading, setLoading] = useState(() => !getCached('/departments'));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  async function load() {
    setError('');
    try {
      const [depts, employees, machinery] = await Promise.all([
        api('/departments'),
        api('/employees'),
        api('/machinery'),
      ]);
      setCached('/departments', depts || []);
      setCached('/employees', employees || []);
      setCached('/machinery', machinery || []);
      setDepartments(buildDepartments(depts, employees, machinery));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: newDept.name, description: newDept.description, address: newDept.address };
      if (newDept.head_email) {
        payload.head_name = newDept.head_name;
        payload.head_email = newDept.head_email;
        payload.head_password = newDept.head_password;
      }
      await api('/departments', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setNewDept({ name: '', description: '', address: '', head_name: '', head_email: '', head_password: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalEmployees = departments.reduce((s, d) => s + (d.employeeCount || 0), 0);

  const q = query.trim().toLowerCase();
  const filteredDepartments = q
    ? departments.filter((d) =>
        [d.name, d.description, d.address].some((v) => v && String(v).toLowerCase().includes(q)),
      )
    : departments;

  function handleEditClick(e, d) {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setEditing({ id: d.id, name: d.name, description: d.description || '', address: d.address || '' });
  }

  function handleDeleteClick(e, d) {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setDeleting(d);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await api(`/departments/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editing.name, description: editing.description, address: editing.address }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteSaving(true);
    setError('');
    try {
      await api(`/departments/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <>
      <Topbar title subtitle="Manage your organization's departments" />
      <div className="admin-content">
        <div className="dept-page-header">
          <div className="dept-page-stats">
            <span className="dept-page-stat">{departments.length} Departments</span>
            <span className="dept-page-stat-dot">·</span>
            <span className="dept-page-stat">{totalEmployees} Total Employees</span>
          </div>
          <button className="dept-page-add" onClick={() => setShowModal(true)}>
            + Add Department
          </button>
        </div>

        {loading && (
          <div className="dept-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="dept-card" key={i}>
                <div className="dept-card-top">
                  <SkeletonText width="100%" height={40} lines={1} />
                </div>
                <SkeletonText lines={1} width="70%" height={16} />
              </div>
            ))}
          </div>
        )}
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        <div className="dept-grid anim-stagger">
          {!loading && filteredDepartments.length === 0 && (
            <div className="data-state" style={{ gridColumn: '1 / -1' }}>No departments match "{query}".</div>
          )}
          {!loading && filteredDepartments.map((d) => (
            <Link to={`/departments/${d.id}`} key={d.id} className="dept-card hover-lift">
              <div className="dept-card-actions">
                <button className="dept-card-action" title="Edit" onClick={(e) => handleEditClick(e, d)}>✎</button>
                <button className="dept-card-action danger" title="Delete" onClick={(e) => handleDeleteClick(e, d)}>🗑</button>
              </div>
              <div className="dept-card-top">
                <div className="dept-card-icon">⬡</div>
                {d.head && <span className="dept-card-badge">Has Head</span>}
              </div>
              <h3 className="dept-card-name">{d.name}</h3>
              <p className="dept-card-desc">{d.description}</p>
              {d.address && <p className="dept-card-address">📍 {d.address}</p>}
              <div className="dept-card-footer">
                <span className="dept-card-metric">
                  <span className="dept-card-metric-value">{d.employeeCount || 0}</span> employees
                </span>
                <span className="dept-card-metric">
                  <span className="dept-card-metric-value">{d.machineCount || 0}</span> machines
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/*__MODAL__*/}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add New Department</h2>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-field">
                  <label>Department Name</label>
                  <input
                    type="text"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    placeholder="e.g. Painting Unit"
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Description</label>
                  <textarea
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                    placeholder="Brief description of this department"
                    rows={3}
                  />
                </div>
                <div className="modal-field">
                  <label>Address</label>
                  <textarea
                    value={newDept.address}
                    onChange={(e) => setNewDept({ ...newDept, address: e.target.value })}
                    placeholder="Location / address of this department"
                    rows={2}
                  />
                </div>
                <p className="modal-hint">Optional: provision a department-head login</p>
                <div className="modal-field">
                  <label>Head Name</label>
                  <input
                    type="text"
                    value={newDept.head_name}
                    onChange={(e) => setNewDept({ ...newDept, head_name: e.target.value })}
                    placeholder="Department head name"
                  />
                </div>
                <div className="modal-field">
                  <label>Head Email</label>
                  <input
                    type="email"
                    value={newDept.head_email}
                    onChange={(e) => setNewDept({ ...newDept, head_email: e.target.value })}
                    placeholder="head@company.com"
                  />
                </div>
                <div className="modal-field">
                  <label>Head Password</label>
                  <input
                    type="password"
                    value={newDept.head_password}
                    onChange={(e) => setNewDept({ ...newDept, head_password: e.target.value })}
                    placeholder="min 6 characters"
                  />
                </div>
                {saving && <div className="data-state" style={{ padding: '8px' }}>Creating…</div>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={saving}>Create Department</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*__EDIT MODAL__*/}
        {editing && (
          <div className="modal-overlay" onClick={() => setEditing(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Edit Department</h2>
              <form onSubmit={handleEditSubmit} className="modal-form">
                <div className="modal-field">
                  <label>Department Name</label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Description</label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="modal-field">
                  <label>Address</label>
                  <textarea
                    value={editing.address}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    rows={2}
                  />
                </div>
                {error && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleting}
          title={`Delete ${deleting ? deleting.name : ''}?`}
          message="This will permanently delete the department. Any employees, machinery, or resources in it will remain but become unassigned."
          confirmLabel={deleteSaving ? 'Deleting…' : 'Delete'}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleting(null)}
        />
      </div>
    </>
  );
}
