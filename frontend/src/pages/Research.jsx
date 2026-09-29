import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  FileCheck,
  Globe,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { ResearchAPI } from '../services/api.js';
import { useResearchSocket } from '../hooks/useResearchSocket.js';
import AgentTracker from '../components/AgentTracker.jsx';
import SourceCard from '../components/SourceCard.jsx';
import ReportViewer from '../components/ReportViewer.jsx';

export default function Research() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [sources, setSources] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineTriggered, setPipelineTriggered] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Hook into live Socket.IO events for this session
  const {
    currentStage,
    progress: socketProgress,
    currentMessage,
    events,
    isCompleted: socketCompleted,
    error: socketError,
  } = useResearchSocket(sessionId);

  // Load initial session and check if execution should begin
  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        const sessionData = await ResearchAPI.getSession(sessionId);
        if (!isMounted) return;
        setSession(sessionData);

        // Fetch sources if already collected
        try {
          const sourcesRes = await ResearchAPI.getSources(sessionId);
          if (isMounted) setSources(sourcesRes.sources || []);
        } catch {}

        // Fetch report if already completed
        if (sessionData.status === 'COMPLETED') {
          try {
            const reportRes = await ResearchAPI.getReport(sessionId);
            if (isMounted) setReport(reportRes.report || reportRes);
          } catch {}
        } else if (!pipelineTriggered && sessionData.status === 'CREATED') {
          // Trigger execution automatically
          setPipelineTriggered(true);
          ResearchAPI.executePipeline(sessionId)
            .then(async (res) => {
              if (isMounted) {
                if (res.report) setReport(res.report);
                const updatedSources = await ResearchAPI.getSources(sessionId);
                setSources(updatedSources.sources || []);
              }
            })
            .catch((err) => {
              console.error('Pipeline execution error:', err);
            });
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        if (isMounted) setFetchError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialState();
    return () => {
      isMounted = false;
    };
  }, [sessionId, pipelineTriggered]);

  // When socket signals completed, refresh sources & report
  useEffect(() => {
    if (socketCompleted || currentStage === 'COMPLETED') {
      const loadFinalOutput = async () => {
        try {
          const reportRes = await ResearchAPI.getReport(sessionId);
          setReport(reportRes.report || reportRes);
          const sourcesRes = await ResearchAPI.getSources(sessionId);
          setSources(sourcesRes.sources || []);
          const updatedSession = await ResearchAPI.getSession(sessionId);
          setSession(updatedSession);
        } catch (err) {
          console.error('Error refreshing completed report:', err);
        }
      };
      loadFinalOutput();
    }
  }, [socketCompleted, currentStage, sessionId]);

  // Periodic poll to refresh sources while research is active
  useEffect(() => {
    if (session?.status !== 'COMPLETED' && !report) {
      const interval = setInterval(async () => {
        try {
          const sourcesRes = await ResearchAPI.getSources(sessionId);
          if (sourcesRes.sources?.length > 0) {
            setSources(sourcesRes.sources);
          }
        } catch {}
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [sessionId, session?.status, report]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Connecting to autonomous research agents...</p>
      </div>
    );
  }

  if (fetchError || !session) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={40} color="#f87171" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Session Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {fetchError || 'Unable to locate research session'}
        </p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  const effectiveProgress = Math.max(session.progress || 0, socketProgress || 0);
  const effectiveStage = currentStage !== 'INIT' ? currentStage : session.status;
  const isFinished = effectiveStage === 'COMPLETED' || session.status === 'COMPLETED' || Boolean(report);

  const subQuestions = session.researchPlan?.subQuestions || [];

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Top Navigation & Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>New Research</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${isFinished ? 'badge-success' : 'badge-info'}`}>
            {isFinished ? 'RESEARCH COMPLETED' : `IN PROGRESS: ${effectiveStage}`}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Session ID: <code style={{ color: '#818cf8' }}>{(session._id || session.sessionId || sessionId)?.slice(-6)}</code>
          </span>
        </div>
      </div>

      {/* Topic Title Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
          Research Question
        </div>
        <h1 style={{ fontSize: '1.85rem', lineHeight: 1.3, color: '#ffffff' }}>
          {session.topic}
        </h1>
        {session.researchPlan?.objective && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Objective: </strong>{session.researchPlan.objective}
          </p>
        )}
      </div>

      {/* Agent Progress Tracker */}
      <AgentTracker
        currentStage={effectiveStage}
        progress={effectiveProgress}
        currentMessage={currentMessage || session.currentStep}
        events={events}
      />

      {/* Sub-Questions Decomposition Preview */}
      {subQuestions.length > 0 && !isFinished && (
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#818cf8" />
            <span>Decomposed Research Sub-Questions ({subQuestions.length})</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {subQuestions.map((sq) => (
              <div
                key={sq.id}
                className="glass-panel"
                style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {sq.id}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                    {sq.evidenceType}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9rem', color: '#f3f4f6', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  {sq.question}
                </h4>
                {sq.searchQueries && sq.searchQueries.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Queries: {sq.searchQueries.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Live Discovered Sources Grid */}
      {sources.length > 0 && !isFinished && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="#06b6d4" />
              <span>Live Discovered Sources ({sources.length})</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Parallel discovery active
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {sources.map((src) => (
              <SourceCard key={src._id || src.citationId} source={src} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Report View */}
      {report && (
        <section className="fade-in">
          <ReportViewer report={report} sources={sources} />
        </section>
      )}
    </div>
  );
}
