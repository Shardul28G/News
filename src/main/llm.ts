import { spawn } from 'child_process'
import type { ArticleCategory, Settings, Strictness } from '../shared/types'

const SYSTEM_RULES: Record<Strictness, string> = {
  light: `Remove sensationalist / clickbait phrasing and fear-mongering vocabulary. Otherwise keep the text close to the original.`,

  medium: `Remove the following WITHOUT EXCEPTION:
- Sensationalist / clickbait phrasing ("SHOCKING", "you won't believe")
- Fear-mongering vocabulary ("crisis", "catastrophe", "panic", "spirals")
- Loaded political adjectives ("radical", "extremist", "slammed", "blasted")
- Emotional manipulation and outrage framing
- Violent or graphic imagery in headlines
- Identity-based othering language`,

  aggressive: `Remove all of the following WITHOUT EXCEPTION:
- Sensationalist / clickbait phrasing
- Fear-mongering vocabulary
- Loaded political adjectives
- Emotional manipulation and outrage framing
- Violent or graphic imagery in headlines
- Identity-based othering language
- Rhetorical questions
- Scare quotes used for editorial effect
- Second-person address ("you", "your")`,
}

const CATEGORIES: ArticleCategory[] = [
  'india', 'politics', 'business', 'tech', 'world', 'climate', 'science', 'health',
]

/** Map common synonyms / verbose forms back to our canonical category. */
const CATEGORY_SYNONYMS: Record<string, ArticleCategory> = {
  technology: 'tech', technical: 'tech', it: 'tech', software: 'tech', ai: 'tech', computing: 'tech',
  scientific: 'science', sci: 'science', research: 'science', 'sci-tech': 'science',
  healthcare: 'health', medical: 'health', medicine: 'health',
  environment: 'climate', environmental: 'climate', 'climate-change': 'climate', sustainability: 'climate',
  finance: 'business', economy: 'business', markets: 'business', economic: 'business',
  political: 'politics', government: 'politics', govt: 'politics',
  international: 'world', global: 'world', foreign: 'world',
  indian: 'india', bharat: 'india', national: 'india',
}

function normalizeCategory(raw: string): ArticleCategory | null {
  const c = raw.toLowerCase().trim().replace(/[._\s]+/g, '-')
  if ((CATEGORIES as string[]).includes(c)) return c as ArticleCategory
  if (CATEGORY_SYNONYMS[c]) return CATEGORY_SYNONYMS[c]
  return null
}

export interface RefactorResult {
  headline: string
  summary: string
  category: ArticleCategory
}

function buildPrompt(title: string, body: string, strictness: Strictness, hintCategory?: ArticleCategory): string {
  const rules = SYSTEM_RULES[strictness]
  const categoryList = CATEGORIES.join(' | ')
  const hint = hintCategory
    ? `IMPORTANT: This article comes from a "${hintCategory}"-focused publication. Use category "${hintCategory}" UNLESS the article is clearly and entirely about a different topic. When in any doubt, choose "${hintCategory}".`
    : ''
  return `You are a calm, dry, wire-service news copy editor.

Rewrite the article and headline below into NEUTRAL, FACTUAL language.

Hard rules:
- Preserve all facts, figures, names, dates, quotes, and attributions EXACTLY.
- ${rules}
- Tone: dry, calm, factual. Past tense for completed events. Active voice.
- The "summary" field MUST be 2 to 3 PARAGRAPHS separated by "\\n\\n" (a blank line between paragraphs). Each paragraph 2-4 sentences. Total 120-220 words. Do NOT produce a one-liner.
- The "headline" should be a single neutral sentence, no all-caps, no question marks, no exclamation marks.

Then classify the article into exactly ONE of these categories: ${categoryList}.
"india" = stories primarily about India (Indian politics, economy, society, regional events).
"world" = international affairs outside India.
${hint}

Output ONLY valid JSON, no markdown, no commentary. Exact shape:
{ "headline": "...", "summary": "para1\\n\\npara2\\n\\npara3", "category": "..." }

==== ARTICLE ====
Title: ${title}

Body:
${body.slice(0, 4500)}
==== END ====`
}

function extractJSON(raw: string, hintCategory?: ArticleCategory): RefactorResult {
  // Tolerate ```json fences and surrounding chatter
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in LLM output')

  let parsed: { headline?: unknown; summary?: unknown; category?: unknown }
  try {
    parsed = JSON.parse(match[0])
  } catch {
    // Try to repair by trimming after last brace
    const lastBrace = match[0].lastIndexOf('}')
    parsed = JSON.parse(match[0].slice(0, lastBrace + 1))
  }

  const catRaw = String(parsed.category ?? '')
  const category: ArticleCategory = normalizeCategory(catRaw) ?? hintCategory ?? 'world'

  return {
    headline: String(parsed.headline ?? '').trim(),
    summary: String(parsed.summary ?? '').trim(),
    category,
  }
}

// ───────────────── Gemini CLI backend ─────────────────

function runGeminiCLI(prompt: string, model: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt]
    if (model) { args.unshift('-m', model) }
    const proc = spawn('gemini', args, {
      shell: true,
      env: { ...process.env },
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`gemini exited ${code}: ${stderr.slice(0, 400)}`))
    })
    proc.on('error', reject)
  })
}

// ───────────────── Ollama HTTP backend ─────────────────

async function runOllama(prompt: string, model: string, baseUrl: string): Promise<string> {
  const url = baseUrl.replace(/\/+$/, '') + '/api/generate'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.2, num_ctx: 8192 },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  const data = (await res.json()) as { response?: string; error?: string }
  if (data.error) throw new Error(`Ollama error: ${data.error}`)
  return data.response ?? ''
}

// ───────────────── Shared runner ─────────────────

async function runLLM(prompt: string, settings: Settings): Promise<string> {
  if (settings.llmProvider === 'ollama') {
    return runOllama(prompt, settings.ollamaModel, settings.ollamaUrl)
  }
  return runGeminiCLI(prompt, settings.geminiModel)
}

// ───────────────── Public API: refactor a single article ─────────────────

export async function refactorArticle(
  title: string,
  body: string,
  settings: Settings,
  hintCategory?: ArticleCategory
): Promise<RefactorResult> {
  const prompt = buildPrompt(title, body, settings.strictness, hintCategory)
  const raw = await runLLM(prompt, settings)
  return extractJSON(raw, hintCategory)
}

// ───────────────── Public API: cluster same-event stories ─────────────────

export interface ClusterInput {
  index: number
  source: string
  headline: string
}

/**
 * Groups headlines that report the SAME underlying event. Returns an array of
 * groups, each group being an array of input indices. Every index appears once.
 * Falls back to all-singletons on any parsing failure (never throws).
 */
export async function clusterHeadlines(
  items: ClusterInput[],
  settings: Settings
): Promise<number[][]> {
  if (items.length <= 1) return items.map((it) => [it.index])

  const list = items
    .map((it) => `${it.index}. [${it.source}] ${it.headline}`)
    .join('\n')

  const prompt = `You are a news desk editor identifying duplicate coverage.

Below is a numbered list of news headlines, each with its source in brackets.
Group together the items that report THE SAME underlying news event or story
(same incident, same announcement, same development) — even if the wording or
angle differs. Items about different events must stay in separate groups.

Be conservative: only group items you are confident describe the same event.
When unsure, keep an item in its own group.

Output ONLY valid JSON, no markdown, no commentary. Exact shape:
{ "groups": [[0, 3], [1], [2, 4, 5]] }
Rules: every index from 0 to ${items.length - 1} must appear EXACTLY ONCE across all groups.

==== HEADLINES ====
${list}
==== END ====`

  try {
    const raw = await runLLM(prompt, settings)
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('no json')
    const parsed = JSON.parse(match[0]) as { groups?: number[][] }
    const groups = Array.isArray(parsed.groups) ? parsed.groups : []

    // Validate: collect seen indices, drop invalid, add any missing as singletons.
    const validIndices = new Set(items.map((it) => it.index))
    const seen = new Set<number>()
    const result: number[][] = []
    for (const g of groups) {
      const clean = g.filter((i) => validIndices.has(i) && !seen.has(i))
      clean.forEach((i) => seen.add(i))
      if (clean.length > 0) result.push(clean)
    }
    // Any index the model forgot becomes its own group.
    for (const it of items) {
      if (!seen.has(it.index)) result.push([it.index])
    }
    return result
  } catch (err) {
    console.error('clusterHeadlines failed, using singletons:', err)
    return items.map((it) => [it.index])
  }
}

// ───────────────── Public API: synthesize a multi-source story ─────────────────

export interface SynthesisInput {
  source: string
  title: string
  body: string
}

/**
 * Combines several reports of the same event into one neutral article that
 * draws on all sources. Returns the same shape as refactorArticle.
 */
export async function synthesizeCluster(
  reports: SynthesisInput[],
  settings: Settings,
  hintCategory?: ArticleCategory
): Promise<RefactorResult> {
  const rules = SYSTEM_RULES[settings.strictness]
  const categoryList = CATEGORIES.join(' | ')
  const sourceNames = reports.map((r) => r.source).join(', ')

  const blocks = reports
    .map(
      (r, i) =>
        `--- REPORT ${i + 1} (source: ${r.source}) ---\nHeadline: ${r.title}\n${r.body.slice(0, 1800)}`
    )
    .join('\n\n')

  const hint = hintCategory
    ? `If the topic is ambiguous, prefer the category "${hintCategory}".`
    : ''

  const prompt = `You are a calm, dry, wire-service news editor.

Below are MULTIPLE independent reports of the SAME news event, from different
publishers (${sourceNames}). Synthesize them into ONE neutral, factual article.

Hard rules:
- Combine the facts from all reports. Preserve all facts, figures, names, dates,
  quotes, and attributions EXACTLY.
- If reports disagree on a detail, state both and attribute (e.g. "Reuters reported X, while the BBC reported Y").
- Do NOT invent anything not present in the reports.
- ${rules}
- Tone: dry, calm, factual. Past tense for completed events. Active voice.
- The "summary" field MUST be 2 to 4 PARAGRAPHS separated by "\\n\\n" (a blank line between paragraphs). Total 150-280 words. Do NOT produce a one-liner.
- The "headline" should be a single neutral sentence; no all-caps, no question marks, no exclamation marks.

Then classify into exactly ONE category: ${categoryList}.
${hint}

Output ONLY valid JSON, no markdown, no commentary. Exact shape:
{ "headline": "...", "summary": "para1\\n\\npara2\\n\\npara3", "category": "..." }

==== REPORTS ====
${blocks}
==== END ====`

  const raw = await runLLM(prompt, settings)
  return extractJSON(raw, hintCategory)
}
