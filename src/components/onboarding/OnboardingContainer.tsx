import { useState } from 'react';
import type { ReactNode } from 'react';

interface OnboardingStep {
  id: string;
  component: ReactNode | ((props: any) => ReactNode);
}

interface OnboardingContainerProps {
  steps: OnboardingStep[];
  onComplete: (data: Record<string, any>) => void;
  onClose?: () => void;
}

export function OnboardingContainer({ steps, onComplete, onClose }: OnboardingContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = (stepData?: Record<string, any>) => {
    if (stepData) {
      setFormData((prev) => ({ ...prev, ...stepData }));
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Last step - complete onboarding
      onComplete({ ...formData, ...stepData });
    }
  };

  const handleSkip = () => {
    handleNext(); // Just move to next without saving data
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Dynamic background colors that shift with progress
  const backgroundGradient = `linear-gradient(135deg,
    hsl(${220 + progress * 0.3}, 70%, ${90 - progress * 0.1}%) 0%,
    hsl(${240 + progress * 0.5}, 60%, ${85 - progress * 0.1}%) 100%)`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: backgroundGradient,
        transition: 'background 0.6s ease',
        zIndex: 9999,
        overflow: 'auto',
        padding: '40px 20px',
      }}
    >
      {/* Floating background shapes */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: 250,
        height: 250,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 8s ease-in-out infinite reverse',
      }} />

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            33% {
              transform: translateY(-20px) translateX(10px);
            }
            66% {
              transform: translateY(10px) translateX(-10px);
            }
          }
        `}
      </style>
      {/* Header with Progress */}
      <div style={{ maxWidth: 560, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {currentStepIndex > 0 && (
            <button
              onClick={handleBack}
              className="nm-body"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.6)',
                color: '#6b7280',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '2px 2px 6px rgba(148,163,184,0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ← Back
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="nm-body"
              style={{
                marginLeft: 'auto',
                padding: '8px 12px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: 24,
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              ×
            </button>
          )}
        </div>

        {/* Progress Bar with glow */}
        <div
          style={{
            height: 6,
            background: 'rgba(148,163,184,0.2)',
            borderRadius: 8,
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              borderRadius: 8,
              width: `${progress}%`,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: `0 0 20px rgba(99, 102, 241, ${progress / 200})`,
              position: 'relative',
            }}
          >
            {/* Animated shine effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                animation: 'shine 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        <style>
          {`
            @keyframes shine {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(200%);
              }
            }
          `}
        </style>

        {/* Step Counter */}
        <div
          className="nm-body"
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>

      {/* Steps Container */}
      <div style={{ position: 'relative', minHeight: 400 }}>
        {steps.map((step, index) => (
          <div key={step.id}>
            {typeof step.component === 'function'
              ? step.component({
                  isActive: index === currentStepIndex,
                  onNext: handleNext,
                  onSkip: handleSkip,
                  currentData: formData,
                })
              : step.component}
          </div>
        ))}
      </div>
    </div>
  );
}
