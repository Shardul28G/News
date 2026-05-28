import { ipcMain, shell, BrowserWindow } from 'electron'
import * as db from './db'
import { runRefresh } from './rss'

export function registerIpc(win: BrowserWindow): void {
  ipcMain.handle('feed:list', () => db.getArticles())

  ipcMain.handle('feed:refresh', async () => {
    await runRefresh((status) => {
      win.webContents.send('feed:refresh-status', status)
      if (!status.refreshing) {
        win.webContents.send('feed:updated', db.getArticles())
      }
    })
  })

  ipcMain.handle('feed:markRead', (_e, id: string) => {
    const updated = db.markRead(id)
    win.webContents.send('feed:updated', updated)
  })

  ipcMain.handle('settings:get', () => db.getSettings())

  ipcMain.handle('settings:set', (_e, patch: Parameters<typeof db.saveSettings>[0]) => {
    return db.saveSettings(patch)
  })

  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))
}
