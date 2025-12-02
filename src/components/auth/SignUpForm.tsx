import { useState } from 'react';
import { authService } from '../../services/authService';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface SignUpFormProps {
  initialRole?: UserRole;
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export function SignUpForm({ initialRole, onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: initialRole || ('nurse' as UserRole),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
      });

      if (result.success) {
        if (result.error) {
          // Email confirmation required message
          toast.success(result.error, { duration: 6000 });
          // Don't call onSuccess - keep modal open so they can see the message
        } else {
          toast.success('Account created successfully!');
          onSuccess?.();
        }
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
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
          Create Account
        </h2>
        <p className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
          Join as a {formData.role === 'nurse' ? 'Travel Nurse' : 'Host'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Role Selection */}
        {!initialRole && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'nurse' })}
              className={formData.role === 'nurse' ? 'nm-pill nm-pill--active' : 'nm-pill'}
              style={{ flex: 1, fontSize: 12 }}
            >
              👩‍⚕️ Nurse
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'host' })}
              className={formData.role === 'host' ? 'nm-pill nm-pill--active' : 'nm-pill'}
              style={{ flex: 1, fontSize: 12 }}
            >
              🏡 Host
            </button>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            placeholder="John Doe"
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

        {/* Phone (optional) */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Phone <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            placeholder="(555) 123-4567"
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
            placeholder="At least 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label className="nm-body" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            placeholder="Re-enter password"
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Sign In Link */}
        {onSwitchToSignIn && (
          <div style={{
            marginTop: 8,
            paddingTop: 16,
            borderTop: '1px solid rgba(148,163,184,0.2)',
            textAlign: 'center',
          }}>
            <p className="nm-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
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
                Sign In
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
