import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import Topbar from '../layouts/Topbar';
import {
  DUMMY_DEPARTMENTS,
  DUMMY_EMPLOYEES,
  DUMMY_MACHINERY,
  DUMMY_RESOURCES,
  DUMMY_EVENTS,
  DUMMY_DOCUMENTS,
  DUMMY_TRANSFERS,
} from '../data/dummyData';
import './DepartmentDetailPage.css';

const TABS = ['Employees', 'Machinery', 'Resources', 'Events', 'Documents', 'Transfer History'];

function StatusBadge({ status }) {
  const map = {
    active: 'green',
    working: 'green',
    maintenance: 'amber',
    idle: 'red',
    transferred: 'amber',
    inactive: 'red',
  };
  return <span className={`status-text ${map[status] || 'muted'}`}>{status}</span>;
}

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Employees');
  const [showAddModal, setShowAddModal] = useState(false);

  const dept = DUMMY_DEPARTMENTS.find((d) => d.id === id);
  if (!dept) return <div className="admin-content"><p>Department not found.</p></div>;

  const employees = DUMMY_EMPLOYEES.filter((e) => e.department_id === id);
  const machinery = DUMMY_MACHINERY.filter((m) => m.department_id === id);
  const resources = DUMMY_RESOURCES.filter((r) => r.department_id === id);
  const events = DUMMY_EVENTS.filter((e) => e.department_id === id || e.department_id === null);
  const documents = DUMMY_DOCUMENTS.filter((d) => d.department_id === id || d.department_id === null);
  const transfers = DUMMY_TRANSFERS.filter(
    (t) => t.from_department_id === id || t.to_department_id === id
  );

  return (
    <>
      <Topbar title subtitle={dept.description} />
      <div className="admin-content">
        <div className="dept-detail-header">
          <div>
            <Link to="/departments" className="dept-detail-back">← All Departments</Link>
            <h1 className="dept-detail-name">{dept.name}</h1>
          </div>
          <button className="dept-detail-add" onClick={() => setShowAddModal(true)}>
            + Add {activeTab.slice(0, -1)}
          </button>
        </div>

        <div className="dept-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`dept-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="dept-tab-content">
          {activeTab === 'Employees' && (
            <div className="dept-table-card">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Contact</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td className="td-name">{e.name}</td>
                      <td>{e.designation}</td>
                      <td className="td-muted">{e.contact_number}</td>
                      <td className="td-muted">{new Date(e.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td><button className="td-menu">•••</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Machinery' && (
            <div className="dept-table-card">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Purchased</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {machinery.map((m) => (
                    <tr key={m.id}>
                      <td className="td-name">{m.name}</td>
                      <td>{m.type}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td className="td-muted">{new Date(m.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="td-muted">{m.notes || '—'}</td>
                      <td><button className="td-menu">•••</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Resources' && (
            <div className="dept-table-card">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Last Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id}>
                      <td className="td-name">{r.name}</td>
                      <td>{r.category}</td>
                      <td className="td-qty">{r.quantity.toLocaleString()}</td>
                      <td>{r.unit}</td>
                      <td className="td-muted">{new Date(r.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><button className="td-menu">•••</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Events' && (
            <div className="dept-events-grid">
              {events.map((ev) => (
                <div key={ev.id} className="dept-event-card">
                  <div className="dept-event-date-badge">
                    <span className="dept-event-day">{new Date(ev.event_date).getDate()}</span>
                    <span className="dept-event-month">{new Date(ev.event_date).toLocaleString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="dept-event-info">
                    <h4 className="dept-event-title">{ev.title}</h4>
                    <p className="dept-event-desc">{ev.description}</p>
                    <span className="dept-event-by">
                      {ev.department_id ? dept.name : 'Org-wide'} · by {ev.created_by_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="dept-docs-grid">
              {documents.map((doc) => (
                <div key={doc.id} className="dept-doc-card">
                  <div className="dept-doc-icon">📄</div>
                  <div className="dept-doc-info">
                    <h4 className="dept-doc-title">{doc.title}</h4>
                    <span className="dept-doc-meta">
                      {doc.department_id ? dept.name : 'Org-wide'} · Uploaded by {doc.uploaded_by_name}
                    </span>
                    <span className="dept-doc-date">
                      {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <button className="dept-doc-download">↓</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Transfer History' && (
            <div className="dept-table-card">
              <table className="dept-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Reason</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr><td colSpan={6} className="td-empty">No transfer history for this department</td></tr>
                  ) : transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="td-name">{t.item_name}</td>
                      <td><span className="td-type">{t.item_type}</span></td>
                      <td>{t.from_name}</td>
                      <td>{t.to_name}</td>
                      <td className="td-muted td-reason">{t.reason}</td>
                      <td className="td-muted">{new Date(t.transferred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add New {activeTab.slice(0, -1)}</h2>
              <div className="modal-dummy-notice">
                <p>This is a dummy frontend preview.</p>
                <p>Adding items will be functional once the backend is connected.</p>
              </div>
              <div className="modal-actions">
                <button className="modal-btn primary" onClick={() => setShowAddModal(false)}>Got it</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
