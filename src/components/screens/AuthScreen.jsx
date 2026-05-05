import { useState } from 'react'
import useAuthStore from '../../store/authStore'

export default function AuthScreen() {
  const [tab,      setTab]      = useState('login')   // 'login' | 'register'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState('')

  const { signIn, signUp, continueAsGuest, error, clearError } = useAuthStore()

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setMsg('')
    clearError()
    try {
      if (tab === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMsg('Проверьте почту — отправили письмо для подтверждения.')
      }
    } catch (_) {}
    setLoading(false)
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 4 }}>SOMA</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: 1.5, marginTop: 4 }}>
          ЗНАЙ КУДА УХОДЯТ ДЕНЬГИ
        </div>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28 }}>

        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'rgba(255,255,255,0.04)', borderRadius: 12,
          padding: 3, gap: 3, marginBottom: 24,
        }}>
          {[['login', 'Войти'], ['register', 'Регистрация']].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setMsg(''); clearError() }} style={{
              padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              background: tab === k ? 'var(--purple)' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Error / Success */}
        {(error || msg) && (
          <div style={{
            fontSize: 13, marginBottom: 14, padding: '10px 14px', borderRadius: 10,
            background: error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: error ? 'var(--red)' : 'var(--green)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}>
            {error || msg}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginBottom: 12, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? 'Загрузка…'
            : tab === 'login' ? 'Войти' : 'Создать аккаунт'
          }
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>или</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Guest */}
        <button className="btn-ghost" onClick={continueAsGuest} style={{ width: '100%' }}>
          Продолжить как Гость
        </button>

        {tab === 'register' && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
            Гость — данные хранятся только на этом устройстве
          </div>
        )}
      </div>
    </div>
  )
}