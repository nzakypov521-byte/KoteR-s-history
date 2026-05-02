// src/components/screens/SummaryScreen.jsx
import { useState } from 'react'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import useStore, { fmt, currSym } from '../../store'
import dayjs from 'dayjs'

const MONTHS_RU = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ']

export default function SummaryScreen() {
  const tabs        = useStore((s) => s.tabs)
  const transactions= useStore((s) => s.transactions)
  const activeTabId = useStore((s) => s.activeTabId)

  const [selectedTab, setSelectedTab] = useState(activeTabId)
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [to,   setTo]   = useState(dayjs().format('YYYY-MM-DD'))

  const filtered = transactions.filter((t) =>
    t.tabId === selectedTab
    && dayjs(t.date) >= dayjs(from)
    && dayjs(t.date) <= dayjs(to).endOf('day')
  )
  const income  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net     = income - expense

  const exportXLSX = () => {
    const tab = tabs.find((t) => t.id === selectedTab)
    const rows = filtered.map((t) => ({
      'Дата':           dayjs(t.date).format('YYYY-MM-DD'),
      'Описание':       t.description,
      'Сумма':          t.amount,
      'Валюта':         t.currency,
      'Категория':      t.category,
      'Тип':            t.type === 'income' ? 'income' : 'expense',
      'Сумма в KGS':    t.amount,
      'Налоговая база': t.type === 'income' ? t.amount : '',
      'Тип операции':   t.type === 'income' ? 'Доход (налогооблагаемый)' : 'Расход',
      'Период':         `${MONTHS_RU[dayjs(t.date).month()]} ${dayjs(t.date).year()} г.`,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Транзакции')
    XLSX.writeFile(wb, `SOMA_${tab?.name ?? 'export'}_${from}_${to}.xlsx`)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Tab select */}
      <select
        value={selectedTab}
        onChange={(e) => setSelectedTab(e.target.value)}
        className="input-field"
      >
        {tabs.map((t) => (
          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
        ))}
      </select>

      {/* Date range */}
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'Транзакций', val: filtered.length, col: 'var(--text)', isNum: true },
          { label: 'Доходы',     val: income,  col: 'var(--green)' },
          { label: 'Расходы',    val: expense, col: 'var(--red)'   },
        ].map(({ label, val, col, isNum }) => (
          <div key={label} className="card" style={{ padding: '14px 10px', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: isNum ? 26 : 17, fontWeight: 700, color: col }}>
              {isNum ? val : `с${fmt(val)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Net */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Итого</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {net >= 0 ? '+' : '−'}с{fmt(net)}
        </span>
      </div>

      {/* Export */}
      <button
        onClick={exportXLSX}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: 15, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--purple), var(--purple-dark))',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Download size={18} /> Выгрузить сводку (.xlsx)
      </button>
    </div>
  )
}
