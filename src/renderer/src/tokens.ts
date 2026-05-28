export const colors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  ink: '#0F172A',
  muted: '#64748B',
  dim: '#94A3B8',
  rule: '#E2E8F0',
  accent: '#EA580C',
  scrim: 'rgba(15, 23, 42, 0.40)',
}

export type CategoryKey = 'politics' | 'business' | 'tech' | 'world' | 'climate' | 'science' | 'health'

export const categoryGradient: Record<CategoryKey, [string, string]> = {
  politics: ['#1E3A8A', '#3B82F6'],
  business: ['#065F46', '#10B981'],
  tech:     ['#581C87', '#A855F7'],
  world:    ['#7C2D12', '#F97316'],
  climate:  ['#14532D', '#22C55E'],
  science:  ['#831843', '#EC4899'],
  health:   ['#0C4A6E', '#0EA5E9'],
}

export function gradientCSS(cat: CategoryKey): string {
  const [a, b] = categoryGradient[cat] ?? categoryGradient.world
  return `linear-gradient(135deg, ${a}, ${b})`
}

export const sans = "'Inter Tight', 'Inter', system-ui, sans-serif"

export const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'politics', label: 'Politics' },
  { id: 'business', label: 'Business' },
  { id: 'tech',     label: 'Technology' },
  { id: 'world',    label: 'World' },
  { id: 'climate',  label: 'Climate' },
  { id: 'science',  label: 'Science' },
  { id: 'health',   label: 'Health' },
] as const

// Seed articles used when the DB is empty (matches the design prototype data)
export const SEED_ARTICLES = [
  {
    id: 'seed-a1',
    category: 'politics' as const,
    headline: 'Senate passes infrastructure bill 68–32 after three weeks of debate',
    summary: 'The bill allocates $412 billion to road, rail, and broadband projects over six years. Twelve members of the minority party joined the majority in supporting it. Implementation begins in Q1 2026.',
    source: 'Reuters', sourceUrl: 'https://reuters.com',
    time: '23 min ago', publishedAt: new Date(Date.now() - 23 * 60000).toISOString(),
    minutes: 4, topics: ['US Politics', 'Infrastructure'], read: false, saved: false,
  },
  {
    id: 'seed-a2',
    category: 'climate' as const,
    headline: 'Atlantic hurricane season ends with 14 named storms, slightly above average',
    summary: 'NOAA reported 14 named storms in 2025, six of which reached hurricane strength. The 30-year average is 12. Three storms made U.S. landfall, causing an estimated $8.2 billion in insured damage.',
    source: 'AP', sourceUrl: 'https://apnews.com',
    time: '1 hr ago', publishedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    minutes: 3, topics: ['Climate', 'Weather'], read: false, saved: false,
  },
  {
    id: 'seed-a3',
    category: 'tech' as const,
    headline: 'Apple reports 4.1% year-over-year revenue growth in Q4',
    summary: 'Quarterly revenue reached $94.9 billion. Services grew 12% while iPhone sales were flat. The company announced a $90 billion share buyback and raised its dividend by 4 cents.',
    source: 'Bloomberg', sourceUrl: 'https://bloomberg.com',
    time: '2 hr ago', publishedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    minutes: 5, topics: ['Technology', 'Earnings'], read: false, saved: false,
  },
  {
    id: 'seed-a4',
    category: 'world' as const,
    headline: 'France and Germany announce joint review of EU defense procurement rules',
    summary: 'The review will examine cross-border purchasing of military equipment and is expected to produce recommendations by March. Both governments cited efficiency and supply-chain considerations.',
    source: 'BBC', sourceUrl: 'https://bbc.com',
    time: '3 hr ago', publishedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    minutes: 4, topics: ['Europe', 'Defense'], read: false, saved: false,
  },
  {
    id: 'seed-a5',
    category: 'science' as const,
    headline: 'Researchers identify gene variant linked to faster recovery after stroke',
    summary: 'A study of 11,400 patients in The Lancet identified a variant of the BDNF gene associated with measurably better motor recovery six months post-stroke. Researchers cautioned the finding is correlational and requires replication.',
    source: 'The Lancet', sourceUrl: 'https://thelancet.com',
    time: '4 hr ago', publishedAt: new Date(Date.now() - 240 * 60000).toISOString(),
    minutes: 6, topics: ['Science', 'Health'], read: false, saved: false,
  },
  {
    id: 'seed-a6',
    category: 'business' as const,
    headline: 'Federal Reserve holds interest rates steady; signals one cut possible in 2026',
    summary: "The Federal Open Market Committee voted 10–2 to maintain the federal funds rate at 4.25–4.50%. Chair Jerome Powell described the labor market as 'solid' and inflation as 'gradually easing.'",
    source: 'WSJ', sourceUrl: 'https://wsj.com',
    time: '5 hr ago', publishedAt: new Date(Date.now() - 300 * 60000).toISOString(),
    minutes: 4, topics: ['Economy', 'Markets'], read: false, saved: false,
  },
  {
    id: 'seed-a7',
    category: 'tech' as const,
    headline: 'EU finalizes rules requiring labeling of AI-generated images by 2027',
    summary: 'Platforms with over 45 million monthly users in the EU will be required to attach machine-readable provenance metadata to AI-generated images. Enforcement begins January 2027.',
    source: 'Politico EU', sourceUrl: 'https://politico.eu',
    time: '6 hr ago', publishedAt: new Date(Date.now() - 360 * 60000).toISOString(),
    minutes: 5, topics: ['Technology', 'Regulation'], read: false, saved: false,
  },
  {
    id: 'seed-a8',
    category: 'world' as const,
    headline: 'Japan and South Korea sign five-year semiconductor research agreement',
    summary: "The agreement funds joint research in lithography and advanced packaging at a combined cost of ¥230 billion. Implementation is shared between METI and South Korea's MOTIE.",
    source: 'Nikkei', sourceUrl: 'https://asia.nikkei.com',
    time: '8 hr ago', publishedAt: new Date(Date.now() - 480 * 60000).toISOString(),
    minutes: 3, topics: ['Asia', 'Technology'], read: false, saved: false,
  },
  {
    id: 'seed-a9',
    category: 'health' as const,
    headline: 'WHO updates guidance on adolescent screen time, recommends shared family limits',
    summary: 'The revised guidance recommends household-level rather than age-bracket limits. WHO cited evidence that consistent boundaries correlate more strongly with outcomes than total hours.',
    source: 'Guardian', sourceUrl: 'https://theguardian.com',
    time: '10 hr ago', publishedAt: new Date(Date.now() - 600 * 60000).toISOString(),
    minutes: 4, topics: ['Health', 'Family'], read: false, saved: false,
  },
  {
    id: 'seed-a10',
    category: 'climate' as const,
    headline: 'California reports 42% of new vehicle sales were electric in October',
    summary: 'State data show 42.1% of new passenger vehicles registered in October were battery-electric or plug-in hybrid, up from 35.8% a year earlier. Statewide charging stations grew to 178,000.',
    source: 'LA Times', sourceUrl: 'https://latimes.com',
    time: '12 hr ago', publishedAt: new Date(Date.now() - 720 * 60000).toISOString(),
    minutes: 3, topics: ['Climate', 'Transport'], read: false, saved: false,
  },
  {
    id: 'seed-a11',
    category: 'politics' as const,
    headline: 'Supreme Court agrees to hear two cases on state social media age-verification laws',
    summary: 'The Court will hear arguments in February on laws from Texas and Utah requiring platforms to verify user age. A decision is expected by June.',
    source: 'NYT', sourceUrl: 'https://nytimes.com',
    time: '14 hr ago', publishedAt: new Date(Date.now() - 840 * 60000).toISOString(),
    minutes: 5, topics: ['US Politics', 'Courts'], read: false, saved: false,
  },
  {
    id: 'seed-a12',
    category: 'business' as const,
    headline: 'Boeing delivers 52 commercial aircraft in November, on track to meet annual target',
    summary: 'Deliveries included 41 of the 737 family and 11 widebody aircraft. Year-to-date deliveries reached 478. The company maintained its full-year guidance of 540–560.',
    source: 'FT', sourceUrl: 'https://ft.com',
    time: '1 day ago', publishedAt: new Date(Date.now() - 1440 * 60000).toISOString(),
    minutes: 3, topics: ['Business', 'Aviation'], read: false, saved: false,
  },
]
