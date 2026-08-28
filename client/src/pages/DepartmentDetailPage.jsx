import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { api, getCached, setCached } from '../lib/api';
import { Skeleton, SkeletonTable, SkeletonText } from '../components/Skeletons';
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

const BLANK_FORMS = {
  Employees: { name: '', designation: '', contact_number: '', joining_date: '', status: 'active' },
  Machinery: { name: '', type: '', status: 'working', purchase_date: '', notes: '' },
  Resources: { name: '', category: '', quantity: '', unit: '' },
  Events: { title: '', description: '', event_date: '' },
  Documents: { title: '', file_url: '' },
};

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { query } = useSearch();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('Employees');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(() => !getCached(`/departments/${id}`));
  const [error, setError] = useState('');
  const [dept, setDept] = useState(() => getCached(`/departments/${id}`) || null);
  const [employees, setEmployees] = useState(() => (getCached('/employees') || []).filter((e) => e.department_id === id));
  const [machinery, setMachinery] = useState(() => (getCached('/machinery') || []).filter((x) => x.department_id === id));
  const [resources, setResources] = useState(() => (getCached('/resources') || []).filter((r) => r.department_id === id));
  const [events, setEvents] = useState(() => getCached(`/events?department_id=${id}&include_orgwide=true`) || []);
  const [documents, setDocuments] = useState(() => getCached(`/documents?department_id=${id}&include_orgwide=true`) || []);
  const [transfers, setTransfers] = useState(() => getCached(`/transfers?department_id=${id}`) || []);
  const [form, setForm] = useState(BLANK_FORMS.Employees);
  const [saving, setSaving] = useState(false);

  const [maintMachine, setMaintMachine] = useState(null);
  const [maintRecords, setMaintRecords] = useState([]);
  const [maintLoading, setMaintLoading] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState({ work_type: 'maintenance', title: '', description: '', cost: '', scheduled_date: '', completed_date: '', status: 'scheduled' });
  const [maintError, setMaintError] = useState('');
  const [maintSaving, setMaintSaving] = useState(false);

  async function loadCore() {
    setError('');
    try {
      const [d, em, m, re] = await Promise.all([
        api(`/departments/${id}`),
        api('/employees'),
        api('/machinery'),
        api('/resources'),
      ]);
      setCached(`/departments/${id}`, d);
      setCached('/employees', em || []);
      setCached('/machinery', m || []);
      setCached('/resources', re || []);
      setDept(d);
      setEmployees((em || []).filter((e) => e.department_id === id));
      setMachinery((m || []).filter((x) => x.department_id === id));
      setResources((re || []).filter((r) => r.department_id === id));
    } catch (err) {
      setDept(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadExtras() {
    try {
      const [ev, docs, tr] = await Promise.all([
        api(`/events?department_id=${id}&include_orgwide=true`),
        api(`/documents?department_id=${id}&include_orgwide=true`),
        api(`/transfers?department_id=${id}`),
      ]);
      setCached(`/events?department_id=${id}&include_orgwide=true`, ev || []);
      setCached(`/documents?department_id=${id}&include_orgwide=true`, docs || []);
      setCached(`/transfers?department_id=${id}`, tr || []);
      setEvents(ev || []);
      setDocuments(docs || []);
      setTransfers(tr || []);
    } catch {
      /* non-critical */
    }
  }

  async function load() {
    await loadCore();
    await loadExtras();
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openAdd() {
    setError('');
    setForm(BLANK_FORMS[activeTab] || BLANK_FORMS.Employees);
    setShowAddModal(true);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, department_id: id };
      let endpoint = '/employees';
      if (activeTab === 'Machinery') endpoint = '/machinery';
      else if (activeTab === 'Resources') endpoint = '/resources';
      else if (activeTab === 'Events') endpoint = '/events';
      else if (activeTab === 'Documents') endpoint = '/documents';
      await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      setShowAddModal(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const canAdd = isAdmin || activeTab === 'Employees' || activeTab === 'Machinery' || activeTab === 'Resources';

  async function openMaint(m) {
    setMaintMachine({ id: m.id, name: m.name });
    setMaintLoading(true);
    setMaintError('');
    try {
      const data = await api(`/machinery/${m.id}/maintenance`);
      setMaintRecords(data || []);
    } catch (err) {
      setMaintRecords([]);
      setMaintError(err.message);
    } finally {
      setMaintLoading(false);
    }
  }

  function openMaintAdd() {
    setMaintForm({ work_type: 'maintenance', title: '', description: '', cost: '', scheduled_date: '', completed_date: '', status: 'scheduled' });
    setMaintError('');
    setShowMaintModal(true);
  }

  async function submitMaint(e) {
    e.preventDefault();
    if (!maintMachine) return;
    setMaintSaving(true);
    setMaintError('');
    try {
      await api(`/machinery/${maintMachine.id}/maintenance`, { method: 'POST', body: JSON.stringify(maintForm) });
      setShowMaintModal(false);
      await openMaint(maintMachine);
    } catch (err) {
      setMaintError(err.message);
    } finally {
      setMaintSaving(false);
    }
  }

  const q = query.trim().toLowerCase();
  const flt = (arr, fields) =>
    !q ? arr : (arr || []).filter((x) => fields.some((f) => x[f] && String(x[f]).toLowerCase().includes(q)));
  const fEmployees = flt(employees, ['name', 'designation', 'contact_number', 'status']);
  const fMachinery = flt(machinery, ['name', 'type', 'status', 'notes']);
  const fResources = flt(resources, ['name', 'category', 'unit']);
  const fEvents = flt(events, ['title', 'description']);
  const fDocuments = flt(documents, ['title']);
  const fTransfers = flt(transfers, ['item_name', 'from_name', 'to_name', 'reason']);

  if (loading) {
    return (
      <>
        <Topbar title />
        <div className="admin-content">
          <div className="dept-detail-header" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
            <Skeleton width={120} height={16} round={6} />
            <Skeleton width={220} height={32} round={8} />
          </div>
          <div className="dept-tabs">
            {TABS.map((t) => <SkeletonText key={t} width={120} height={36} lines={1} />)}
          </div>
          <SkeletonTable rows={5} cols={6} />
        </div>
      </>
    );
  }
  if (!dept || error) return <div className="admin-content"><div className="data-state">Department not found or unavailable. {error}</div></div>;

  return (
    <>
      <Topbar title subtitle={dept.description} />
      <div className="admin-content">
        <div className="dept-detail-header">
          <div>
            <Link to="/departments" className="dept-detail-back">← All Departments</Link>
            <h1 className="dept-detail-name">{dept.name}</h1>
            {dept.address && <div className="dept-detail-address">📍 {dept.address}</div>}
          </div>
          {canAdd && (
            <button className="dept-detail-add" onClick={() => setShowAddModal(true)}>
              + Add {activeTab === 'Transfer History' ? 'Transfer' : activeTab.slice(0, -1)}
            </button>
          )}
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
                  {fEmployees.length === 0 && (
                    <tr><td colSpan={6} className="td-empty">No employees{query ? ` match "${query}"` : ''}.</td></tr>
                  )}
                  {fEmployees.map((e) => (
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
                    <th>History</th>
                  </tr>
                </thead>
                <tbody>
                  {fMachinery.length === 0 && (
                    <tr><td colSpan={6} className="td-empty">No machinery{query ? ` match "${query}"` : ''}.</td></tr>
                  )}
                  {fMachinery.map((m) => (
                    <tr key={m.id}>
                      <td className="td-name">{m.name}</td>
                      <td>{m.type}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td className="td-muted">{new Date(m.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="td-muted">{m.notes || '—'}</td>
                      <td>
                        <button className="td-mach-history" onClick={() => openMaint(m)}>
                          {maintLoading && maintMachine?.id === m.id ? '…' : 'History'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {maintMachine && (
                <div className="mach-history anim-slide-up">
                  <div className="mach-history-head">
                    <div>
                      <h4 className="mach-history-title">Maintenance &amp; Repairs</h4>
                      <span className="mach-history-sub">{maintMachine.name}</span>
                    </div>
                    <button className="mach-history-add" onClick={openMaintAdd}>+ Add record</button>
                  </div>

                  {maintError && <div className="data-state">⚠ {maintError}</div>}

                  {maintLoading ? (
                    <div className="data-state" style={{ padding: '20px 0' }}>Loading history…</div>
                  ) : maintRecords.length === 0 ? (
                    <div className="data-state" style={{ padding: '20px 0' }}>No maintenance records yet.</div>
                  ) : (
                    <div className="mach-history-list">
                      {maintRecords.map((r) => (
                        <div key={r.id} className={`mach-record ${r.status === 'completed' ? 'done' : ''}`}>
                          <div className="mach-record-top">
                            <span className={`mach-record-type ${r.work_type}`}>{r.work_type}</span>
                            <span className={`mach-record-status ${r.status}`}>{r.status}</span>
                          </div>
                          <strong className="mach-record-title">{r.title}</strong>
                          {r.description && <p className="mach-record-desc">{r.description}</p>}
                          <div className="mach-record-meta">
                            {r.cost != null && <span className="mach-record-cost">₹ {Number(r.cost).toLocaleString('en-IN')}</span>}
                            {r.scheduled_date && <span>Scheduled: {new Date(r.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                            {r.completed_date && <span>Completed: {new Date(r.completed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  {fResources.length === 0 && (
                    <tr><td colSpan={6} className="td-empty">No resources{query ? ` match "${query}"` : ''}.</td></tr>
                  )}
                  {fResources.map((r) => (
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
              {fEvents.length === 0 && (
                <div className="data-state" style={{ gridColumn: '1 / -1' }}>No events{query ? ` match "${query}"` : ''}.</div>
              )}
              {fEvents.map((ev) => (
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
              {fDocuments.length === 0 && (
                <div className="data-state" style={{ gridColumn: '1 / -1' }}>No documents{query ? ` match "${query}"` : ''}.</div>
              )}
              {fDocuments.map((doc) => (
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
                  {fTransfers.length === 0 ? (
                    <tr><td colSpan={6} className="td-empty">{query ? `No transfers match "${query}".` : 'No transfer history for this department'}</td></tr>
                  ) : fTransfers.map((t) => (
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
              <h2 className="modal-title">Add New {activeTab === 'Transfer History' ? 'Transfer' : activeTab.slice(0, -1)}</h2>
              <form onSubmit={submitAdd} className="modal-form">
                {activeTab === 'Employees' && (
                  <>
                    <div className="modal-field"><label>Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="modal-field"><label>Designation</label><input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                    <div className="modal-field"><label>Contact Number</label><input type="text" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
                    <div className="modal-field"><label>Joining Date</label><input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
                  </>
                )}
                {activeTab === 'Machinery' && (
                  <>
                    <div className="modal-field"><label>Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="modal-field"><label>Type</label><input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
                    <div className="modal-field"><label>Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="working">working</option>
                        <option value="maintenance">maintenance</option>
                        <option value="idle">idle</option>
                      </select>
                    </div>
                    <div className="modal-field"><label>Purchase Date</label><input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
                    <div className="modal-field"><label>Notes</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  </>
                )}
                {activeTab === 'Resources' && (
                  <>
                    <div className="modal-field"><label>Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="modal-field"><label>Category</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                    <div className="modal-field"><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                    <div className="modal-field"><label>Unit</label><input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                  </>
                )}
                {activeTab === 'Events' && (
                  <>
                    <div className="modal-field"><label>Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                    <div className="modal-field"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="modal-field"><label>Event Date</label><input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                  </>
                )}
                {activeTab === 'Documents' && (
                  <>
                    <div className="modal-field"><label>Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                    <div className="modal-field"><label>File URL</label><input type="text" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} /></div>
                  </>
                )}
                {error && activeTab && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMaintModal && (
          <div className="modal-overlay" onClick={() => setShowMaintModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add Maintenance / Repair</h2>
              <p className="modal-hint">{maintMachine ? `For: ${maintMachine.name}` : ''}</p>
              <form onSubmit={submitMaint} className="modal-form">
                <div className="modal-field"><label>Work Type</label>
                  <select value={maintForm.work_type} onChange={(e) => setMaintForm({ ...maintForm, work_type: e.target.value })}>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                <div className="modal-field"><label>Title</label><input type="text" value={maintForm.title} onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })} required placeholder="e.g. Bearing replacement" /></div>
                <div className="modal-field"><label>Description</label><textarea rows={3} value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} /></div>
                <div className="modal-field"><label>Cost</label><input type="number" min="0" step="0.01" value={maintForm.cost} onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })} placeholder="0" /></div>
                <div className="modal-field"><label>Scheduled Date</label><input type="date" value={maintForm.scheduled_date} onChange={(e) => setMaintForm({ ...maintForm, scheduled_date: e.target.value })} /></div>
                <div className="modal-field"><label>Completed Date</label><input type="date" value={maintForm.completed_date} onChange={(e) => setMaintForm({ ...maintForm, completed_date: e.target.value })} /></div>
                <div className="modal-field"><label>Status</label>
                  <select value={maintForm.status} onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value })}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {maintError && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {maintError}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowMaintModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={maintSaving}>{maintSaving ? 'Saving…' : 'Add Record'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
