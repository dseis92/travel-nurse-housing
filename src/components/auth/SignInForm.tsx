import { useState } from 'react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting sign in...');
      const result = await authService.signIn({
        email: formData.email,
        password: formData.password,
      });

      console.log('🔐 Sign in result:', result);

      if (result.success) {
        toast.success('Welcome back!');
        setLoading(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to sign in');
        setLoading(false);
      }
    } catch (error) {
      console.error('🔐 Sign in exception:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#9ca3af',
          marginBottom: 8,
        }}>
          NightShift Housing
        </div>
        <h2 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 4 }}>
          Welcome Back
        </h2>
        <p className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
          Sign in to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Email */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            placeholder="your@email.com"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Password */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
            }}
            placeholder="Enter your password"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="nm-pill nm-pill--active"
          style={{
            width: '100%',
            marginTop: 8,
            fontSize: 14,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Sign Up Link */}
        {onSwitchToSignUp && (
          <div style={{
            marginTop: 8,
            paddingTop: 16,
            borderTop: '1px solid rgba(148,163,184,0.2)',
            textAlign: 'center',
          }}>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="nm-body"
                style={{
                  fontSize: 12,
                  color: '#6366f1',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign Up
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
