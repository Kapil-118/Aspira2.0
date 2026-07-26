import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication tokens on load
  useEffect(() => {
    const savedToken = localStorage.getItem('aspira_token');
    const savedUser = localStorage.getItem('aspira_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login handler
  const loginUser = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('aspira_token', userToken);
        localStorage.setItem('aspira_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
      }
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  // Registration handler
  const registerUser = async (name, email, password, role) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, role });
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  // OTP Verification handler
  const verifyOTP = async (email, otp) => {
    try {
      const res = await API.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('aspira_token', userToken);
        localStorage.setItem('aspira_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
      }
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  // Logout handler
  const logoutUser = () => {
    localStorage.removeItem('aspira_token');
    localStorage.removeItem('aspira_user');
    setToken(null);
    setUser(null);
  };

  // Forgot password handler
  const forgotPassword = async (email) => {
    try {
      const res = await API.post('/auth/forgot-password', { email });
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  // Reset password handler
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await API.post('/auth/reset-password', { email, otp, newPassword });
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  // Update profile details
  const updateProfile = async (formData) => {
    try {
      // Use multipart/form-data config for Multer upload support
      const res = await API.put('/profile/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        const updatedUser = res.data.user;
        localStorage.setItem('aspira_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return res.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginUser,
        register: registerUser,
        verifyOTP,
        logout: logoutUser,
        forgotPassword,
        resetPassword,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
