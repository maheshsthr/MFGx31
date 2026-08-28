import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { api, getCached, setCached } from '../lib/api';
import { SkeletonTable } from '../components/Skeletons';
import ConfirmDialog from '../components/ConfirmDialog';
import './TransfersPage.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'employee', label: 'Employees' },
  { key: 'machinery', label: 'Machinery' },
  { key: 'resource', label: 'Resources' },
];

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function StatusBadge({ status }) {
  return <span className={`transfer-status ${status || 'approved'}`}>{STATUS_LABEL[status] || STATUS_LABEL.approved}</span>;
}

export default function TransfersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { query } = useSearch();

  const [transfers, setTransfers] = useState(() => getCached('/transfers') || []);
  const [loading, setLoading] = useState(() => !getCached('/transfers'));
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ item_type: 'employee', item_id: '', to_department_id: '', reason: '' });
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewMode, setReviewMode] = useState('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  async function load() {
    setError('');
    try {
      const qs = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const path = `/transfers${qs}`;
      const data = await api(path);
      setCached(path, data || []);
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
        api('/departments?targets=1'),
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

  useEffect(() => { load(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [statusFilter]);
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

  function openReview(t, mode) {
    setReviewTarget(t);
    setReviewMode(mode);
    setReviewNote('');
    setError('');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!reviewTarget) return;
    setReviewSaving(true);
    setError('');
    try {
      const endpoint = reviewMode === 'approve'
        ? `/transfers/${reviewTarget.id}/approve`
        : `/transfers/${reviewTarget.id}/reject`;
      await api(endpoint, { method: 'POST', body: JSON.stringify({ note: reviewNote }) });
      setReviewTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewSaving(false);
    }
  }

  const q = query.trim().toLowerCase();
  const searched = q
    ? transfers.filter((t) =>
        [t.item_name, t.from_name, t.to_name, t.reason, t.transferred_by_name].some(
          (v) => v && String(v).toLowerCase().includes(q),
        ),
      )
    : transfers;
  const filtered = filter === 'all' ? searched : searched.filter((t) => t.item_type === filter);
  const pendingCount = transfers.filter((t) => t.status === 'pending').length;

  return (
    <>
      <Topbar title subtitle={isAdmin ? 'Track and review all asset movements across departments' : 'Request and track asset movements for your department'} />
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isAdmin && (
              <div className="transfers-status-filters">
                {['all', 'pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    className={`transfers-status-filter ${statusFilter === s ? 'active' : ''}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'All' : STATUS_LABEL[s]}
                    {s === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </button>
                ))}
              </div>
            )}
            <button className="transfers-new" onClick={() => setShowModal(true)}>+ New Transfer</button>
          </div>
        </div>

        {loading && <SkeletonTable rows={5} cols={7} />}
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        <div className="transfers-table-card anim-slide-up">
          <table className="transfers-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Date</th>
                {isAdmin && <th>Review</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 9 : 8} className="td-empty">{query ? `No transfers match "${query}".` : 'No transfers yet.'}</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="td-name">{t.item_name}</td>
                  <td><span className="td-type">{t.item_type}</span></td>
                  <td>{t.from_name}</td>
                  <td>{t.to_name}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="td-muted td-reason">{t.reason}</td>
                  <td className="td-muted">{t.transferred_by_name}</td>
                  <td className="td-muted">
                    {new Date(t.transferred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  {isAdmin && (
                    <td>
                      {t.status === 'pending' ? (
                        <div className="transfer-review-actions">
                          <button className="transfer-approve press-effect" onClick={() => openReview(t, 'approve')}>Approve</button>
                          <button className="transfer-reject press-effect" onClick={() => openReview(t, 'reject')}>Reject</button>
                        </div>
                      ) : (
                        <span className="td-muted">
                          {t.reviewed_by_name || '—'}
                          {t.review_note ? ` · ${t.review_note}` : ''}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*__MODAL__*/}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">New Transfer{!isAdmin ? ' Request' : ''}</h2>
              {!isAdmin && <p className="modal-hint">Submitted for admin approval. The item stays in place until approved.</p>}
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
                  <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Submitting…' : isAdmin ? 'Transfer' : 'Submit Request'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/*__REVIEW MODAL (admin)__*/}
        {reviewTarget && (
          <div className="modal-overlay" onClick={() => setReviewTarget(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{reviewMode === 'approve' ? 'Approve' : 'Reject'} Transfer</h2>
              <p className="modal-hint" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {reviewTarget.item_name} · {reviewTarget.from_name} → {reviewTarget.to_name} · by {reviewTarget.transferred_by_name}
              </p>
              <form onSubmit={submitReview} className="modal-form">
                <div className="modal-field">
                  <label>{reviewMode === 'approve' ? 'Approval note (optional)' : 'Reason for rejection (optional)'}</label>
                  <textarea rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Optional note" />
                </div>
                {error && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setReviewTarget(null)}>Cancel</button>
                  <button
                    type="submit"
                    className="modal-btn primary"
                    style={reviewMode === 'reject' ? { background: 'var(--red)' } : undefined}
                    disabled={reviewSaving}
                  >
                    {reviewSaving ? 'Saving…' : reviewMode === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
