import React, { useEffect } from 'react'
import { colors, sans, gradientCSS, type CategoryKey } from '../tokens'
import type { Article } from '../../../shared/types'

interface Props {
  article: Article
  onClose: () => void
  onOpenSource: (url: string) => void
}

export default function ArticleModal({ article, onClose, onOpenSource }: Props): React.ReactElement {
  const grad = gradientCSS(article.category as CategoryKey)
  const allSources = article.sources && article.sources.length > 0
    ? article.sources
    : [{ name: article.source, url: article.sourceUrl }]
  const isMulti = allSources.length > 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0,
        background: colors.scrim,
        zIndex: 50,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflowY: 'auto',
        padding: '30px 30px',
        fontFamily: sans,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card,
          width: 'min(720px, calc(100% - 0px))',
          margin: '0 auto',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.30)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)',
        }}
      >
        {/* Header gradient band */}
        <div style={{
          height: 160, flexShrink: 0,
          background: grad, position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              all: 'unset', cursor: 'pointer',
              position: 'absolute', top: 14, right: 16,
              color: 'white', fontSize: 13,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(0,0,0,0.30)',
              backdropFilter: 'blur(8px)',
              fontFamily: sans,
            }}
          >
            Close
          </button>
          <div style={{
            position: 'absolute', bottom: 14, left: 16,
            fontSize: 10, color: 'rgba(255,255,255,0.85)',
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
          }}>
            {article.category}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '26px 32px 32px', overflowY: 'auto' }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: 11, color: colors.accent,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {article.category} · {isMulti ? `${allSources.length} sources` : article.source}
          </div>

          {/* Headline */}
          <h2 style={{
            margin: '10px 0 14px', fontSize: 26, lineHeight: 1.2,
            fontWeight: 700, letterSpacing: -0.5, color: colors.ink,
            textWrap: 'balance' as never,
          }}>
            {article.headline}
          </h2>

          {/* Meta */}
          <div style={{
            fontSize: 12, color: colors.muted, marginBottom: 18,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span>{article.time}</span>
            <span>·</span>
            <span>{article.minutes} min read</span>
            <span style={{
              marginLeft: 'auto', color: colors.accent, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: colors.accent,
              }} />
              Refactored
            </span>
          </div>

          {/* Summary — render multi-paragraph */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {article.summary.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
              <p key={i} style={{
                fontSize: 16, lineHeight: 1.6, color: colors.ink,
                margin: 0, textWrap: 'pretty' as never,
              }}>
                {para.trim()}
              </p>
            ))}
          </div>

          {/* Disclosure */}
          <p style={{
            fontSize: 14, lineHeight: 1.65, color: colors.muted,
            marginTop: 14, textWrap: 'pretty' as never,
          }}>
            {isMulti
              ? `This article was synthesized from ${allSources.length} independent reports to remove sensationalist phrasing and outrage framing while preserving the underlying facts. The original wording lives at each publisher.`
              : 'This summary has been rewritten to remove sensationalist phrasing and outrage framing while preserving the underlying facts. The original wording lives at the publisher.'}
          </p>

          {/* Sources */}
          {isMulti && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: colors.muted,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
              }}>
                Sources
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allSources.map((s, i) => (
                  <button
                    key={s.url + i}
                    onClick={() => onOpenSource(s.url)}
                    style={{
                      all: 'unset', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', border: `1px solid ${colors.rule}`,
                      borderRadius: 999, fontSize: 12, color: colors.ink,
                      background: colors.bg, fontFamily: sans,
                    }}
                  >
                    {s.name}
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onOpenSource(allSources[0].url)}
            style={{
              all: 'unset', cursor: 'pointer',
              marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', background: colors.accent, color: 'white',
              borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: sans,
            }}
          >
            Open at {allSources[0].name}
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
