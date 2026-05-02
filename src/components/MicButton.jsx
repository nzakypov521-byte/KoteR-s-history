// src/components/MicButton.jsx
import { Mic, Square } from 'lucide-react'

const BG = {
  idle:       'rgba(255,255,255,0.08)',
  listening:  '#ef4444',
  processing: '#f59e0b',
  done:       '#10b981',
  error:      '#374151',
}

export default function MicButton({ state, label, onStart, onStop }) {
  const isListening = state === 'listening'
  const bg = BG[state] ?? BG.idle

  return (
    <div style={{ position: 'fixed', bottom: 72, right: 18, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      {/* Bubble */}
      {label && (
        <div style={{
          maxWidth: 230,
          padding: '10px 14px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          fontSize: 13,
          lineHeight: 1.45,
          color: state === 'done' ? 'var(--green)' : state === 'error' ? 'var(--red)' : 'var(--text)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease',
          wordBreak: 'break-word',
        }}>
          {label}
        </div>
      )}

      {/* Button */}
      <button
        onClick={isListening ? onStop : onStart}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: bg,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.25s',
          animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
          boxShadow: isListening ? 'none' : '0 4px 20px rgba(0,0,0,0.45)',
        }}
      >
        {isListening
          ? <Square size={20} fill="white" strokeWidth={0} />
          : state === 'processing'
            ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <Mic size={22} />
        }
      </button>
    </div>
  )
}
