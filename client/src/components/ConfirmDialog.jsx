import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button className="confirm-btn secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`confirm-btn primary ${danger ? 'danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
