import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError, getStoredToken, setStoredToken } from '../services/api.ts';
import { User } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    nationality?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User['profile']> & { firstName?: string; lastName?: string; phone?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ success: boolean; user: User; message: string; token?: string }>('/auth/login', {
      email,
      password,
    });
    if (res.success && res.user) {
      if (res.token) {
        setStoredToken(res.token);
      }
      setUser(res.user);
      return res.user;
    }
    throw new ApiError('Login failed', 400);
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    nationality?: string;
  }): Promise<User> => {
    const res = await api.post<{ success: boolean; user: User; message: string; token?: string }>('/auth/register', data);
    if (res.success && res.user) {
      if (res.token) {
        setStoredToken(res.token);
      }
      setUser(res.user);
      return res.user;
    }
    throw new ApiError('Registration failed', 400);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout backend error
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: any): Promise<void> => {
    const res = await api.patch<{ success: boolean; user: User }>('/auth/profile', data);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
