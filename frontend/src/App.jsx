import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Research from './pages/Research.jsx';
import Report from './pages/Report.jsx';
import ResearchHistory from './pages/ResearchHistory.jsx';
import Scene from './components/Scene.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ResearchProvider } from './context/ResearchContext.jsx';
import { ResearchAPI } from './services/api.js';
import Helper from './components/Helper/Helper.jsx';

export default function App() {
  const [healthStatus, setHealthStatus] = useState('ok');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await ResearchAPI.getHealth();
        setHealthStatus(res.status === 'ok' ? 'ok' : 'degraded');
      } catch (err) {
        setHealthStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ResearchProvider>
        {/* Layer 0: ThreeUI WarpField Letter Storm Animation */}
        <Scene />

        {/* Layer 1: Subtle Readability Overlay */}
        <div className="readability-overlay" />

        {/* Layer 2: Existing Application UI */}
        <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar healthStatus={healthStatus} />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/research/:sessionId" element={<Research />} />
              <Route path="/report/:sessionId" element={<Report />} />
              <Route path="/history" element={<ResearchHistory />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '1.5rem 0',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              background: 'rgba(11, 15, 25, 0.9)',
            }}
          >
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                Multi-Agent Research Assistant • Production Engineering Architecture
              </div>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <span>6 Coordinated Agents</span>
                <span>•</span>
                <span>Zero Fabrication</span>
                <span>•</span>
                <span>Real-Time WebSockets</span>
              </div>
            </div>
          </footer>

          {/* Layer 3: Helper Conversational AI Assistant */}
          <Helper />
        </div>
      </ResearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
