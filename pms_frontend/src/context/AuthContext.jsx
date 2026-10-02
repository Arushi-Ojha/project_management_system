import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [token, user?.id]);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await apiCall('/notifications/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Quiet fail if network/unauth
    }
  };

  const login = (authData) => {
    const { accessToken, user: userData } = authData;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setUnreadCount(0);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        unreadCount,
        loading,
        login,
        logout,
        updateUser,
        refreshNotifications: fetchUnreadNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
