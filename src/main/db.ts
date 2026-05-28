import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { Article, Settings, RssSource } from '../shared/types'

const DATA_DIR = app.getPath('userData')

const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

const DEFAULT_SOURCES: RssSource[] = [
  { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews', enabled: true },
  { id: 'bbc', name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', enabled: true },
  { id: 'guardian', name: 'Guardian', url: 'https://www.theguardian.com/world/rss', enabled: true },
  { id: 'ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', enabled: true },
  { id: 'nyt', name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nf/World.xml', enabled: false },
]

const DEFAULT_SETTINGS: Settings = {
  strictness: 'medium',
  sources: DEFAULT_SOURCES,
  refreshIntervalMinutes: 15,
  lastSyncAt: null,
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJSON<T>(file: string, data: T): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

export function getArticles(): Article[] {
  return readJSON<Article[]>(ARTICLES_FILE, [])
}

export function saveArticles(articles: Article[]): void {
  writeJSON(ARTICLES_FILE, articles)
}

export function upsertArticles(incoming: Article[]): Article[] {
  const existing = getArticles()
  const byId = new Map(existing.map((a) => [a.id, a]))
  for (const a of incoming) {
    const prev = byId.get(a.id)
    byId.set(a.id, { ...a, read: prev?.read ?? false, saved: prev?.saved ?? false })
  }
  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  saveArticles(merged)
  return merged
}

export function markRead(id: string): Article[] {
  const articles = getArticles()
  const updated = articles.map((a) => (a.id === id ? { ...a, read: true } : a))
  saveArticles(updated)
  return updated
}

export function getSettings(): Settings {
  const saved = readJSON<Partial<Settings>>(SETTINGS_FILE, {})
  return { ...DEFAULT_SETTINGS, ...saved, sources: saved.sources ?? DEFAULT_SETTINGS.sources }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const current = getSettings()
  const updated = { ...current, ...patch }
  writeJSON(SETTINGS_FILE, updated)
  return updated
}
