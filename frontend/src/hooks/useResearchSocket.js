import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useResearchSocket(sessionId) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentStage, setCurrentStage] = useState('INIT');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Connecting to research pipeline...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [latestData, setLatestData] = useState(null);

  const socketRef = useRef(null);

  const handleEvent = useCallback((eventData, eventType) => {
    setEvents((prev) => [
      ...prev,
      {
        type: eventType,
        ...eventData,
        id: `${Date.now()}-${Math.random()}`,
      },
    ]);

    if (eventData.stage) setCurrentStage(eventData.stage);
    if (typeof eventData.progress === 'number') setProgress(eventData.progress);
    if (eventData.message) setCurrentMessage(eventData.message);
    if (eventData.data) setLatestData(eventData.data);

    if (eventType === 'research:completed') {
      setIsCompleted(true);
      setProgress(100);
    }
    if (eventType === 'research:error') {
      setError(eventData.message || 'An error occurred during research');
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to backend Socket.IO (uses VITE_SOCKET_URL or VITE_API_URL in production, '/' for dev proxy)
    const getSocketServerUrl = () => {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
      if (!socketUrl) return '/';
      const clean = socketUrl.trim().replace(/\/$/, '');
      return clean.replace(/\/api$/, '');
    };

    const socket = io(getSocketServerUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('session:join', { sessionId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    const eventNames = [
      'research:started',
      'research:planning',
      'research:searching',
      'research:summarizing',
      'research:fact-checking',
      'research:writing',
      'research:validation',
      'research:completed',
      'research:error',
    ];

    eventNames.forEach((evt) => {
      socket.on(evt, (data) => {
        if (data.sessionId === sessionId) {
          handleEvent(data, evt);
        }
      });
      // Also catch namespaced events
      socket.on(`session:${sessionId}:${evt}`, (data) => {
        handleEvent(data, evt);
      });
    });

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.disconnect();
    };
  }, [sessionId, handleEvent]);

  return {
    isConnected,
    events,
    currentStage,
    progress,
    currentMessage,
    isCompleted,
    error,
    latestData,
    clearEvents: () => setEvents([]),
  };
}
