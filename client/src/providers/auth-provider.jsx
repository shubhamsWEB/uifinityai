"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, login, logout, register, isAuthenticated } from '@/lib/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);
  
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Clear invalid token
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };
  
  const signIn = async (credentials) => {
    setLoading(true);
    try {
      const data = await login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (userData) => {
    setLoading(true);
    try {
      const data = await register(userData);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };
  
  const signOut = () => {
    logout();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};