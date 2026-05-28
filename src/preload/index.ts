import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, Article, Settings } from '../shared/types'

const api: ElectronAPI = {
  feed: {
    list: () => ipcRenderer.invoke('feed:list'),
    refresh: () => ipcRenderer.invoke('feed:refresh'),
    markRead: (id: string) => ipcRenderer.invoke('feed:markRead', id),
    onUpdate: (callback: (articles: Article[]) => void) => {
      ipcRenderer.on('feed:updated', (_e, articles) => callback(articles))
    },
    onRefreshStatus: (callback: (status: { refreshing: boolean; error?: string }) => void) => {
      ipcRenderer.on('feed:refresh-status', (_e, status) => callback(status))
    },
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch: Partial<Settings>) => ipcRenderer.invoke('settings:set', patch),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
}

contextBridge.exposeInMainWorld('electron', api)
