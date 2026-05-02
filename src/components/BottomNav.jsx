// src/components/BottomNav.jsx
import { Home, BarChart2, FileText, Settings } from 'lucide-react'

const ITEMS = [
  { key: 'home',      label: 'Главная',   Icon: Home      },
  { key: 'analytics', label: 'Аналитика', Icon: BarChart2  },
  { key: 'summary',   label: 'Сводка',    Icon: FileText   },
  { key: 'settings',  label: 'Настройки', Icon: Settings   },
]

export default function BottomNav({ nav, onNav }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: 'rgba(7,7,15,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      zIndex: 40,
    }}>
      {ITEMS.map(({ key, label, Icon }) => {
        const active = nav === key
        return (
          <button
            key={key}
            onClick={() => onNav(key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--purple-light)' : 'var(--text-muted)',
              transition: 'color 0.2s',
              paddingBottom: 4,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.2 }}>
              {label}
            </span>
            {active && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 24,
                height: 2,
                borderRadius: 2,
                background: 'var(--purple)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
