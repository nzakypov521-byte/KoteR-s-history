// src/components/modals/AddTransactionModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import useStore, { currSym } from '../../store'
import dayjs from 'dayjs'

export default function AddTransactionModal({ onClose, onConfirm }) {
  const categories = useStore((s) => s.settings.categories)
  const baseCurrency = useStore((s) => s.settings.baseCurrency)

  const [type,   setType]   = useState('expense')
  const [amount, setAmount] = useState('')
  const [desc,   setDesc]   = useState('')
  const [cat,    setCat]    = useState('Other')
  const [date,   setDate]   = useState(dayjs().format('YYYY-MM-DD'))

  const handleAdd = () => {
    if (!amount || isNaN(+amount) || +amount <= 0) return
    onConfirm([{
      type,
      amount: +amount,
      currency: baseCurrency,
      description: desc.trim() || cat,
      category: cat,
      date: new Date(date).toISOString(),
    }])
    onClose()
  }

  return (
    <div
      className="overlay-bottom"
      onClick={onClose}
    >
      <div className="bottom-sheet slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Add Transaction</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, gap: 3, marginBottom: 16,
        }}>
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                background: type === t
                  ? t === 'expense' ? 'rgba(127,29,29,0.8)' : 'rgba(20,83,45,0.8)'
                  : 'transparent',
                color: type === t
                  ? t === 'expense' ? '#fca5a5' : '#86efac'
                  : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)', borderRadius: 12,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{currSym(baseCurrency)}</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, fontWeight: 600, outline: 'none' }}
            autoFocus
          />
        </div>

        {/* Description */}
        <input
          className="input-field"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          style={{ marginBottom: 14 }}
        />

        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {categories.map((c) => (
            <button
              key={c}
              className={`tag ${cat === c ? 'active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Date */}
        <input
          type="date"
          className="input-field"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        <button className="btn-primary" onClick={handleAdd}>Add Transaction</button>
      </div>
    </div>
  )
}
