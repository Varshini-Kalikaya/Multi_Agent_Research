import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { ResearchAPI } from '../services/api.js';
import ReportViewer from '../components/ReportViewer.jsx';

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const reportData = await ResearchAPI.getReport(sessionId);
        const sourcesData = await ResearchAPI.getSources(sessionId);
        if (isMounted) {
          setReport(reportData.report || reportData);
          setSources(sourcesData.sources || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Report not found or not yet generated');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" color="#818cf8" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading synthesized research report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={40} color="#f87171" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Report Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'The research report for this session has not been generated yet.'}
        </p>
        <button onClick={() => navigate(`/research/${sessionId}`)} className="btn-primary">
          Go to Research Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(`/research/${sessionId}`)}
          className="btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Live Pipeline</span>
        </button>
      </div>

      <ReportViewer report={report} sources={sources} />
    </div>
  );
}
