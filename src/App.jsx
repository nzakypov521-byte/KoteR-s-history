// src/App.jsx
import { useState, useCallback, useEffect } from 'react'
import { Minus, Plus, LogOut } from 'lucide-react'

import useStore from './store'
import { useWhisper as useVoice } from './hooks/useWhisper'
import useAuthStore from './store/authStore'

import SplashScreen             from './components/screens/SplashScreen'
import HomeScreen               from './components/screens/HomeScreen'
import AnalyticsScreen          from './components/screens/AnalyticsScreen'
import SummaryScreen            from './components/screens/SummaryScreen'
import SettingsScreen           from './components/screens/SettingsScreen'
import AuthScreen               from './components/screens/AuthScreen'

import BottomNav                from './components/BottomNav'
import MicButton                from './components/MicButton'
import NewTabModal              from './components/modals/NewTabModal'
import AddTransactionModal      from './components/modals/AddTransactionModal'
import ConfirmTransactionsModal from './components/modals/ConfirmTransactionsModal'

export default function App() {
  // Auth
  const { user, isGuest, loading: authLoading, signOut, init } = useAuthStore()
  const loadFromSupabase = useStore((s) => s.loadFromSupabase)
  const clearUserData    = useStore((s) => s.clearUserData)

  useEffect(() => { init() }, [])
  useEffect(() => { if (user) loadFromSupabase(user.id) }, [user?.id])

  // Store
  const screen       = useStore((s) => s.screen)
  const nav          = useStore((s) => s.nav)
  const tabs         = useStore((s) => s.tabs)
  const activeTabId  = useStore((s) => s.activeTabId)
  const transactions = useStore((s) => s.transactions)
  const settings     = useStore((s) => s.settings)

  const setScreen       = useStore((s) => s.setScreen)
  const setNav          = useStore((s) => s.setNav)
  const setActiveTabId  = useStore((s) => s.setActiveTabId)
  const addTab          = useStore((s) => s.addTab)
  const addTransactions = useStore((s) => s.addTransactions)

  // Modals
  const [showNewTab,  setShowNewTab]  = useState(false)
  const [showAddTx,   setShowAddTx]   = useState(false)
  const [confirmTxs,  setConfirmTxs]  = useState(null)

  // Voice
  const handleResult   = useCallback((txs) => addTransactions(txs), [addTransactions])
  const handleMultiple = useCallback((txs) => setConfirmTxs(txs), [])

  const voice = useVoice({
    baseCurrency: settings.baseCurrency,
    onResult:     handleResult,
    onMultiple:   handleMultiple,
  })

  const handleSignOut = async () => {
    await signOut()
    clearUserData()
  }

  // Loading
  if (authLoading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:28, height:28, border:'2.5px solid rgba(255,255,255,0.08)', borderTopColor:'var(--purple)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  )

  // Auth gate
  if (!user && !isGuest) return <AuthScreen />

  // Splash
  if (screen === 'splash') return <SplashScreen onEnter={() => setScreen('app')} />

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)', overflow:'hidden', maxWidth:520, margin:'0 auto' }}>

      {/* Header */}
      <header style={{ padding:'20px 20px 0', flexShrink:0 }}>
        {nav === 'home' ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:3 }}>SOMA</div>
                <div style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:1, marginTop:2 }}>ЗНАЙ КУДА УХОДЯТ ДЕНЬГИ</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                <IconBtn onClick={() => setScreen('splash')} title="Свернуть"><Minus size={13} /></IconBtn>
                <IconBtn onClick={() => setShowNewTab(true)} title="Новая вкладка"><Plus size={13} /></IconBtn>
                {user && <IconBtn onClick={handleSignOut} title="Выйти"><LogOut size={13} /></IconBtn>}
              </div>
            </div>

            {/* Account indicator */}
            <div style={{ marginTop:8, fontSize:11, color:'var(--text-dim)' }}>
              {user ? `👤 ${user.email}` : '👻 Гость — данные только на этом устройстве'}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {tabs.map((tab) => {
                const active = activeTabId === tab.id
                const txs = transactions.filter((t) => t.tabId === tab.id)
                const bal = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                          - txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return (
                  <button key={tab.id} onClick={() => setActiveTabId(tab.id)} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
                    border:`1.5px solid ${active ? tab.color : 'rgba(255,255,255,0.1)'}`,
                    background: active ? `${tab.color}22` : 'transparent',
                    color: active ? tab.color : 'rgba(255,255,255,0.38)',
                    fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.2s',
                  }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:tab.color, display:'inline-block' }} />
                    {tab.icon} {tab.name}
                    {active && (
                      <span style={{ fontSize:11, opacity:0.75 }}>
                        {bal >= 0 ? '+' : ''}{Math.round(bal).toLocaleString('ru-RU')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:3 }}>SOMA</div>
              <div style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:1, marginTop:1 }}>ЗНАЙ КУДА УХОДЯТ ДЕНЬГИ</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {user && <IconBtn onClick={handleSignOut} title="Выйти"><LogOut size={13} /></IconBtn>}
              <IconBtn onClick={() => setScreen('splash')}><Minus size={13} /></IconBtn>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main style={{ flex:1, overflowY:'auto', padding:'16px 20px 80px' }}>
        {nav === 'home'      && <HomeScreen      onAddTx={() => setShowAddTx(true)} />}
        {nav === 'analytics' && <AnalyticsScreen />}
        {nav === 'summary'   && <SummaryScreen   />}
        {nav === 'settings'  && <SettingsScreen  />}
      </main>

      <MicButton state={voice.state} label={voice.label} onStart={voice.start} onStop={voice.stop} />
      <BottomNav nav={nav} onNav={setNav} />

      {showNewTab && (
        <NewTabModal onClose={() => setShowNewTab(false)} onConfirm={(tab) => { addTab(tab); setActiveTabId(tab.id) }} />
      )}
      {showAddTx && (
        <AddTransactionModal onClose={() => setShowAddTx(false)} onConfirm={addTransactions} />
      )}
      {confirmTxs && (
        <ConfirmTransactionsModal transactions={confirmTxs} onConfirm={addTransactions} onClose={() => setConfirmTxs(null)} />
      )}
    </div>
  )
}

function IconBtn({ onClick, children, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:32, height:32, borderRadius:'50%',
      background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'background 0.15s',
    }}>
      {children}
    </button>
  )
}