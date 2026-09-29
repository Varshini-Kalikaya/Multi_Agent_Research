import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, History, Sparkles, Activity, PlusCircle } from 'lucide-react';

export default function Navbar({ healthStatus = 'ok' }) {
  const location = useLocation();

  const navLinks = [
    { label: 'New Research', path: '/', icon: PlusCircle },
    { label: 'History', path: '/history', icon: History },
  ];

  return (
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

        {/* Navigation Tabs & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
        </div>
      </div>
    </header>
  );
}
