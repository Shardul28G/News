import { create } from 'zustand'
import type { Article, Category, Settings } from '../../shared/types'
import { SEED_ARTICLES } from './tokens'

interface FeedState {
  articles: Article[]
  category: Category
  query: string
  selectedId: string | null
  refreshing: boolean
  lastSyncAt: string | null
  settings: Settings | null
  settingsOpen: boolean

  setArticles: (articles: Article[]) => void
  setCategory: (cat: Category) => void
  setQuery: (q: string) => void
  setSelectedId: (id: string | null) => void
  setRefreshing: (v: boolean) => void
  setSettings: (s: Settings) => void
  setSettingsOpen: (v: boolean) => void
  markRead: (id: string) => void

  filteredArticles: () => Article[]
}

export const useFeedStore = create<FeedState>((set, get) => ({
  articles: SEED_ARTICLES,
  category: 'all',
  query: '',
  selectedId: null,
  refreshing: false,
  lastSyncAt: null,
  settings: null,
  settingsOpen: false,

  setArticles: (articles) => set({ articles }),
  setCategory: (category) => set({ category, selectedId: null }),
  setQuery: (query) => set({ query }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setSettings: (settings) => set({ settings, lastSyncAt: settings.lastSyncAt }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  markRead: (id) =>
    set((s) => ({
      articles: s.articles.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),

  filteredArticles: () => {
    const { articles, category, query } = get()
    return articles.filter((a) => {
      if (category !== 'all' && a.category !== category) return false
      if (query) {
        const q = query.toLowerCase()
        if (!(a.headline + ' ' + a.summary).toLowerCase().includes(q)) return false
      }
      return true
    })
  },
}))
