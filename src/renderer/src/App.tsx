import React, { useEffect, useState } from 'react'
import { colors, sans } from './tokens'
import { useFeedStore } from './store'
import AppHeader from './components/AppHeader'
import HeroCard from './components/HeroCard'
import ArticleCard from './components/ArticleCard'
import ArticleModal from './components/ArticleModal'
import SettingsModal from './components/SettingsModal'
import Toast from './components/Toast'
import type { Category } from '../../shared/types'

const isElectron = typeof window !== 'undefined' && !!window.electron

export default function App(): React.ReactElement {
  const {
    category, query, selectedId, refreshing, settingsOpen, settings,
    setArticles, setCategory, setQuery, setSelectedId,
    setRefreshing, setSettings, setSettingsOpen, markRead,
    filteredArticles,
  } = useFeedStore()

  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null)
  const [progressMsg, setProgressMsg] = useState<string>('')

  const filtered = filteredArticles()
  const [hero, ...rest] = filtered

  const showToast = (msg: string, type?: 'success' | 'error'): void => setToast({ msg, type })

  // Bootstrap: load articles + settings from main process
  useEffect(() => {
    if (!isElectron) return
    window.electron.feed.list().then(setArticles).catch(console.error)
    window.electron.settings.get().then(setSettings).catch(console.error)

    window.electron.feed.onUpdate(setArticles)
    window.electron.feed.onRefreshStatus((status) => {
      setRefreshing(status.refreshing)
      if (status.message) setProgressMsg(status.message)
      if (!status.refreshing) {
        setProgressMsg('')
        if (status.error) showToast(status.error, 'error')
        else if (status.message) showToast(status.message)
        else showToast('Feed refreshed')
      }
    })
  }, [])

  const handleRefresh = (): void => {
    if (!isElectron || refreshing) return
    setRefreshing(true)
    setProgressMsg('Starting…')
    window.electron.feed.refresh(category).catch((err) => {
      setRefreshing(false)
      setProgressMsg('')
      showToast(String(err), 'error')
    })
  }

  const handleOpenSource = (url: string): void => {
    if (isElectron) window.electron.shell.openExternal(url)
    else window.open(url, '_blank', 'noopener')
  }

  const handleSelectArticle = (id: string): void => {
    setSelectedId(id)
    markRead(id)
    if (isElectron) window.electron.feed.markRead(id).catch(console.error)
  }

  const handleSaveSettings = (patch: Parameters<typeof window.electron.settings.set>[0]): void => {
    if (!isElectron) return
    window.electron.settings.set(patch).then(() => {
      window.electron.settings.get().then(setSettings).catch(console.error)
      showToast('Settings saved')
    }).catch(console.error)
  }

  const handleResetSources = (): void => {
    if (!isElectron) return
    window.electron.settings.resetSources().then((s) => {
      setSettings(s)
      showToast('Default sources restored')
    }).catch(console.error)
  }

  const selectedArticle = selectedId ? filtered.find((a) => a.id === selectedId) ?? null : null

  return (
    <div style={{ height: '100vh', background: colors.bg, color: colors.ink, fontFamily: sans, display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        category={category}
        query={query}
        refreshing={refreshing}
        progressMsg={progressMsg}
        llmProvider={settings?.llmProvider}
        llmModel={settings?.llmProvider === 'ollama' ? settings?.ollamaModel : settings?.geminiModel}
        onCategoryChange={(c: Category) => setCategory(c)}
        onQueryChange={setQuery}
        onRefresh={handleRefresh}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Feed body */}
      <main style={{ flex: '1 1 auto', overflowY: 'auto', padding: '26px 36px 40px' }}>
        {filtered.length === 0 ? (
          <EmptyState query={query} refreshing={refreshing} progressMsg={progressMsg} onRefresh={handleRefresh} />
        ) : (
          <>
            {hero && (
              <HeroCard article={hero} onClick={() => handleSelectArticle(hero.id)} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} onClick={() => handleSelectArticle(a.id)} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Article modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedId(null)}
          onOpenSource={handleOpenSource}
        />
      )}

      {/* Settings modal */}
      {settingsOpen && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          onResetSources={handleResetSources}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.msg + Date.now()}
          message={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

function EmptyState({ query, refreshing, progressMsg, onRefresh }: {
  query: string; refreshing: boolean; progressMsg: string; onRefresh: () => void
}): React.ReactElement {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 12,
      color: colors.muted, fontFamily: sans,
    }}>
      {refreshing ? (
        <>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.dim} strokeWidth="1.5"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          <div style={{ fontSize: 15, color: colors.muted }}>
            {progressMsg || 'Fetching and refactoring articles…'}
          </div>
          <div style={{ fontSize: 13, color: colors.dim }}>This may take a moment while the LLM rewrites each story</div>
        </>
      ) : query ? (
        <div style={{ fontSize: 15 }}>No articles match "{query}"</div>
      ) : (
        <>
          <div style={{ fontSize: 15 }}>No articles in this category yet</div>
          <div style={{ fontSize: 13, color: colors.dim }}>Press Refresh to fetch and neutralize the latest news</div>
          <button
            onClick={onRefresh}
            style={{
              all: 'unset', cursor: 'pointer', marginTop: 8,
              padding: '8px 18px', background: colors.accent, color: 'white',
              borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: sans,
            }}
          >
            Refresh now
          </button>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
