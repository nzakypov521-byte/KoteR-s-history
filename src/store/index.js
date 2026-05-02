import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'

// ── Default data ──────────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Salary', 'Freelance',
  'Entertainment', 'Health', 'Education', 'Bills', 'Housing',
  'Subscription', 'Supplies', 'Sales', 'Travel', 'Other',
]

export const TAB_ICONS = ['💼','🏠','📁','💡','🎯','📦','💰','⚙️','🎨','🔧','🌍','🚀']
export const TAB_COLORS = ['#8b5cf6','#10b981','#f97316','#3b82f6','#ec4899','#eab308','#ef4444','#64748b','#14b8a6']

export const CURRENCIES = ['KGS', 'USD', 'RUB', 'KZT', 'UZS']
export const CURRENCY_SYMBOLS = { KGS: 'с', USD: '$', RUB: '₽', KZT: '₸', UZS: 'сўм' }

const DEFAULT_TAB = { id: 'general', name: 'Общее', icon: '💼', color: '#8b5cf6' }

// ── Helpers ───────────────────────────────────────────────────────────────────
export const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const fmt = (n) => Math.abs(Math.round(n)).toLocaleString('ru-RU')

export const currSym = (c) => CURRENCY_SYMBOLS[c] ?? c

// ── Store ─────────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // ─ Screen / Nav ─
      screen: 'splash',   // 'splash' | 'app'
      nav: 'home',        // 'home' | 'analytics' | 'summary' | 'settings'

      // ─ Tabs ─
      tabs: [DEFAULT_TAB],
      activeTabId: 'general',

      // ─ Transactions ─
      transactions: [],

      // ─ Settings ─
      settings: {
        baseCurrency: 'KGS',
        categories: [...DEFAULT_CATEGORIES],
      },

      // ─ Exchange rates (to KGS) ─
      rates: { USD: 88.5, RUB: 0.97, KZT: 0.19, UZS: 0.0069 },
      ratesUpdatedAt: null,

      // ── Actions ──────────────────────────────────────────────────────────────

      setScreen: (screen) => set({ screen }),
      setNav: (nav) => set({ nav }),
      setActiveTabId: (id) => set({ activeTabId: id }),

      // Tabs
      addTab: (tab) => set((s) => ({ tabs: [...s.tabs, { ...tab, id: uid() }] })),
      removeTab: (id) => set((s) => ({
        tabs: s.tabs.filter((t) => t.id !== id),
        activeTabId: s.activeTabId === id ? 'general' : s.activeTabId,
      })),

      // Transactions
      addTransactions: (items) => {
        const { activeTabId } = get()
        const newTxs = items.map((t) => ({
          id: uid(),
          tabId: activeTabId,
          type: t.type,
          amount: Number(t.amount),
          currency: t.currency || get().settings.baseCurrency,
          description: t.description || t.category || 'Транзакция',
          category: t.category || 'Other',
          date: t.date || new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }))
        set((s) => ({ transactions: [...newTxs, ...s.transactions] }))
      },
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      // Settings
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      addCategory: (cat) =>
        set((s) => ({
          settings: {
            ...s.settings,
            categories: [...s.settings.categories, cat],
          },
        })),
      removeCategory: (cat) =>
        set((s) => ({
          settings: {
            ...s.settings,
            categories: s.settings.categories.filter((c) => c !== cat),
          },
        })),

      // Rates
      setRates: (rates) => set({ rates, ratesUpdatedAt: new Date().toISOString() }),

      // ── Selectors (functions so they always use latest state) ─────────────
      getTabTxs: (tabId) => {
        const { transactions, activeTabId } = get()
        return transactions.filter((t) => t.tabId === (tabId ?? activeTabId))
      },

      getTabBalance: (tabId) => {
        const txs = get().getTabTxs(tabId)
        const income  = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return { income, expense, balance: income - expense }
      },
    }),
    {
      name: 'soma-storage',
      // Only persist data, not UI state
      partialize: (s) => ({
        tabs: s.tabs,
        activeTabId: s.activeTabId,
        transactions: s.transactions,
        settings: s.settings,
        rates: s.rates,
        ratesUpdatedAt: s.ratesUpdatedAt,
      }),
    }
  )
)

export default useStore
