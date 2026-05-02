// src/components/modals/NewTabModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { TAB_ICONS, TAB_COLORS } from '../../store'

export default function NewTabModal({ onClose, onConfirm }) {
  const [name,  setName]  = useState('')
  const [icon,  setIcon]  = useState('💼')
  const [color, setColor] = useState('#8b5cf6')

  const handleCreate = () => {
    if (!name.trim()) return
    onConfirm({ name: name.trim(), icon, color })
    onClose()
  }

  return (
    <div className="overlay scale-in" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Новая вкладка</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <input
          className="input-field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Название (Работа, Личное…)"
          autoFocus
          style={{ marginBottom: 20 }}
        />

        {/* Icons */}
        <div className="section-label" style={{ marginBottom: 10 }}>ICON</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {TAB_ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              style={{
                width: 40, height: 40, borderRadius: 12, fontSize: 18,
                border: `1.5px solid ${icon === ic ? '#8b5cf6' : 'var(--border)'}`,
                background: icon === ic ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {ic}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="section-label" style={{ marginBottom: 10 }}>COLOR</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {TAB_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                outline: color === c ? '2.5px solid #fff' : '2.5px solid transparent',
                outlineOffset: 2, cursor: 'pointer', transition: 'outline 0.15s',
              }}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={handleCreate}>Создать</button>
      </div>
    </div>
  )
}
