import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { registerIpc } from './ipc'
import { runRefresh } from './rss'
import * as db from './db'

let mainWindow: BrowserWindow | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

// Resolve icon for both dev (run from project root) and packaged build.
// In packaged builds, `process.resourcesPath` points to the app resources dir.
function resolveIconPath(): string | undefined {
  const candidates = [
    join(process.resourcesPath ?? '', 'icon.ico'),
    join(process.resourcesPath ?? '', 'icon.png'),
    join(__dirname, '../../resources/icon.ico'),
    join(__dirname, '../../resources/icon.png'),
  ]
  return candidates.find((p) => p && existsSync(p))
}

function createWindow(): void {
  const iconPath = resolveIconPath()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Reader',
    backgroundColor: '#F8FAFC',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  registerIpc(mainWindow)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function scheduleRefresh(): void {
  if (refreshTimer) clearInterval(refreshTimer)
  const settings = db.getSettings()
  const ms = settings.refreshIntervalMinutes * 60 * 1000
  refreshTimer = setInterval(() => {
    if (mainWindow) {
      runRefresh((status) => {
        mainWindow!.webContents.send('feed:refresh-status', status)
        if (!status.refreshing) {
          mainWindow!.webContents.send('feed:updated', db.getArticles())
        }
      }).catch(console.error)
    }
  }, ms)
}

app.whenReady().then(() => {
  createWindow()
  scheduleRefresh()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
