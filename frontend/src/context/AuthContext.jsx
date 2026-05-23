import React, { createContext, useState, useEffect } from 'react';
import { subscribeRealtimeSync } from '../lib/realtimeSync';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('alumnex_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('AuthProvider: Failed to parse user from localStorage', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('alumnex_token'));

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('alumnex_user', JSON.stringify(userData));
    localStorage.setItem('alumnex_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('alumnex_user');
    localStorage.removeItem('alumnex_token');
    // Clear profile data on logout so a different user on the same device
    // doesn't see the previous user's profile before their own loads from DB.
    localStorage.removeItem('alumnex_profile');
    localStorage.removeItem('alumniconnect_profile');
    localStorage.removeItem('alumnex_notifs');
    sessionStorage.removeItem('alumnex_ended_sessions');
  };

  useEffect(() => {
    return subscribeRealtimeSync(() => {
      // Only update state if the stored value actually changed to avoid
      // cross-tab overwrites clobbering the current session's auth state.
      const savedUser = localStorage.getItem('alumnex_user');
      const savedToken = localStorage.getItem('alumnex_token');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Only update if the user ID changed (e.g. different tab logged in as someone else)
          setUser(prev => (prev?.id !== parsed?.id ? parsed : prev));
        } catch {}
      }
      if (savedToken) {
        setToken(prev => (prev !== savedToken ? savedToken : prev));
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
