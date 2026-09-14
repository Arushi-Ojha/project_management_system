import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedOrg = localStorage.getItem('organization');
    
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedOrg) {
      setOrganization(JSON.parse(savedOrg));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const setOrg = (orgData) => {
    setOrganization(orgData);
    localStorage.setItem('organization', JSON.stringify(orgData));
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
  };

  return (
    <AuthContext.Provider value={{ user, organization, login, logout, setOrg }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
