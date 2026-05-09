import { useState } from 'react'
import { X } from 'lucide-react'
import useAuthStore from '../../store/authStore'

// ── Текст политики конфиденциальности ─────────────────────
const POLICY_TEXT = `
ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ SOMA

Последнее обновление: ${new Date().toLocaleDateString('ru-RU')}

1. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ
   • Email адрес при регистрации
   • Финансовые транзакции которые вы вводите вручную или голосом
   • Категории, вкладки и настройки приложения
   • Голосовые записи (временно, только для распознавания — не сохраняются)

2. КАК МЫ ИСПОЛЬЗУЕМ ДАННЫЕ
   • Для предоставления сервиса учёта финансов
   • Голосовые запросы отправляются в Groq (whisper-large-v3) для распознавания речи и удаляются сразу после
   • Мы не продаём ваши данные третьим лицам

3. ГДЕ ХРАНЯТСЯ ДАННЫЕ
   • Данные хранятся на серверах Supabase (supabase.com)
   • Серверы расположены в защищённых дата-центрах
   • Передача данных зашифрована (TLS/HTTPS)

4. ДОСТУП К ДАННЫМ
   • Только вы имеете доступ к своим финансовым данным
   • Администраторы SOMA могут видеть данные только в целях технической поддержки
   • Доступ защищён системой Row Level Security (RLS)

5. УДАЛЕНИЕ ДАННЫХ
   • Вы можете запросить удаление всех ваших данных в любое время
   • Для удаления аккаунта обратитесь в поддержку

6. COOKIES И ЛОКАЛЬНОЕ ХРАНИЛИЩЕ
   • Мы используем localStorage для кэширования данных на вашем устройстве
   • Это необходимо для корректной работы приложения

7. ИЗМЕНЕНИЯ В ПОЛИТИКЕ
   • Мы уведомим вас об изменениях через приложение

8. КОНТАКТЫ
   • По вопросам конфиденциальности: privacy@soma.app
`.trim()

// ── Модалка политики ──────────────────────────────────────
function PolicyModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border)',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Политика конфиденциальности</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 40px' }}>
          <pre style={{
            fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7,
            color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {POLICY_TEXT}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ── Главный компонент ──────────────────────────────────────
export default function AuthScreen() {
  const [tab,       setTab]       = useState('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [agreed,    setAgreed]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState('')
  const [showPolicy,setShowPolicy]= useState(false)

  const { signIn, signUp, continueAsGuest, error, clearError } = useAuthStore()

  const canSubmit = tab === 'login' ? true : agreed

  const handleSubmit = async () => {
    if (!email || !password) return
    if (tab === 'register' && !agreed) return
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

  const handleTabChange = (t) => {
    setTab(t)
    setMsg('')
    setAgreed(false)
    clearError()
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
            <button key={k} onClick={() => handleTabChange(k)} style={{
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

        {/* Политика — только при регистрации */}
        {tab === 'register' && (
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            marginBottom: 16, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                width: 16, height: 16, marginTop: 2,
                accentColor: 'var(--purple)', cursor: 'pointer', flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Я принимаю{' '}
              <span
                onClick={(e) => { e.preventDefault(); setShowPolicy(true) }}
                style={{ color: 'var(--purple-light)', textDecoration: 'underline', cursor: 'pointer' }}
              >
                политику конфиденциальности
              </span>
              {' '}и соглашаюсь на обработку персональных данных
            </span>
          </label>
        )}

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
          disabled={loading || !canSubmit}
          style={{ marginBottom: 12, opacity: (loading || !canSubmit) ? 0.45 : 1 }}
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
          👻 Продолжить как Гость
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 10 }}>
          Гость — данные хранятся только на этом устройстве
        </div>
      </div>

      {/* Policy modal */}
      {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  )
}