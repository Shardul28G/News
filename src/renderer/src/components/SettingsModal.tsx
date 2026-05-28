import React, { useEffect, useState } from 'react'
import { colors, sans } from '../tokens'
import type { Settings, RssSource, Strictness } from '../../../shared/types'

interface Props {
  settings: Settings
  onClose: () => void
  onSave: (patch: Partial<Settings>) => void
}

const STRICTNESS_LABELS: Record<Strictness, string> = {
  light: 'Light — remove only sensationalism & fear-mongering',
  medium: 'Medium — full neutralization (recommended)',
  aggressive: 'Aggressive — also strip rhetorical questions & scare quotes',
}

export default function SettingsModal({ settings, onClose, onSave }: Props): React.ReactElement {
  const [strictness, setStrictness] = useState<Strictness>(settings.strictness)
  const [sources, setSources] = useState<RssSource[]>(settings.sources)
  const [interval, setInterval] = useState(settings.refreshIntervalMinutes)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
    onSave({ strictness, sources, refreshIntervalMinutes: interval })
    onClose()
  }

  const toggleSource = (id: string) => {
    setSources((s) => s.map((src) => src.id === id ? { ...src, enabled: !src.enabled } : src))
  }

  const removeSource = (id: string) => {
    setSources((s) => s.filter((src) => src.id !== id))
  }

  const addSource = () => {
    const trimUrl = newUrl.trim()
    const trimName = newName.trim()
    if (!trimUrl || !trimName) return
    setSources((s) => [...s, { id: Date.now().toString(), name: trimName, url: trimUrl, enabled: true }])
    setNewUrl('')
    setNewName('')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: colors.scrim, zIndex: 50,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflowY: 'auto', padding: '30px 30px',
        fontFamily: sans,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card, width: 'min(600px, calc(100% - 0px))',
          margin: '0 auto', borderRadius: 14,
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.30)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${colors.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: colors.ink }}>
            Settings
          </div>
          <button onClick={onClose} style={{
            all: 'unset', cursor: 'pointer',
            fontSize: 13, color: colors.muted, padding: '4px 10px',
            borderRadius: 999, background: colors.bg,
            border: `1px solid ${colors.rule}`,
          }}>
            Close
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Refactor strictness */}
          <section>
            <Label>Refactor strictness</Label>
            {(Object.keys(STRICTNESS_LABELS) as Strictness[]).map((s) => (
              <label key={s} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginTop: 8, cursor: 'pointer',
              }}>
                <input
                  type="radio" name="strictness" value={s}
                  checked={strictness === s}
                  onChange={() => setStrictness(s)}
                  style={{ marginTop: 2, accentColor: colors.accent }}
                />
                <span style={{ fontSize: 13, color: colors.ink, lineHeight: 1.5 }}>
                  {STRICTNESS_LABELS[s]}
                </span>
              </label>
            ))}
          </section>

          {/* Refresh interval */}
          <section>
            <Label>Auto-refresh interval</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input
                type="number" min={5} max={120} value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                style={{
                  width: 64, padding: '6px 10px', border: `1px solid ${colors.rule}`,
                  borderRadius: 8, fontSize: 13, fontFamily: sans, color: colors.ink,
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: 13, color: colors.muted }}>minutes</span>
            </div>
          </section>

          {/* Sources */}
          <section>
            <Label>RSS Sources</Label>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sources.map((src) => (
                <div key={src.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.rule}`,
                  background: colors.bg,
                }}>
                  <input
                    type="checkbox" checked={src.enabled}
                    onChange={() => toggleSource(src.id)}
                    style={{ accentColor: colors.accent }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{src.name}</div>
                    <div style={{ fontSize: 11, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {src.url}
                    </div>
                  </div>
                  <button onClick={() => removeSource(src.id)} style={{
                    all: 'unset', cursor: 'pointer',
                    fontSize: 11, color: colors.muted, padding: '2px 8px',
                    borderRadius: 4, background: 'transparent',
                  }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add source */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <input
                value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Name" style={inputStyle}
              />
              <input
                value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                placeholder="RSS URL" style={{ ...inputStyle, flex: 2 }}
                onKeyDown={(e) => { if (e.key === 'Enter') addSource() }}
              />
              <button onClick={addSource} style={{
                all: 'unset', cursor: 'pointer',
                padding: '6px 14px', background: colors.accent, color: 'white',
                borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: sans,
                whiteSpace: 'nowrap',
              }}>
                Add
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: `1px solid ${colors.rule}`,
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 16px', border: `1px solid ${colors.rule}`,
            borderRadius: 8, fontSize: 13, color: colors.muted, fontFamily: sans,
          }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            all: 'unset', cursor: 'pointer',
            padding: '8px 16px', background: colors.accent, color: 'white',
            borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: sans,
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '6px 10px',
  border: `1px solid ${colors.rule}`,
  borderRadius: 8, fontSize: 13,
  fontFamily: sans, color: colors.ink,
  outline: 'none', background: 'white',
}

function Label({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: colors.muted,
      textTransform: 'uppercase', letterSpacing: 1,
    }}>
      {children}
    </div>
  )
}
