'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { LoginValues } from '@/lib/schemas';
import type { PublicUser } from '@/types';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (input: LoginValues) => Promise<PublicUser>;
  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    studentRegNo?: string;
  }) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: PublicUser }>('/api/v1/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ user: PublicUser }>('/api/v1/auth/me')
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginValues) => {
    const data = await apiRequest<{ user: PublicUser }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      studentRegNo?: string;
    }) => {
      const data = await apiRequest<{ user: PublicUser }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiRequest<{ message: string }>('/api/v1/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
