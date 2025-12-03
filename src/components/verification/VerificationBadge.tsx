import type { UserRole } from '../../types'

interface VerificationBadgeProps {
  isVerified: boolean
  role: UserRole
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

export function VerificationBadge({
  isVerified,
  role,
  size = 'medium',
  showLabel = true,
}: VerificationBadgeProps) {
  if (!isVerified) return null

  const sizeStyles = {
    small: {
      container: { height: 16, fontSize: 9, padding: '2px 6px', gap: 3 },
      icon: { width: 10, height: 10 },
    },
    medium: {
      container: { height: 20, fontSize: 10, padding: '4px 8px', gap: 4 },
      icon: { width: 12, height: 12 },
    },
    large: {
      container: { height: 24, fontSize: 11, padding: '5px 10px', gap: 5 },
      icon: { width: 14, height: 14 },
    },
  }

  const style = sizeStyles[size]

  const label = role === 'nurse' ? 'Verified Nurse' : 'Verified Host'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: style.container.gap,
        height: style.container.height,
        paddingInline: style.container.padding.split(' ')[1],
        paddingBlock: style.container.padding.split(' ')[0],
        borderRadius: 999,
        background: 'linear-gradient(135deg, #10B981, #14B8A6)',
        color: 'white',
        fontSize: style.container.fontSize,
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
      }}
    >
      <svg
        style={{
          width: style.icon.width,
          height: style.icon.height,
          flexShrink: 0,
        }}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {showLabel && <span>{label}</span>}
    </div>
  )
}

// Compact icon-only badge for tight spaces
export function VerificationIcon({ isVerified }: { isVerified: boolean }) {
  if (!isVerified) return null

  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        background: 'linear-gradient(135deg, #10B981, #14B8A6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
      }}
    >
      <svg
        style={{
          width: 11,
          height: 11,
          color: 'white',
        }}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}
