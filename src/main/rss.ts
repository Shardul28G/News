import Parser from 'rss-parser'
import { randomUUID } from 'crypto'
import * as db from './db'
import { refactorArticle } from './gemini'
import type { Article, RssSource } from '../shared/types'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Reader News App/1.0' },
})

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} day ago`
}

async function fetchSource(source: RssSource): Promise<Omit<Article, 'read' | 'saved'>[]> {
  const feed = await parser.parseURL(source.url)
  return (feed.items ?? []).slice(0, 10).map((item) => {
    const body = item.contentSnippet ?? item.content ?? item.summary ?? ''
    const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString()
    return {
      id: `${source.id}:${item.guid ?? item.link ?? item.title ?? randomUUID()}`,
      category: 'world' as const,
      headline: item.title ?? 'Untitled',
      summary: body.slice(0, 500),
      source: source.name,
      sourceUrl: item.link ?? source.url,
      time: relativeTime(publishedAt),
      publishedAt,
      minutes: estimateReadTime(body),
      topics: [],
    }
  })
}

export type RefreshCallback = (status: { refreshing: boolean; error?: string }) => void

export async function runRefresh(onStatus: RefreshCallback): Promise<Article[]> {
  onStatus({ refreshing: true })
  const settings = db.getSettings()
  const enabled = settings.sources.filter((s) => s.enabled)

  const rawArticles: Omit<Article, 'read' | 'saved'>[] = []
  for (const source of enabled) {
    try {
      const items = await fetchSource(source)
      rawArticles.push(...items)
    } catch (err) {
      console.error(`RSS fetch failed for ${source.name}:`, err)
    }
  }

  const existing = db.getArticles()
  const existingIds = new Set(existing.map((a) => a.id))
  const newItems = rawArticles.filter((a) => !existingIds.has(a.id))

  const refactored: Omit<Article, 'read' | 'saved'>[] = []
  for (const item of newItems) {
    try {
      const result = await refactorArticle(item.headline, item.summary, settings.strictness)
      refactored.push({
        ...item,
        headline: result.headline,
        summary: result.summary,
        category: result.category,
        minutes: estimateReadTime(result.summary),
      })
    } catch (err) {
      console.error(`Refactor failed for "${item.headline}":`, err)
      refactored.push(item)
    }
  }

  const merged = db.upsertArticles(
    refactored.map((a) => ({ ...a, read: false, saved: false }))
  )
  db.saveSettings({ lastSyncAt: new Date().toISOString() })
  onStatus({ refreshing: false })
  return merged
}
