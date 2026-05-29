import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { Article, Settings, RssSource } from '../shared/types'

const DATA_DIR = app.getPath('userData')

const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

const DEFAULT_SOURCES: RssSource[] = [
  // India-centric sources
  { id: 'toi-top',   name: 'Times of India',   url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',           enabled: true,  defaultCategory: 'india' },
  { id: 'thehindu',  name: 'The Hindu',        url: 'https://www.thehindu.com/news/national/feeder/default.rss',            enabled: true,  defaultCategory: 'india' },
  { id: 'ie-india',  name: 'Indian Express',   url: 'https://indianexpress.com/section/india/feed/',                        enabled: true,  defaultCategory: 'india' },
  { id: 'ndtv',      name: 'NDTV',             url: 'https://feeds.feedburner.com/ndtvnews-top-stories',                    enabled: true,  defaultCategory: 'india' },
  { id: 'livemint',  name: 'Mint',             url: 'https://www.livemint.com/rss/news',                                    enabled: true,  defaultCategory: 'business' },
  { id: 'bs-india',  name: 'Business Standard',url: 'https://www.business-standard.com/rss/latest.rss',                     enabled: true,  defaultCategory: 'business' },
  { id: 'sci-hindu', name: 'The Hindu Sci-Tech',url: 'https://www.thehindu.com/sci-tech/feeder/default.rss',                enabled: true,  defaultCategory: 'science' },

  // International
  { id: 'reuters-world', name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best',  enabled: true,  defaultCategory: 'world' },
  { id: 'bbc',           name: 'BBC',           url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                          enabled: true,  defaultCategory: 'world' },
  { id: 'bbc-sci',       name: 'BBC Sci/Env',   url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',       enabled: true,  defaultCategory: 'science' },
  { id: 'bbc-tech',      name: 'BBC Tech',      url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',                    enabled: true,  defaultCategory: 'tech' },
  { id: 'bbc-biz',       name: 'BBC Business',  url: 'https://feeds.bbci.co.uk/news/business/rss.xml',                      enabled: true,  defaultCategory: 'business' },
  { id: 'bbc-health',    name: 'BBC Health',    url: 'https://feeds.bbci.co.uk/news/health/rss.xml',                        enabled: true,  defaultCategory: 'health' },
  { id: 'guardian-env',  name: 'Guardian Climate',url: 'https://www.theguardian.com/environment/climate-crisis/rss',        enabled: true,  defaultCategory: 'climate' },
  { id: 'ars',           name: 'Ars Technica',  url: 'https://feeds.arstechnica.com/arstechnica/index',                     enabled: true,  defaultCategory: 'tech' },
  { id: 'sciencedaily',  name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/top/science.xml',                    enabled: true,  defaultCategory: 'science' },
]

const DEFAULT_SETTINGS: Settings = {
  strictness: 'medium',
  sources: DEFAULT_SOURCES,
  refreshIntervalMinutes: 30,
  lastSyncAt: null,
  llmProvider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'gemma4:e2b',
  geminiModel: 'gemini-2.5-flash',
  maxArticlesPerRefresh: 10,
  mergeSimilarStories: true,
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
  const savedSources = saved.sources ?? []
  const defaultById = new Map(DEFAULT_SOURCES.map((d) => [d.id, d]))
  const savedIds = new Set(savedSources.map((s) => s.id))

  // For each saved source, overlay any missing fields (like defaultCategory) from
  // the default with the same id. This heals settings written by older app versions.
  const overlaidSaved: RssSource[] = savedSources.map((s) => {
    const def = defaultById.get(s.id)
    if (!def) return s
    return {
      ...s,
      defaultCategory: s.defaultCategory ?? def.defaultCategory,
    }
  })

  const mergedSources: RssSource[] = [
    ...overlaidSaved,
    ...DEFAULT_SOURCES.filter((d) => !savedIds.has(d.id)),
  ]
  return { ...DEFAULT_SETTINGS, ...saved, sources: mergedSources }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const current = getSettings()
  const updated = { ...current, ...patch }
  writeJSON(SETTINGS_FILE, updated)
  return updated
}

/** Reset sources to the latest defaults. Used to refresh source lists after app updates. */
export function resetSources(): Settings {
  return saveSettings({ sources: DEFAULT_SOURCES })
}
