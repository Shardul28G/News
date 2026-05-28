import React, { useEffect, useState } from 'react'
import { colors, sans } from '../tokens'

interface Props {
  message: string
  type?: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type = 'success', onDismiss }: Props): React.ReactElement {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      padding: '10px 16px', borderRadius: 10,
      background: type === 'error' ? '#FEF2F2' : colors.ink,
      color: type === 'error' ? '#991B1B' : 'white',
      fontSize: 13, fontWeight: 500, fontFamily: sans,
      border: type === 'error' ? '1px solid #FCA5A5' : 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.2s ease, opacity 0.2s ease',
    }}>
      {message}
    </div>
  )
}
