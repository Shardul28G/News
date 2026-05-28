import { spawn } from 'child_process'
import type { ArticleCategory, Strictness } from '../shared/types'

const SYSTEM_PROMPTS: Record<Strictness, string> = {
  light: `You are a news copy editor. Rewrite the supplied news article and its headline in neutral, factual language. Preserve all facts, figures, names, dates, and attributions exactly. Remove sensationalist / clickbait phrasing and fear-mongering vocabulary. Tone: dry, calm, wire-service. Past tense for events. Active voice. Length: tight summary, ~3 short paragraphs maximum.`,

  medium: `You are a news copy editor. Rewrite the supplied news article and its headline in neutral, factual language. Preserve all facts, figures, names, dates, and attributions exactly. Remove the following without exception:
- Sensationalist / clickbait phrasing ("SHOCKING", "you won't believe")
- Fear-mongering vocabulary ("crisis", "catastrophe", "panic", "spirals")
- Loaded political adjectives ("radical", "extremist", "slammed", "blasted")
- Emotional manipulation and outrage framing
- Violent or graphic imagery in headlines
- Identity-based othering language
Tone: dry, calm, wire-service. Past tense for events. Active voice. Length: tight summary, ~3 short paragraphs maximum.`,

  aggressive: `You are a news copy editor. Rewrite the supplied news article and its headline in neutral, factual language. Preserve all facts, figures, names, dates, and attributions exactly. Remove without exception:
- Sensationalist / clickbait phrasing
- Fear-mongering vocabulary
- Loaded political adjectives
- Emotional manipulation and outrage framing
- Violent or graphic imagery in headlines
- Identity-based othering language
- Rhetorical questions
- Scare quotes used for editorial effect
- Second-person address ("you", "your")
Tone: dry, calm, wire-service. Past tense for events. Active voice. Length: tight summary, ~3 short paragraphs maximum.`,
}

const CATEGORIES: ArticleCategory[] = [
  'politics', 'business', 'tech', 'world', 'climate', 'science', 'health',
]

export interface RefactorResult {
  headline: string
  summary: string
  category: ArticleCategory
}

function runGemini(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('gemini', ['-p', prompt], {
      shell: true,
      env: { ...process.env },
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`gemini exited ${code}: ${stderr}`))
    })
    proc.on('error', reject)
  })
}

function extractJSON(raw: string): RefactorResult {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in gemini output')
  const parsed = JSON.parse(match[0])
  const category: ArticleCategory = CATEGORIES.includes(parsed.category)
    ? parsed.category
    : 'world'
  return {
    headline: String(parsed.headline ?? ''),
    summary: String(parsed.summary ?? ''),
    category,
  }
}

export async function refactorArticle(
  title: string,
  body: string,
  strictness: Strictness
): Promise<RefactorResult> {
  const systemPrompt = SYSTEM_PROMPTS[strictness]
  const categoryList = CATEGORIES.join(' | ')
  const prompt = `${systemPrompt}

Also classify this article into exactly one category: ${categoryList}.

Output ONLY valid JSON with this exact shape (no markdown, no extra text):
{ "headline": "...", "summary": "...", "category": "..." }

Article to refactor:
Title: ${title}

Body: ${body.slice(0, 3000)}`

  const raw = await runGemini(prompt)
  return extractJSON(raw)
}
