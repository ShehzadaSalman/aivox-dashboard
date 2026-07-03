import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, integrationAPI } from '../services/api';
import { loginOneSignalUser, logoutOneSignalUser, requestNotificationPermission } from '../services/pushNotificationService';

const AuthContext = createContext(null);
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const SMS_COUNTRY_CODE_KEY = 'smsDefaultCountryCode';

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) {
    return null;
  }
  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
      }
      if (response.data?.id) {
        await loginOneSignalUser(response.data.id);
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSmsCountryCode = useCallback(async () => {
    try {
      const response = await integrationAPI.get('sms');
      const code =
        response?.data?.config?.defaultCountryCode || '';
      if (typeof window !== 'undefined') {
        if (code) {
          localStorage.setItem(SMS_COUNTRY_CODE_KEY, code);
        } else {
          localStorage.removeItem(SMS_COUNTRY_CODE_KEY);
        }
      }
    } catch (error) {
      // keep stale cached value if request fails
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchUser();
      fetchSmsCountryCode();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser, fetchSmsCountryCode]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        }
        setToken(response.token);
        await fetchUser();
        await fetchSmsCountryCode();
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const pending = /pending approval/i.test(error.message || '');
      return { success: false, pending, error: error.message };
    }
  };

  const register = async (email, password, name, phone) => {
    try {
      const response = await authAPI.register(email, password, name, phone);
      if (response.success) {
        if (response.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, response.token);
          }
          setToken(response.token);
          await fetchUser();
          await fetchSmsCountryCode();
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

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      if (response.success && response.data) {
        setUser(response.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
        }
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      return { success: true };
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

  const startPasswordResetEmail = async (email) => {
    try {
      const response = await authAPI.startPasswordResetEmail(email);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const verifyPasswordResetEmail = async (email, code) => {
    try {
      const response = await authAPI.verifyPasswordResetEmail(email, code);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const completePasswordResetEmail = async (email, code, password) => {
    try {
      const response = await authAPI.completePasswordResetEmail(
        email,
        code,
        password
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(async () => {
    await logoutOneSignalUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(SMS_COUNTRY_CODE_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }
  }, [logout]);

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
    updateProfile,
    changePassword,
    startPhoneVerification,
    verifyPhone,
    startPasswordResetEmail,
    verifyPasswordResetEmail,
    completePasswordResetEmail,
    logout,
    isAdmin,
    isSuperAdmin,
    isAuthenticated: !!token,
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
