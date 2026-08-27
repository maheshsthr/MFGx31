import Topbar from '../layouts/Topbar';
import { DUMMY_TRANSFERS } from '../data/dummyData';
import './TransfersPage.css';

export default function TransfersPage() {
  return (
    <>
      <Topbar title subtitle="Track all asset movements across departments" />
      <div className="admin-content">
        <div className="transfers-header">
          <div className="transfers-filters">
            <button className="transfers-filter active">All</button>
            <button className="transfers-filter">Employees</button>
            <button className="transfers-filter">Machinery</button>
            <button className="transfers-filter">Resources</button>
          </div>
          <button className="transfers-new">+ New Transfer</button>
        </div>

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
              {DUMMY_TRANSFERS.map((t) => (
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
      </div>
    </>
  );
}
