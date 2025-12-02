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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
        zIndex: 9999,
        overflow: 'auto',
        padding: '40px 20px',
      }}
    >
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

        {/* Progress Bar */}
        <div
          style={{
            height: 4,
            background: 'rgba(148,163,184,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: 4,
              width: `${progress}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

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
