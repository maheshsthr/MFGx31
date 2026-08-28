import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { api } from '../lib/api';
import './TransfersPage.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'employee', label: 'Employees' },
  { key: 'machinery', label: 'Machinery' },
  { key: 'resource', label: 'Resources' },
];

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ item_type: 'employee', item_id: '', to_department_id: '', reason: '' });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api('/transfers');
      setTransfers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadModalData() {
    try {
      const [depList, emp, mac, res] = await Promise.all([
        api('/departments'),
        api('/employees'),
        api('/machinery'),
        api('/resources'),
      ]);
      setDepartments(depList || []);
      const mapping = { employee: emp || [], machinery: mac || [], resource: res || [] };
      setItems(mapping[form.item_type] || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (showModal) loadModalData(); }, [showModal]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onChangeType(itemType) {
    setForm({ ...form, item_type: itemType, item_id: '' });
    try {
      let data = [];
      if (itemType === 'employee') data = (await api('/employees')) || [];
      else if (itemType === 'machinery') data = (await api('/machinery')) || [];
      else if (itemType === 'resource') data = (await api('/resources')) || [];
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitTransfer(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          item_type: form.item_type,
          item_id: form.item_id,
          to_department_id: form.to_department_id,
          reason: form.reason,
        }),
      });
      setShowModal(false);
      setForm({ item_type: 'employee', item_id: '', to_department_id: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'all' ? transfers : transfers.filter((t) => t.item_type === filter);

  return (
    <>
      <Topbar title subtitle="Track all asset movements across departments" />
      <div className="admin-content">
        <div className="transfers-header">
          <div className="transfers-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`transfers-filter ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="transfers-new" onClick={() => setShowModal(true)}>+ New Transfer</button>
        </div>

        {loading && <div className="data-state">Loading transfers…</div>}
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        <div className="transfers-table-card anim-slide-up">
          <table className="transfers-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Transferred By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="td-empty">No transfers yet.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="td-name">{t.item_name}</td>
                  <td><span className="td-type">{t.item_type}</span></td>
                  <td>{t.from_name}</td>
                  <td>{t.to_name}</td>
                  <td className="td-muted td-reason">{t.reason}</td>
                  <td className="td-muted">{t.transferred_by_name}</td>
                  <td className="td-muted">
                    {new Date(t.transferred_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*__MODAL__*/}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">New Transfer</h2>
              <form onSubmit={submitTransfer} className="modal-form">
                <div className="modal-field">
                  <label>Type</label>
                  <select value={form.item_type} onChange={(e) => onChangeType(e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="machinery">Machinery</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Item</label>
                  <select value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })} required>
                    <option value="">Select {form.item_type}</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Move to Department</label>
                  <select value={form.to_department_id} onChange={(e) => setForm({ ...form, to_department_id: e.target.value })} required>
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Reason</label>
                  <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional" />
                </div>
                {error && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Transferring…' : 'Transfer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
