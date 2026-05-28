import React from 'react'
import { colors, sans, gradientCSS, type CategoryKey } from '../tokens'
import type { Article } from '../../../shared/types'

interface Props {
  article: Article
  onClick: () => void
}

export default function ArticleCard({ article, onClick }: Props): React.ReactElement {
  const grad = gradientCSS(article.category as CategoryKey)
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer',
        background: colors.card,
        border: `1px solid ${colors.rule}`,
        borderRadius: 12, padding: 18,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 10,
        opacity: article.read ? 0.65 : 1,
        fontFamily: sans,
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: colors.muted }}>
        <span style={{
          width: 8, height: 8, borderRadius: 2,
          background: grad, flexShrink: 0,
        }} />
        <span style={{
          fontWeight: 600, color: colors.ink,
          textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10,
        }}>
          {article.source}
        </span>
        <span>·</span>
        <span>{article.time}</span>
        <span style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{article.category}</span>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 16, fontWeight: 600, lineHeight: 1.3,
        color: colors.ink, letterSpacing: -0.2,
        textWrap: 'balance' as never,
      }}>
        {article.headline}
      </div>

      {/* Summary */}
      <div style={{
        fontSize: 13, lineHeight: 1.55, color: colors.muted,
        display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
        textWrap: 'pretty' as never,
      }}>
        {article.summary}
      </div>
    </button>
  )
}
