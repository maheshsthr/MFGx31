import { useEffect, useState } from 'react';
import Topbar from '../layouts/Topbar';
import { useSearch } from '../context/SearchContext';
import { api, getCached, setCached } from '../lib/api';
import { SkeletonTable } from '../components/Skeletons';
import './DeptResourcePage.css';

const RESOURCE_CONFIGS = {
  employees: {
    title: 'Employees',
    subtitle: "Manage the people working in your department.",
    endpoint: '/employees',
    addLabel: '+ Add Employee',
    columns: [
      { key: 'name', label: 'Name', type: 'name' },
      { key: 'designation', label: 'Designation', type: 'text' },
      { key: 'contact_number', label: 'Contact', type: 'muted' },
      { key: 'joining_date', label: 'Joined', type: 'date' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    blank: { name: '', designation: '', contact_number: '', joining_date: '', status: 'active' },
    statusOptions: [
      { value: 'active', label: 'active', color: 'green' },
      { value: 'transferred', label: 'transferred', color: 'amber' },
      { value: 'inactive', label: 'inactive', color: 'red' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text' },
      { key: 'contact_number', label: 'Contact Number', type: 'text' },
      { key: 'joining_date', label: 'Joining Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'transferred', 'inactive'] },
    ],
  },
  machinery: {
    title: 'Machinery',
    subtitle: 'Manage machines and equipment in your department.',
    endpoint: '/machinery',
    addLabel: '+ Add Machinery',
    columns: [
      { key: 'name', label: 'Name', type: 'name' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'purchase_date', label: 'Purchased', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'muted' },
    ],
    blank: { name: '', type: '', status: 'working', purchase_date: '', notes: '' },
    statusOptions: [
      { value: 'working', label: 'working', color: 'green' },
      { value: 'maintenance', label: 'maintenance', color: 'amber' },
      { value: 'idle', label: 'idle', color: 'red' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['working', 'maintenance', 'idle'] },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  resources: {
    title: 'Resources',
    subtitle: 'Manage raw materials and stock in your department.',
    endpoint: '/resources',
    addLabel: '+ Add Resource',
    columns: [
      { key: 'name', label: 'Name', type: 'name' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'qty' },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'last_updated', label: 'Last Updated', type: 'date' },
    ],
    blank: { name: '', category: '', quantity: '', unit: '' },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'text' },
    ],
  },
};

const STATUS_COLORS = {
  active: 'green',
  working: 'green',
  maintenance: 'amber',
  idle: 'red',
  transferred: 'amber',
  inactive: 'red',
};

function StatusBadge({ status }) {
  return <span className={`dept-status-text ${STATUS_COLORS[status] || 'muted'}`}>{status}</span>;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DeptResourcePage({ resource }) {
  const config = RESOURCE_CONFIGS[resource];
  const { query } = useSearch();
  const [rows, setRows] = useState(() => getCached(config.endpoint) || []);
  const [loading, setLoading] = useState(() => !getCached(config.endpoint));
  const [error, setError] = useState('');

  // When the route switches resources (employees -> machinery) the component
  // instance is reused, so reset all state synchronously during render to avoid
  // a stale flash of the previous resource's rows before the skeleton shows.
  const [prevResource, setPrevResource] = useState(resource);
  if (prevResource !== resource) {
    setPrevResource(resource);
    setRows([]);
    setLoading(true);
    setError('');
  }
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.blank);
  const [saving, setSaving] = useState(false);

  const q = query.trim().toLowerCase();
  const filteredRows = q
    ? rows.filter((row) =>
        config.columns.some((c) => row[c.key] != null && String(row[c.key]).toLowerCase().includes(q)),
      )
    : rows;

  async function load() {
    try {
      const data = await api(config.endpoint);
      setCached(config.endpoint, data);
      setRows(data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api(config.endpoint);
        if (cancelled) return;
        setCached(config.endpoint, data);
        setRows(data || []);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  function openAdd() {
    setEditing(null);
    setForm(config.blank);
    setError('');
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row.id);
    setForm({ ...config.blank, ...row });
    setError('');
    setShowModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form };
      Object.keys(body).forEach((k) => {
        if (body[k] === '' || body[k] === null || body[k] === undefined) delete body[k];
      });
      if (editing) {
        await api(`${config.endpoint}/${editing}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api(config.endpoint, { method: 'POST', body: JSON.stringify(body) });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    setError('');
    try {
      await api(`${config.endpoint}/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderCell(row, col) {
    const value = row[col.key];
    switch (col.type) {
      case 'name': return <span className="dept-td-name">{value}</span>;
      case 'status': return <StatusBadge status={value} />;
      case 'date': return <span className="dept-td-muted">{formatDate(value)}</span>;
      case 'qty': return <span className="dept-td-qty">{Number(value).toLocaleString()}</span>;
      case 'muted':
      default: return <span className="dept-td-muted">{value || '—'}</span>;
    }
  }

  return (
    <>
      <Topbar title subtitle={config.subtitle} />
      <div className="admin-content">
        <div className="dept-resource-header">
          <div className="dept-resource-count">
            {filteredRows.length} {config.title}
          </div>
          <button className="dept-resource-add press-effect" onClick={openAdd}>
            {config.addLabel}
          </button>
        </div>

        {loading && <SkeletonTable rows={5} cols={6} />}
        {!loading && error && <div className="data-state">⚠ {error}</div>}

        {!loading && (
        <div className="dept-resource-card anim-slide-up">
          <table className="dept-resource-table">
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 && (
                <tr><td colSpan={config.columns.length + 1} className="td-empty">{q ? `No ${config.title.toLowerCase()} match "${query}".` : `No ${config.title.toLowerCase()} yet.`}</td></tr>
              )}
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((c) => (
                    <td key={c.key}>{renderCell(row, c)}</td>
                  ))}
                  <td className="dept-td-actions">
                    <button className="td-menu" title="Edit" onClick={() => openEdit(row)}>✎</button>
                    <button className="td-menu danger" title="Delete" onClick={() => remove(row.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{editing ? 'Edit' : 'Add'} {config.title.slice(0, -1)}</h2>
              <form onSubmit={submit} className="modal-form">
                {config.fields.map((f) => (
                  <div className="modal-field" key={f.key}>
                    <label>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea rows={2} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    ) : (
                      <input
                        type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                        value={form[f.key] || ''}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
                {error && <p className="modal-hint" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
