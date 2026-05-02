// src/components/screens/SplashScreen.jsx
import { useRef } from 'react'
import { Mic } from 'lucide-react'

export default function SplashScreen({ onEnter }) {
  const clicks  = useRef(0)
  const timer   = useRef(null)

  const handleClick = () => {
    clicks.current++
    if (clicks.current >= 2) {
      onEnter()
      clicks.current = 0
      clearTimeout(timer.current)
    } else {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => { clicks.current = 0 }, 500)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        height: '100vh', width: '100%',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: 24, cursor: 'pointer', userSelect: 'none',
      }}
    >
      <button
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Mic size={20} />
      </button>
    </div>
  )
}
