import { contextBridge, ipcRenderer } from 'electron'
import type { Article, Settings } from '../shared/types'

const api = {
  feed: {
    list: (): Promise<Article[]> => ipcRenderer.invoke('feed:list'),
    refresh: (categoryFilter?: string): Promise<void> => ipcRenderer.invoke('feed:refresh', categoryFilter),
    markRead: (id: string): Promise<void> => ipcRenderer.invoke('feed:markRead', id),
    onUpdate: (callback: (articles: Article[]) => void): void => {
      ipcRenderer.on('feed:updated', (_e, articles) => callback(articles))
    },
    onRefreshStatus: (callback: (status: { refreshing: boolean; error?: string; message?: string }) => void): void => {
      ipcRenderer.on('feed:refresh-status', (_e, status) => callback(status))
    },
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    set: (patch: Partial<Settings>): Promise<void> => ipcRenderer.invoke('settings:set', patch),
    resetSources: (): Promise<Settings> => ipcRenderer.invoke('settings:resetSources'),
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
}

contextBridge.exposeInMainWorld('electron', api)
