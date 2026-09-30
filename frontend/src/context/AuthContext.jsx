import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthAPI } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token') || null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize: verify stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const data = await AuthAPI.getMe();
          if (data?.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('auth_token');
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('Stored auth token invalid or expired:', err.message);
          localStorage.removeItem('auth_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await AuthAPI.login({ email, password });
      if (res.token && res.user) {
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const res = await AuthAPI.register({ name, email, password });
      if (res.token && res.user) {
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        clearError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
