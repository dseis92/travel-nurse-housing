import React from 'react'
import './neumo.css'

type NeumoCardProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const NeumoCard: React.FC<NeumoCardProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <section className={`nm-card ${className}`} style={style}>
      {children}
    </section>
  )
}

type PillButtonProps = {
  label: string
  active?: boolean
  onClick?: () => void
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  active = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={`nm-pill ${active ? 'nm-pill--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
