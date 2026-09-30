import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, History, Activity, PlusCircle, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';

export default function Navbar({ healthStatus = 'ok' }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navLinks = [
    { label: 'New Research', path: '/', icon: PlusCircle },
    { label: 'History', path: '/history', icon: History },
  ];

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(11, 15, 25, 0.88)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0.875rem 0',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand / Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Bot size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Multi-Agent Research
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>PROD</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Autonomous Multi-Agent Synthesis & Verification
              </div>
            </div>
          </Link>

          {/* Navigation Tabs & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.35)' : 'transparent'}`,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Health Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: healthStatus === 'ok' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${healthStatus === 'ok' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                fontSize: '0.8rem',
                color: healthStatus === 'ok' ? '#34d399' : '#fb7185',
              }}
            >
              <Activity size={14} className={healthStatus === 'ok' ? '' : 'pulse-glow'} />
              <span>API: {healthStatus === 'ok' ? 'Online' : 'Checking...'}</span>
            </div>

            {/* Auth Button / User Profile */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    color: '#c7d2fe',
                  }}
                  title={user?.email}
                >
                  <UserIcon size={14} />
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="btn-secondary btn-sm"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="Sign Out"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
