import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { api } from '../lib/api';
import './DepartmentsPage.css';

export default function DepartmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', head_name: '', head_email: '', head_password: '' });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [depts, employees, machinery] = await Promise.all([
        api('/departments'),
        api('/employees'),
        api('/machinery'),
      ]);
      setDepartments(
        (depts || []).map((d) => ({
          ...d,
          employeeCount: (employees || []).filter((e) => e.department_id === d.id).length,
          machineCount: (machinery || []).filter((m) => m.department_id === d.id).length,
        })),
      );
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
      const payload = { name: newDept.name, description: newDept.description };
      if (newDept.head_email) {
        payload.head_name = newDept.head_name;
        payload.head_email = newDept.head_email;
        payload.head_password = newDept.head_password;
      }
      await api('/departments', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setNewDept({ name: '', description: '', head_name: '', head_email: '', head_password: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalEmployees = departments.reduce((s, d) => s + (d.employeeCount || 0), 0);

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

        {loading && <div className="data-state">Loading departments…</div>}
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        <div className="dept-grid anim-stagger">
          {!loading && departments.map((d) => (
            <Link to={`/departments/${d.id}`} key={d.id} className="dept-card hover-lift">
              <div className="dept-card-top">
                <div className="dept-card-icon">⬡</div>
                {d.head && <span className="dept-card-badge">Has Head</span>}
              </div>
              <h3 className="dept-card-name">{d.name}</h3>
              <p className="dept-card-desc">{d.description}</p>
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
      </div>
    </>
  );
}
