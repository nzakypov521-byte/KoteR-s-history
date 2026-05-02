// src/components/modals/ConfirmTransactionsModal.jsx
import { X } from 'lucide-react'
import { currSym, fmt } from '../../store'

export default function ConfirmTransactionsModal({ transactions, onConfirm, onClose }) {
  return (
    <div className="overlay scale-in" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Добавить {transactions.length} транзакц{transactions.length === 1 ? 'ию' : transactions.length < 5 ? 'ии' : 'ий'}?
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
          {transactions.map((tx, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {tx.category} · {new Date(tx.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                flexShrink: 0,
              }}>
                {tx.type === 'income' ? '+' : '−'}{currSym(tx.currency)}{fmt(tx.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={() => { onConfirm(transactions); onClose() }}>
            Добавить всё
          </button>
        </div>
      </div>
    </div>
  )
}
