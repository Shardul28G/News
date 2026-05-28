export type Category =
  | 'all'
  | 'politics'
  | 'business'
  | 'tech'
  | 'world'
  | 'climate'
  | 'science'
  | 'health';

export type ArticleCategory = Exclude<Category, 'all'>;

export type Strictness = 'light' | 'medium' | 'aggressive';

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
}

export interface Settings {
  strictness: Strictness;
  sources: RssSource[];
  refreshIntervalMinutes: number;
  lastSyncAt: string | null;
}

export interface ElectronAPI {
  feed: {
    list: () => Promise<Article[]>;
    refresh: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    onUpdate: (callback: (articles: Article[]) => void) => void;
    onRefreshStatus: (callback: (status: { refreshing: boolean; error?: string }) => void) => void;
  };
  settings: {
    get: () => Promise<Settings>;
    set: (settings: Partial<Settings>) => Promise<void>;
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
