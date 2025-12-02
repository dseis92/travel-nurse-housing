import { useState } from 'react';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import type { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: UserRole;
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup', initialRole }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    // Close modal on successful auth
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{ zIndex: 9999 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <svg
            className="w-6 h-6 text-gray-600"
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
        <div className="p-2">
          {mode === 'signup' ? (
            <SignUpForm
              initialRole={initialRole}
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode('signin')}
            />
          ) : (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setMode('signup')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
