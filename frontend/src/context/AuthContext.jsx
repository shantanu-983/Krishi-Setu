import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const existingToken = getStoredToken();
      if (existingToken) {
        const res = await api.getMe();
        if (res.ok && res.data) {
          setUser(res.data);
        } else {
          // Token expired or invalid
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  async function login(phone, password) {
    const res = await api.login({ phone, password });
    if (res.ok && res.data) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.error || 'Login failed' };
  }

  async function register(userData) {
    const res = await api.register(userData);
    if (res.ok && res.data) {
      setStoredToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.error || 'Registration failed' };
  }

  function logout() {
    api.logout();
    setToken(null);
    setUser(null);
  }

  async function updateProfile(updates) {
    const res = await api.updateProfile(updates);
    if (res.ok && res.data) {
      setUser(res.data);
      return { success: true, user: res.data };
    }
    return { success: false, error: res.error || 'Profile update failed' };
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
