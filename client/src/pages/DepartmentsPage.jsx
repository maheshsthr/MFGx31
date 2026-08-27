import { Link } from 'react-router-dom';
import { useState } from 'react';
import Topbar from '../layouts/Topbar';
import { DUMMY_DEPARTMENTS, DUMMY_EMPLOYEES, DUMMY_MACHINERY } from '../data/dummyData';
import './DepartmentsPage.css';

export default function DepartmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  const departments = DUMMY_DEPARTMENTS.map((d) => ({
    ...d,
    employeeCount: DUMMY_EMPLOYEES.filter((e) => e.department_id === d.id && e.status === 'active').length,
    machineCount: DUMMY_MACHINERY.filter((m) => m.department_id === d.id).length,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Would create department: ${newDept.name}\n(Dummy mode — not saved)`);
    setShowModal(false);
    setNewDept({ name: '', description: '' });
  };

  return (
    <>
      <Topbar title subtitle="Manage your organization's departments" />
      <div className="admin-content">
        <div className="dept-page-header">
          <div className="dept-page-stats">
            <span className="dept-page-stat">{departments.length} Departments</span>
            <span className="dept-page-stat-dot">·</span>
            <span className="dept-page-stat">{departments.reduce((s, d) => s + d.employeeCount, 0)} Total Employees</span>
          </div>
          <button className="dept-page-add" onClick={() => setShowModal(true)}>
            + Add Department
          </button>
        </div>

        <div className="dept-grid anim-stagger">
          {departments.map((d) => (
            <Link to={`/departments/${d.id}`} key={d.id} className="dept-card hover-lift">
              <div className="dept-card-top">
                <div className="dept-card-icon">⬡</div>
                {d.head_profile_id && <span className="dept-card-badge">Has Head</span>}
              </div>
              <h3 className="dept-card-name">{d.name}</h3>
              <p className="dept-card-desc">{d.description}</p>
              <div className="dept-card-footer">
                <span className="dept-card-metric">
                  <span className="dept-card-metric-value">{d.employeeCount}</span> employees
                </span>
                <span className="dept-card-metric">
                  <span className="dept-card-metric-value">{d.machineCount}</span> machines
                </span>
              </div>
            </Link>
          ))}
        </div>

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
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary">Create Department</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
