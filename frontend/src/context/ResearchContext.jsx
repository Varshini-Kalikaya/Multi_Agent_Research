import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ResearchAPI } from '../services/api.js';

const ResearchContext = createContext();

export function ResearchProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [currentSources, setCurrentSources] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const res = await ResearchAPI.listSessions(1, 30);
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch research sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadSessionDetails = useCallback(async (sessionId) => {
    try {
      const sessionData = await ResearchAPI.getSession(sessionId);
      setCurrentSession(sessionData);

      // Try fetching existing report and sources
      try {
        const reportData = await ResearchAPI.getReport(sessionId);
        setCurrentReport(reportData.report || reportData);
      } catch {
        setCurrentReport(null);
      }

      try {
        const sourcesData = await ResearchAPI.getSources(sessionId);
        setCurrentSources(sourcesData.sources || []);
      } catch {
        setCurrentSources([]);
      }

      return sessionData;
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const deleteSession = async (sessionId) => {
    try {
      await ResearchAPI.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (currentSession?._id === sessionId) {
        setCurrentSession(null);
        setCurrentReport(null);
        setCurrentSources([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
  };

  return (
    <ResearchContext.Provider
      value={{
        sessions,
        currentSession,
        currentReport,
        currentSources,
        isLoadingSessions,
        error,
        fetchSessions,
        loadSessionDetails,
        setCurrentSession,
        setCurrentReport,
        setCurrentSources,
        deleteSession,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
}
