import React, { useCallback, useRef } from 'react'
import { colors, sans, CATEGORIES } from '../tokens'
import type { Category } from '../../../shared/types'

interface Props {
  category: Category
  query: string
  refreshing: boolean
  onCategoryChange: (c: Category) => void
  onQueryChange: (q: string) => void
  onRefresh: () => void
  onSettingsOpen: () => void
}

export default function AppHeader({
  category, query, refreshing,
  onCategoryChange, onQueryChange, onRefresh, onSettingsOpen,
}: Props): React.ReactElement {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onQueryChange(val), 120)
  }, [onQueryChange])

  return (
    <header style={{
      flex: '0 0 auto',
      padding: '18px 36px 0',
      borderBottom: `1px solid ${colors.rule}`,
      background: colors.card,
      fontFamily: sans,
    }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14, fontFamily: sans,
          }}>
            R
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: colors.ink }}>
            Reader
          </div>
          <div style={{
            fontSize: 11, color: colors.dim, marginLeft: 6,
            padding: '2px 8px', background: 'white',
            border: `1px solid ${colors.rule}`, borderRadius: 999,
          }}>
            refactored · gemini
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', background: 'white',
            border: `1px solid ${colors.rule}`, borderRadius: 8, width: 260,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={colors.dim} strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.5-4.5" />
            </svg>
            <input
              defaultValue={query}
              onChange={handleSearch}
              placeholder="Search articles…"
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontFamily: sans, fontSize: 13, flex: 1, color: colors.ink,
              }}
            />
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh feed"
            style={{
              all: 'unset', cursor: refreshing ? 'default' : 'pointer',
              padding: '7px 9px', background: 'white',
              border: `1px solid ${colors.rule}`, borderRadius: 8,
              display: 'flex', opacity: refreshing ? 0.5 : 1,
            }}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={colors.muted} strokeWidth="2"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsOpen}
            title="Settings"
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '7px 9px', background: 'white',
              border: `1px solid ${colors.rule}`, borderRadius: 8,
              display: 'flex',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2 — category tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
        {CATEGORIES.map((c) => {
          const active = c.id === category
          return (
            <button
              key={c.id}
              onClick={() => onCategoryChange(c.id as Category)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '10px 14px', fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? colors.ink : colors.muted,
                borderBottom: active ? `2px solid ${colors.accent}` : '2px solid transparent',
                marginBottom: -1,
                fontFamily: sans,
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  )
}
