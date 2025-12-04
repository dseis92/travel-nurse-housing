import type { ReactNode } from 'react';

interface OnboardingCardProps {
  children: ReactNode;
  isActive?: boolean;
  onNext?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  nextLabel?: string;
  isLastStep?: boolean;
}

export function OnboardingCard({
  children,
  isActive = true,
  onNext,
  onSkip,
  showSkip = false,
  nextLabel = 'Continue',
  isLastStep = false,
}: OnboardingCardProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateX(0) scale(1) rotateY(0deg)' : 'translateX(40px) scale(0.9) rotateY(10deg)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: isActive ? 'auto' : 'none',
        transformStyle: 'preserve-3d',
        perspective: 1000,
        zIndex: isActive ? 10 : 1,
      }}
    >
      <div
        className="neumo-card"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '8px 8px 20px rgba(148,163,184,0.15), -8px -8px 20px rgba(255,255,255,0.8)',
          maxWidth: 560,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Card Content */}
        <div style={{ minHeight: 300 }}>
          {children}
        </div>

        {/* Action Buttons */}
        {onNext && (
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="nm-body"
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'transparent',
                  color: '#6b7280',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                I'll do this later
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                console.log('🚀 OnboardingCard: Next button clicked, nextLabel:', nextLabel);
                e.preventDefault();
                e.stopPropagation();
                if (onNext) onNext();
              }}
              className="nm-pill nm-pill--active"
              style={{
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 600,
                background: isLastStep
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: 16,
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
              }}
            >
              {nextLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
