import Parser from 'rss-parser'
import { createHash } from 'crypto'
import * as db from './db'
import { refactorArticle, clusterHeadlines, synthesizeCluster } from './llm'
import type { Article, ArticleSource, RssSource } from '../shared/types'

interface ExtendedItem {
  title?: string
  link?: string
  guid?: string
  isoDate?: string
  pubDate?: string
  contentSnippet?: string
  content?: string
  summary?: string
  'content:encoded'?: string
}

const parser: Parser<unknown, ExtendedItem> = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'ReaderNews/1.0 (+https://example.local)' },
  customFields: {
    item: [['content:encoded', 'content:encoded']],
  },
})

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashId(...parts: string[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16)
}

// Cache the dynamic import so we only pay the cost once.
let _extractCache: ((url: string) => Promise<{ content?: string } | null>) | null = null
async function getExtractor(): Promise<(url: string) => Promise<{ content?: string } | null>> {
  if (_extractCache) return _extractCache
  // @extractus/article-extractor is ESM-only; load via dynamic import.
  const mod = (await import('@extractus/article-extractor')) as { extract: (url: string) => Promise<{ content?: string } | null> }
  _extractCache = mod.extract
  return _extractCache
}

/** Try to fetch and extract the full article body. Falls back gracefully. */
async function fetchFullText(url: string): Promise<string | null> {
  try {
    const extract = await getExtractor()
    const result = await extract(url)
    if (result?.content) {
      const text = stripHTML(result.content)
      if (text.length > 200) return text
    }
  } catch {
    /* ignore */
  }
  return null
}

interface RawItem {
  id: string
  source: string
  sourceUrl: string
  rssTitle: string
  rssBody: string
  publishedAt: string
}

async function readFeed(source: RssSource): Promise<RawItem[]> {
  const feed = await parser.parseURL(source.url)
  return (feed.items ?? []).slice(0, 8).map((item) => {
    const rawBody =
      item['content:encoded'] ??
      item.content ??
      item.summary ??
      item.contentSnippet ??
      ''
    const body = stripHTML(rawBody)
    const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString()
    const id = hashId(source.id, item.guid ?? item.link ?? item.title ?? publishedAt)
    return {
      id,
      source: source.name,
      sourceUrl: item.link ?? source.url,
      rssTitle: item.title ?? 'Untitled',
      rssBody: body,
      publishedAt,
    }
  })
}

export type RefreshCallback = (status: { refreshing: boolean; error?: string; message?: string }) => void

export async function runRefresh(
  onStatus: RefreshCallback,
  categoryFilter?: string,
): Promise<Article[]> {
  const settings = db.getSettings()
  let enabled = settings.sources.filter((s) => s.enabled)

  // When refreshing from a specific category tab, only hit sources tagged with that category.
  // Falls back to all enabled sources if no source matches (e.g. user added category but has no source for it).
  if (categoryFilter && categoryFilter !== 'all') {
    const filtered = enabled.filter((s) => s.defaultCategory === categoryFilter)
    if (filtered.length > 0) {
      enabled = filtered
      onStatus({
        refreshing: true,
        message: `Fetching ${filtered.length} ${categoryFilter} source${filtered.length === 1 ? '' : 's'}…`,
      })
    } else {
      onStatus({
        refreshing: true,
        message: `No sources tagged "${categoryFilter}" — fetching all feeds…`,
      })
    }
  } else {
    onStatus({ refreshing: true, message: 'Fetching RSS feeds…' })
  }

  // 1. Pull from all feeds in parallel
  const feedResults = await Promise.allSettled(
    enabled.map((s) => readFeed(s).then((items) => ({ source: s, items })))
  )

  const sourceFor = new Map<string, RssSource>()
  const rawItems: RawItem[] = []
  for (let i = 0; i < feedResults.length; i++) {
    const r = feedResults[i]
    const src = enabled[i]
    if (r.status === 'fulfilled') {
      for (const item of r.value.items) {
        sourceFor.set(item.id, src)
        rawItems.push(item)
      }
    } else {
      console.error(`Feed failed: ${src.name}`, r.reason)
    }
  }

  // 2. Filter to genuinely new items
  const existing = db.getArticles()
  const existingIds = new Set(existing.map((a) => a.id))
  const newItems = rawItems
    .filter((a) => !existingIds.has(a.id))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, Math.max(1, settings.maxArticlesPerRefresh ?? 10))

  onStatus({
    refreshing: true,
    message: `Refactoring ${newItems.length} article${newItems.length === 1 ? '' : 's'}…`,
  })

  // 3. Enrich each new item with full article body (used for both refactor & synthesis)
  const enriched: { raw: RawItem; src?: RssSource; body: string }[] = []
  for (let i = 0; i < newItems.length; i++) {
    const raw = newItems[i]
    onStatus({
      refreshing: true,
      message: `Fetching article ${i + 1}/${newItems.length}: ${raw.source}`,
    })
    let body = raw.rssBody
    if (body.length < 600) {
      const full = await fetchFullText(raw.sourceUrl)
      if (full) body = full
    }
    if (!body || body.length < 80) body = raw.rssTitle // last resort
    enriched.push({ raw, src: sourceFor.get(raw.id), body })
  }

  // 4. Optionally cluster same-event stories so they get synthesized into one article.
  let groups: number[][]
  if (settings.mergeSimilarStories && enriched.length > 1) {
    onStatus({ refreshing: true, message: 'Detecting duplicate coverage…' })
    groups = await clusterHeadlines(
      enriched.map((e, index) => ({ index, source: e.raw.source, headline: e.raw.rssTitle })),
      settings,
    )
  } else {
    groups = enriched.map((_, index) => [index])
  }

  // 5. Refactor singletons / synthesize multi-source clusters.
  const refactored: Article[] = []
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    const members = group.map((idx) => enriched[idx]).filter(Boolean)
    if (members.length === 0) continue

    // Primary (most recent) member drives id, url, timestamp.
    const primary = members
      .slice()
      .sort((a, b) => new Date(b.raw.publishedAt).getTime() - new Date(a.raw.publishedAt).getTime())[0]
    const hint = primary.src?.defaultCategory
    const sources: ArticleSource[] = members.map((m) => ({ name: m.raw.source, url: m.raw.sourceUrl }))

    onStatus({
      refreshing: true,
      message: members.length > 1
        ? `Synthesizing ${g + 1}/${groups.length} from ${members.length} sources…`
        : `Refactoring ${g + 1}/${groups.length}: ${primary.raw.source}`,
    })

    try {
      const result = members.length > 1
        ? await synthesizeCluster(
            members.map((m) => ({ source: m.raw.source, title: m.raw.rssTitle, body: m.body })),
            settings,
            hint,
          )
        : await refactorArticle(primary.raw.rssTitle, primary.body, settings, hint)

      refactored.push({
        id: primary.raw.id,
        category: result.category,
        headline: result.headline || primary.raw.rssTitle,
        summary: result.summary || primary.body.slice(0, 600),
        source: primary.raw.source,
        sourceUrl: primary.raw.sourceUrl,
        sources,
        time: relativeTime(primary.raw.publishedAt),
        publishedAt: primary.raw.publishedAt,
        minutes: estimateReadTime(result.summary || primary.body),
        topics: [],
        read: false,
        saved: false,
      })
    } catch (err) {
      console.error(`Refactor failed for "${primary.raw.rssTitle}":`, err)
      refactored.push({
        id: primary.raw.id,
        category: hint ?? 'world',
        headline: primary.raw.rssTitle,
        summary: primary.body.slice(0, 800),
        source: primary.raw.source,
        sourceUrl: primary.raw.sourceUrl,
        sources,
        time: relativeTime(primary.raw.publishedAt),
        publishedAt: primary.raw.publishedAt,
        minutes: estimateReadTime(primary.body),
        topics: [],
        read: false,
        saved: false,
      })
    }
  }

  const merged = db.upsertArticles(refactored)
  db.saveSettings({ lastSyncAt: new Date().toISOString() })
  onStatus({
    refreshing: false,
    message: `Refresh complete: ${refactored.length} new article${refactored.length === 1 ? '' : 's'}`,
  })
  return merged
}
