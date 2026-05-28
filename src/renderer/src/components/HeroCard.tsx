import React from 'react'
import { colors, sans, gradientCSS, type CategoryKey } from '../tokens'
import type { Article } from '../../../shared/types'

interface Props {
  article: Article
  onClick: () => void
}

export default function HeroCard({ article, onClick }: Props): React.ReactElement {
  const grad = gradientCSS(article.category as CategoryKey)
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer',
        display: 'grid', gridTemplateColumns: '300px 1fr',
        gap: 22, background: colors.card,
        border: `1px solid ${colors.rule}`,
        borderRadius: 14, padding: 16,
        marginBottom: 22, boxSizing: 'border-box', width: '100%',
      }}
    >
      {/* Category image */}
      <div style={{
        height: 200, borderRadius: 10,
        background: grad,
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 12, left: 14,
          fontSize: 10, color: 'rgba(255,255,255,0.85)',
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
          fontFamily: sans,
        }}>
          {article.category}
        </div>
      </div>

      {/* Text content */}
      <div style={{ padding: '6px 10px 6px 0', display: 'flex', flexDirection: 'column', fontFamily: sans }}>
        <div style={{
          fontSize: 11, color: colors.accent, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
        }}>
          Top story · {article.source}
        </div>
        <h2 style={{
          margin: 0, fontSize: 26, lineHeight: 1.2, fontWeight: 700,
          letterSpacing: -0.6, color: colors.ink, textWrap: 'balance' as never,
        }}>
          {article.headline}
        </h2>
        <p style={{
          marginTop: 12, marginBottom: 0, fontSize: 14,
          lineHeight: 1.55, color: colors.muted, textWrap: 'pretty' as never,
        }}>
          {article.summary}
        </p>
        <div style={{
          marginTop: 'auto', paddingTop: 14,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 12, color: colors.muted,
        }}>
          <span>{article.time}</span>
          <span>·</span>
          <span>{article.minutes} min read</span>
          <span style={{
            marginLeft: 'auto', color: colors.accent, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            Read
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  )
}
