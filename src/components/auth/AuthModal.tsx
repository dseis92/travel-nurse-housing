import { useState } from 'react';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import type { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: UserRole;
  onSignUpSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup', initialRole, onSignUpSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  if (!isOpen) return null;

  const handleSignUpSuccess = () => {
    onClose();
    // Trigger onboarding flow
    onSignUpSuccess?.();
  };

  const handleSignInSuccess = () => {
    // Just close modal on sign-in
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          zIndex: 9998,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Content */}
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{
          zIndex: 9999,
          background: 'radial-gradient(circle at top, #fdf2ff 0, #f9fafb 35%, #eef2ff 100%)',
          borderRadius: 32,
          boxShadow: '0 24px 60px rgba(15,23,42,0.4), 0 16px 30px rgba(45,35,80,0.15), -4px -4px 12px rgba(255,255,255,0.9)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            border: 'none',
            background: 'rgba(148,163,184,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.15)';
          }}
        >
          <svg
            style={{ width: 20, height: 20, color: '#64748b' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Form Content */}
        <div>
          {mode === 'signup' ? (
            <SignUpForm
              initialRole={initialRole}
              onSuccess={handleSignUpSuccess}
              onSwitchToSignIn={() => setMode('signin')}
            />
          ) : (
            <SignInForm
              onSuccess={handleSignInSuccess}
              onSwitchToSignUp={() => setMode('signup')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
