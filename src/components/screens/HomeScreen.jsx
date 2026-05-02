// src/components/screens/HomeScreen.jsx
import { useState } from 'react'
import { Plus, Minus, RefreshCw } from 'lucide-react'
import useStore, { fmt, currSym } from '../../store'
import { fetchRatesFromKGS, toBase, RATE_DISPLAY } from '../../utils/currency'
import dayjs from 'dayjs'

const MONTHS = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ',
                 'ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']

export default function HomeScreen({ onAddTx }) {
  const activeTabId    = useStore((s) => s.activeTabId)
  const transactions   = useStore((s) => s.transactions)
  const rates          = useStore((s) => s.rates)
  const baseCurrency   = useStore((s) => s.settings.baseCurrency)
  const setRates       = useStore((s) => s.setRates)
  const deleteTransaction = useStore((s) => s.deleteTransaction)

  const [ratesLoading, setRatesLoading] = useState(false)

  const tabTxs = transactions.filter((t) => t.tabId === activeTabId)

  // ── Баг 3: конвертируем каждую транзакцию в базовую валюту перед суммированием
  const toB = (tx) => toBase(tx.amount, tx.currency, baseCurrency, rates)

  const income  = tabTxs.filter((t) => t.type === 'income').reduce((s, t) => s + toB(t), 0)
  const expense = tabTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + toB(t), 0)
  const balance = income - expense

  const monthLabel = MONTHS[new Date().getMonth()]
  const sym = currSym(baseCurrency)  // Баг 1: используем базовую валюту

  const refreshRates = async () => {
    setRatesLoading(true)
    try { setRates(await fetchRatesFromKGS()) } catch (_) {}
    setRatesLoading(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Balance card ── */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div className="section-label" style={{ marginBottom: 8 }}>
          БАЛАНС · {monthLabel}
        </div>
        {/* Баг 1: sym — базовая валюта, не всегда сом */}
        <div style={{
          fontSize: 44, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1,
          color: balance >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {balance >= 0 ? '+' : '−'}{sym}{fmt(balance)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginTop: 18 }}>
          {[
            { label: 'ДОХОДЫ',  val: income,  col: 'var(--green)' },
            { label: 'РАСХОДЫ', val: expense, col: 'var(--red)'   },
          ].map(({ label, val, col }) => (
            <div key={label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: col }}>{sym}{fmt(val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rates card ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="section-label">КУРС К СОМУ</span>
          <button
            onClick={refreshRates}
            disabled={ratesLoading}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <RefreshCw size={13} style={{ animation: ratesLoading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
          {RATE_DISPLAY.map(({ sym: s, code }) => (
            <div key={code} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{s}</div>
              <div style={{ fontSize: 14, marginTop: 3 }}>{rates[code]}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>сом</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transactions ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="section-label">TRANSACTIONS</span>
          <button
            onClick={onAddTx}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              color: 'var(--purple-light)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 18px', borderBottom: '1px solid var(--border)',
          }}>
            <span className="section-label">TRANSACTIONS</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{tabTxs.length} items</span>
          </div>

          {tabTxs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              🎤 Нажмите на микрофон и скажите транзакцию
            </div>
          ) : (
            tabTxs.map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                baseCurrency={baseCurrency}
                rates={rates}
                onDelete={deleteTransaction}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TxRow({ tx, baseCurrency, rates, onDelete }) {
  const isIncome = tx.type === 'income'
  const isForeign = tx.currency !== baseCurrency

  // Баг 2: сумма в базовой валюте (если валюта отличается)
  const baseAmount = isForeign
    ? toBase(tx.amount, tx.currency, baseCurrency, rates)
    : null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.025)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div className="icon-circle" style={{
        background: isIncome ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
        color: isIncome ? 'var(--green)' : 'var(--red)',
      }}>
        {(tx.category || 'OT').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {tx.category} · {dayjs(tx.date).format('D MMM')}
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {/* Оригинальная сумма */}
        <div style={{ fontSize: 15, fontWeight: 600, color: isIncome ? 'var(--green)' : 'var(--red)' }}>
          {isIncome ? '+' : '−'}{currSym(tx.currency)}{fmt(tx.amount)}
        </div>
        {/* Баг 2: сумма в базовой валюте, если отличается */}
        {isForeign && baseAmount != null && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
            ≈ {currSym(baseCurrency)}{fmt(baseAmount)}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(tx.id)}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', padding: 4, flexShrink: 0 }}
      >
        <Minus size={13} />
      </button>
    </div>
  )
}