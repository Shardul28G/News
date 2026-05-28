export type Category =
  | 'all'
  | 'india'
  | 'politics'
  | 'business'
  | 'tech'
  | 'world'
  | 'climate'
  | 'science'
  | 'health';

export type ArticleCategory = Exclude<Category, 'all'>;

export type Strictness = 'light' | 'medium' | 'aggressive';

export type LLMProvider = 'gemini' | 'ollama';

export interface Article {
  id: string;
  category: ArticleCategory;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  time: string;
  publishedAt: string;
  minutes: number;
  topics: string[];
  read: boolean;
  saved: boolean;
}

export interface RssSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  /** Optional category hint used when LLM classification is uncertain. */
  defaultCategory?: ArticleCategory;
}

export interface Settings {
  strictness: Strictness;
  sources: RssSource[];
  refreshIntervalMinutes: number;
  lastSyncAt: string | null;
  llmProvider: LLMProvider;
  ollamaUrl: string;
  ollamaModel: string;
  geminiModel: string;
  /** How many new articles to refactor per refresh. Keeps LLM cost bounded. */
  maxArticlesPerRefresh: number;
}

export interface ElectronAPI {
  feed: {
    list: () => Promise<Article[]>;
    refresh: (categoryFilter?: Category) => Promise<void>;
    markRead: (id: string) => Promise<void>;
    onUpdate: (callback: (articles: Article[]) => void) => void;
    onRefreshStatus: (callback: (status: { refreshing: boolean; error?: string; message?: string }) => void) => void;
  };
  settings: {
    get: () => Promise<Settings>;
    set: (settings: Partial<Settings>) => Promise<void>;
    resetSources: () => Promise<Settings>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
