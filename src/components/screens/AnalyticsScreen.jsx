// src/components/screens/AnalyticsScreen.jsx
import { useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import useStore, { fmt } from '../../store'
import dayjs from 'dayjs'

const COLORS = ['#8b5cf6','#10b981','#f97316','#3b82f6','#ec4899','#eab308','#ef4444','#14b8a6','#f43f5e','#64748b']
const MONTHS_S = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

const TAX_RATES = { Патент: null, УСН: 0.06, ОРН: 0.10 }

export default function AnalyticsScreen() {
  const activeTabId  = useStore((s) => s.activeTabId)
  const transactions = useStore((s) => s.transactions)

  const [txType,   setTxType]   = useState('expense')
  const [chartView,setChartView]= useState('Pie')
  const [from,     setFrom]     = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,       setTo]       = useState(dayjs().format('YYYY-MM-DD'))
  const [taxMode,  setTaxMode]  = useState('УСН')

  // ── Category aggregation for pie/bar ──
  const catData = (() => {
    const map = {}
    transactions
      .filter((t) => t.tabId === activeTabId && t.type === txType
        && dayjs(t.date) >= dayjs(from) && dayjs(t.date) <= dayjs(to).endOf('day'))
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  })()

  // ── 6-month trend ──
  const trendData = (() => {
    const res = []
    for (let i = 5; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month')
      const yr = d.year(); const mo = d.month()
      const txs = transactions.filter((t) => {
        if (t.tabId !== activeTabId) return false
        const td = dayjs(t.date)
        return td.year() === yr && td.month() === mo
      })
      res.push({
        label: MONTHS_S[mo],
        income:  txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return res
  })()

  // ── Tax estimate ──
  const incomeTotal = transactions
    .filter((t) => t.tabId === activeTabId && t.type === 'income'
      && dayjs(t.date) >= dayjs(from) && dayjs(t.date) <= dayjs(to).endOf('day'))
    .reduce((s, t) => s + t.amount, 0)
  const rate = TAX_RATES[taxMode]
  const taxEst = rate != null ? Math.round(incomeTotal * rate) : null

  const totalPeriod = catData.reduce((s, d) => s + d.value, 0)

  const tooltipStyle = {
    background: '#1a1a2e', border: 'none', borderRadius: 8,
    fontSize: 12, color: '#fff',
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Type toggle ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            onClick={() => setTxType(t)}
            style={{
              padding: '10px', borderRadius: 12, border: `1px solid ${txType === t ? (t === 'expense' ? 'var(--red)' : 'var(--green)') : 'var(--border)'}`,
              background: txType === t ? (t === 'expense' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)') : 'transparent',
              color: txType === t ? (t === 'expense' ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t === 'expense' ? 'Расходы' : 'Доходы'}
          </button>
        ))}
      </div>

      {/* ── Date range ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['ОТ', from, setFrom], ['ДО', to, setTo]].map(([label, val, set]) => (
          <div key={label}>
            <div className="section-label" style={{ marginBottom: 6 }}>{label}</div>
            <input
              type="date"
              className="input-field"
              value={val}
              onChange={(e) => set(e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* ── Chart type ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        background: 'var(--surface)', borderRadius: 12, padding: 4, gap: 4,
        border: '1px solid var(--border)',
      }}>
        {['Pie', 'Bar', 'Trend'].map((v) => (
          <button
            key={v}
            onClick={() => setChartView(v)}
            style={{
              padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: chartView === v ? 'var(--purple)' : 'transparent',
              color: chartView === v ? '#fff' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ── Chart area ── */}
      <div className="card" style={{ padding: 20 }}>
        {chartView === 'Pie' && (
          catData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={54} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `с${Number(v).toLocaleString('ru-RU')}`} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>

              <div className="section-label" style={{ marginBottom: 6, marginTop: 14 }}>
                {txType === 'expense' ? 'РАСХОДЫ' : 'ДОХОДЫ'} ЗА ПЕРИОД
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: txType === 'expense' ? 'var(--red)' : 'var(--green)', marginBottom: 16 }}>
                с{totalPeriod.toLocaleString('ru-RU')}
              </div>

              {catData.map((d, i) => {
                const pct = totalPeriod ? Math.round(d.value / totalPeriod * 100) : 0
                return (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{d.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>с{d.value.toLocaleString('ru-RU')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>{pct}%</span>
                  </div>
                )
              })}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              Нет данных за выбранный период
            </div>
          )
        )}

        {chartView === 'Bar' && (
          catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} margin={{ top: 0, right: 0, bottom: 24, left: -24 }}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `с${Number(v).toLocaleString('ru-RU')}`} contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              Нет данных за выбранный период
            </div>
          )
        )}

        {chartView === 'Trend' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 0, right: 0, bottom: 24, left: -24 }}>
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `с${Number(v).toLocaleString('ru-RU')}`} contentStyle={tooltipStyle} />
              <Bar dataKey="income"  name="Доходы"  fill="#10b981" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[5, 5, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tax estimate ── */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>ПРОГНОЗ НАЛОГА</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 18 }}>
          {['Патент', 'УСН', 'ОРН'].map((m) => (
            <button
              key={m}
              onClick={() => setTaxMode(m)}
              style={{
                padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: taxMode === m ? '#92400e' : 'rgba(255,255,255,0.06)',
                color: taxMode === m ? '#fbbf24' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Доходы за период</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>с{Math.round(incomeTotal).toLocaleString('ru-RU')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Оценка налога</div>
            {rate != null && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{rate * 100}% от доходов</div>}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ca8a04' }}>
            {taxEst != null ? `с${taxEst.toLocaleString('ru-RU')}` : '—'}
          </div>
        </div>

        {taxMode === 'Патент' && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Фиксированная ставка зависит от вида деятельности и региона
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Оценка. Точную сумму уточните у бухгалтера.
        </div>
      </div>
    </div>
  )
}
