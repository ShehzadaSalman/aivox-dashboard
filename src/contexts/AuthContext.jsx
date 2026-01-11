import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      // Token might be invalid, clear it
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.token);
        }
        setToken(response.token);
        await fetchUser();
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, name, phone) => {
    try {
      const response = await authAPI.register(email, password, name, phone);
      if (response.success) {
        if (response.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', response.token);
          }
          setToken(response.token);
          await fetchUser();
          return { success: true };
        }
        return {
          success: true,
          pending: true,
          message: response.message || 'Your account is pending approval.',
        };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const startPhoneVerification = async (email, phone = null) => {
    try {
      const response = await authAPI.startPhoneVerification(email, phone);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyPhone = async (email, code) => {
    try {
      const response = await authAPI.verifyPhone(email, code);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  };

  const isSuperAdmin = () => {
    return user?.role === 'SUPERADMIN';
  };

  const value = {
    user,
    loading,
    login,
    register,
    startPhoneVerification,
    verifyPhone,
    logout,
    isAdmin,
    isSuperAdmin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
