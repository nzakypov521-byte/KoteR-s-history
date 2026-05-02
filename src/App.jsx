// src/App.jsx
import { useState, useCallback } from 'react'
import { Minus, Plus } from 'lucide-react'

import useStore from './store'
import { useVoice } from './hooks/useVoice'

import SplashScreen    from './components/screens/SplashScreen'
import HomeScreen      from './components/screens/HomeScreen'
import AnalyticsScreen from './components/screens/AnalyticsScreen'
import SummaryScreen   from './components/screens/SummaryScreen'
import SettingsScreen  from './components/screens/SettingsScreen'

import BottomNav                  from './components/BottomNav'
import MicButton                  from './components/MicButton'
import NewTabModal                from './components/modals/NewTabModal'
import AddTransactionModal        from './components/modals/AddTransactionModal'
import ConfirmTransactionsModal   from './components/modals/ConfirmTransactionsModal'

const MONTHS = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ',
                'ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']

export default function App() {
  const screen      = useStore((s) => s.screen)
  const nav         = useStore((s) => s.nav)
  const tabs        = useStore((s) => s.tabs)
  const activeTabId = useStore((s) => s.activeTabId)
  const transactions= useStore((s) => s.transactions)
  const settings    = useStore((s) => s.settings)

  const setScreen      = useStore((s) => s.setScreen)
  const setNav         = useStore((s) => s.setNav)
  const setActiveTabId = useStore((s) => s.setActiveTabId)
  const addTab         = useStore((s) => s.addTab)
  const addTransactions= useStore((s) => s.addTransactions)

  const [showNewTab,   setShowNewTab]   = useState(false)
  const [showAddTx,    setShowAddTx]    = useState(false)
  const [confirmTxs,   setConfirmTxs]   = useState(null)

  // ── Voice ──
  const handleResult   = useCallback((txs) => addTransactions(txs), [addTransactions])
  const handleMultiple = useCallback((txs) => setConfirmTxs(txs),   [])

  const voice = useVoice({
    baseCurrency: settings.baseCurrency,
    onResult:     handleResult,
    onMultiple:   handleMultiple,
  })

  // ── Tab header balance indicator ──
  const tabTxs = transactions.filter((t) => t.tabId === activeTabId)
  const income  = tabTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = tabTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  // ─────────────────────────────────────────────────────────
  if (screen === 'splash') {
    return <SplashScreen onEnter={() => setScreen('app')} />
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
      maxWidth: 520,
      margin: '0 auto',
    }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        {nav === 'home' ? (
          <>
            {/* Logo row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>SOMA</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginTop: 2 }}>
                  ЗНАЙ КУДА УХОДЯТ ДЕНЬГИ
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <IconBtn onClick={() => setScreen('splash')} title="Свернуть"><Minus size={13} /></IconBtn>
                <IconBtn onClick={() => setShowNewTab(true)}  title="Новая вкладка"><Plus size={13} /></IconBtn>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {tabs.map((tab) => {
                const active = activeTabId === tab.id
                const txs    = transactions.filter((t) => t.tabId === tab.id)
                const bal    = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                           - txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 20,
                      border: `1.5px solid ${active ? tab.color : 'rgba(255,255,255,0.1)'}`,
                      background: active ? `${tab.color}22` : 'transparent',
                      color: active ? tab.color : 'rgba(255,255,255,0.38)',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: tab.color, display: 'inline-block' }} />
                    {tab.icon} {tab.name}
                    {active && (
                      <span style={{ fontSize: 11, opacity: 0.75 }}>
                        {bal >= 0 ? '+' : ''}{Math.round(bal).toLocaleString('ru-RU')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          /* Compact header for other screens */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>SOMA</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginTop: 1 }}>
                ЗНАЙ КУДА УХОДЯТ ДЕНЬГИ
              </div>
            </div>
            <IconBtn onClick={() => setScreen('splash')}><Minus size={13} /></IconBtn>
          </div>
        )}
      </header>

      {/* ── Scrollable content ─────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}>
        {nav === 'home'      && <HomeScreen      onAddTx={() => setShowAddTx(true)} />}
        {nav === 'analytics' && <AnalyticsScreen />}
        {nav === 'summary'   && <SummaryScreen   />}
        {nav === 'settings'  && <SettingsScreen  />}
      </main>

      {/* ── Mic button ─────────────────────────────────── */}
      <MicButton
        state={voice.state}
        label={voice.label}
        onStart={voice.start}
        onStop={voice.stop}
      />

      {/* ── Bottom nav ─────────────────────────────────── */}
      <BottomNav nav={nav} onNav={setNav} />

      {/* ── Modals ─────────────────────────────────────── */}
      {showNewTab && (
        <NewTabModal
          onClose={() => setShowNewTab(false)}
          onConfirm={(tab) => { addTab(tab); setActiveTabId(tab.id) }}
        />
      )}

      {showAddTx && (
        <AddTransactionModal
          onClose={() => setShowAddTx(false)}
          onConfirm={addTransactions}
        />
      )}

      {confirmTxs && (
        <ConfirmTransactionsModal
          transactions={confirmTxs}
          onConfirm={addTransactions}
          onClose={() => setConfirmTxs(null)}
        />
      )}
    </div>
  )
}

// ── Small helper ──────────────────────────────────────────
function IconBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}
