import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, clearError } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (mode === 'register' && !name.trim()) {
      setLocalError('Please enter your full name');
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() || !password) {
      setLocalError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    let result;
    if (mode === 'login') {
      result = await login({ email, password });
    } else {
      result = await register({ name, email, password });
    }

    setIsSubmitting(false);

    if (result.success) {
      onClose();
      setName('');
      setEmail('');
      setPassword('');
      setLocalError('');
    } else {
      setLocalError(result.error || 'Authentication failed');
    }
  };

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setLocalError('');
    clearError();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              margin: '0 auto 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
            }}
          >
            {mode === 'login' ? <LogIn size={20} color="#fff" /> : <UserPlus size={20} color="#fff" />}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Sign In to Research Assistant' : 'Create an Account'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
            {mode === 'login'
              ? 'Access and sync your synthesized research sessions'
              : 'Save citations and export reports across devices'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {localError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.75rem',
              fontSize: '0.8rem',
              color: '#fca5a5',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{localError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="e.g. Marie Curie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="email"
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              fontSize: '0.9rem',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
