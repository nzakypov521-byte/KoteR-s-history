import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const DEFAULT_CATEGORIES = [
  'Food','Transport','Shopping','Salary','Freelance',
  'Entertainment','Health','Education','Bills','Housing',
  'Subscription','Supplies','Sales','Travel','Other',
]
export const TAB_ICONS   = ['💼','🏠','📁','💡','🎯','📦','💰','⚙️','🎨','🔧','🌍','🚀']
export const TAB_COLORS  = ['#8b5cf6','#10b981','#f97316','#3b82f6','#ec4899','#eab308','#ef4444','#64748b','#14b8a6']
export const CURRENCIES  = ['KGS','USD','RUB','KZT','UZS']
export const CURRENCY_SYMBOLS = { KGS:'с', USD:'$', RUB:'₽', KZT:'₸', UZS:'сўм' }

const DEFAULT_TAB = { id:'general', name:'Общее', icon:'💼', color:'#8b5cf6' }

export const uid     = () => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
export const fmt     = (n) => Math.abs(Math.round(n)).toLocaleString('ru-RU')
export const currSym = (c) => CURRENCY_SYMBOLS[c] ?? c

const useStore = create(
  persist(
    (set, get) => ({
      screen:      'splash',
      nav:         'home',
      tabs:        [DEFAULT_TAB],
      activeTabId: 'general',
      transactions:[],
      settings:    { baseCurrency:'KGS', categories:[...DEFAULT_CATEGORIES] },
      rates:       { USD:88.5, RUB:0.97, KZT:0.19, UZS:0.0069 },
      ratesUpdatedAt: null,
      currentUserId: null,   // null = гость

      setScreen:      (screen) => set({ screen }),
      setNav:         (nav)    => set({ nav }),
      setActiveTabId: (id)     => set({ activeTabId: id }),
      setRates:       (rates)  => set({ rates, ratesUpdatedAt: new Date().toISOString() }),

      // ── Установить текущего пользователя ──────────────────
      setCurrentUser: (userId) => set({ currentUserId: userId }),

      // ── Загрузить данные из Supabase (вызывается после входа) ─
      loadFromSupabase: async (userId) => {
        const [tabsRes, txRes, setRes] = await Promise.all([
          supabase.from('tabs').select('*').eq('user_id', userId),
          supabase.from('transactions').select('*').eq('user_id', userId),
          supabase.from('user_settings').select('*').eq('user_id', userId).single(),
        ])

        const tabs = tabsRes.data?.length
          ? tabsRes.data.map(({ user_id, ...t }) => t)
          : [DEFAULT_TAB]

        const transactions = (txRes.data ?? []).map(({ user_id, ...t }) => ({
          ...t,
          tabId: t.tab_id,
        }))

        const settings = setRes.data
          ? {
              baseCurrency: setRes.data.base_currency,
              categories:   setRes.data.categories,
            }
          : { baseCurrency:'KGS', categories:[...DEFAULT_CATEGORIES] }

        set({
          tabs,
          transactions,
          settings,
          activeTabId: tabs[0]?.id ?? 'general',
          currentUserId: userId,
        })

        // Если настроек нет — создаём
        if (!setRes.data) {
          await supabase.from('user_settings').upsert({
            user_id:       userId,
            base_currency: 'KGS',
            categories:    DEFAULT_CATEGORIES,
          })
        }

        // Если вкладок нет — создаём дефолтную
        if (!tabsRes.data?.length) {
          await supabase.from('tabs').insert({
            id: DEFAULT_TAB.id, user_id: userId,
            name: DEFAULT_TAB.name, icon: DEFAULT_TAB.icon, color: DEFAULT_TAB.color,
          })
        }
      },

      // ── Очистить данные при выходе ────────────────────────
      clearUserData: () => set({
        tabs:         [DEFAULT_TAB],
        transactions: [],
        settings:     { baseCurrency:'KGS', categories:[...DEFAULT_CATEGORIES] },
        activeTabId:  'general',
        currentUserId: null,
      }),

      // ── Вкладки ───────────────────────────────────────────
      addTab: async (tab) => {
        const { currentUserId } = get()
        const newTab = { ...tab, id: uid() }
        set((s) => ({ tabs: [...s.tabs, newTab] }))

        if (currentUserId) {
          await supabase.from('tabs').insert({
            id: newTab.id, user_id: currentUserId,
            name: newTab.name, icon: newTab.icon, color: newTab.color,
          })
        }
        return newTab
      },

      removeTab: async (id) => {
        const { currentUserId } = get()
        set((s) => ({
          tabs: s.tabs.filter((t) => t.id !== id),
          activeTabId: s.activeTabId === id ? 'general' : s.activeTabId,
        }))
        if (currentUserId) {
          await supabase.from('tabs').delete().eq('id', id)
        }
      },

      // ── Транзакции ────────────────────────────────────────
      addTransactions: async (items) => {
        const { activeTabId, currentUserId } = get()
        const newTxs = items.map((t) => ({
          id:          uid(),
          tabId:       activeTabId,
          type:        t.type,
          amount:      Number(t.amount),
          currency:    t.currency || get().settings.baseCurrency,
          description: t.description || t.category || 'Транзакция',
          category:    t.category || 'Other',
          date:        t.date || new Date().toISOString(),
          createdAt:   new Date().toISOString(),
        }))
        set((s) => ({ transactions: [...newTxs, ...s.transactions] }))

        if (currentUserId) {
          await supabase.from('transactions').insert(
            newTxs.map(({ tabId, createdAt, ...tx }) => ({
              ...tx,
              tab_id:     tabId,
              user_id:    currentUserId,
              created_at: createdAt,
            }))
          )
        }
      },

      deleteTransaction: async (id) => {
        const { currentUserId } = get()
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
        if (currentUserId) {
          await supabase.from('transactions').delete().eq('id', id)
        }
      },

      // ── Настройки ─────────────────────────────────────────
      updateSettings: async (patch) => {
        const { currentUserId } = get()
        set((s) => ({ settings: { ...s.settings, ...patch } }))
        if (currentUserId) await syncSettings(get)
      },

      addCategory: async (cat) => {
        const { currentUserId } = get()
        set((s) => ({ settings: { ...s.settings, categories: [...s.settings.categories, cat] } }))
        if (currentUserId) await syncSettings(get)
      },

      removeCategory: async (cat) => {
        const { currentUserId } = get()
        set((s) => ({ settings: { ...s.settings, categories: s.settings.categories.filter((c) => c !== cat) } }))
        if (currentUserId) await syncSettings(get)
      },

      getTabTxs:    (tabId) => get().transactions.filter((t) => t.tabId === (tabId ?? get().activeTabId)),
      getTabBalance:(tabId) => {
        const txs    = get().getTabTxs(tabId)
        const income  = txs.filter((t) => t.type === 'income').reduce((s,t) => s+t.amount, 0)
        const expense = txs.filter((t) => t.type === 'expense').reduce((s,t) => s+t.amount, 0)
        return { income, expense, balance: income - expense }
      },
    }),
    {
      name: 'soma-storage',
      partialize: (s) => ({
        tabs: s.tabs, activeTabId: s.activeTabId,
        transactions: s.transactions, settings: s.settings,
        rates: s.rates, ratesUpdatedAt: s.ratesUpdatedAt,
      }),
    }
  )
)

// Хелпер синхронизации настроек
async function syncSettings(get) {
  const { currentUserId, settings } = get()
  if (!currentUserId) return
  await supabase.from('user_settings').upsert({
    user_id:       currentUserId,
    base_currency: settings.baseCurrency,
    categories:    settings.categories,
    updated_at:    new Date().toISOString(),
  })
}

export default useStore