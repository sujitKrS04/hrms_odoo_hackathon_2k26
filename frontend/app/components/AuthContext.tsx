'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  loginId: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  firstName: string;
  lastName: string;
  companyId: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  // Route protection rules
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/hr/signin') ||
      pathname.startsWith('/hr/signup') ||
      pathname.startsWith('/employee/signin') ||
      pathname.startsWith('/employee/signup');

    const isDesignPreview = pathname.startsWith('/design-preview');

    if (isDesignPreview) return;

    if (!token && !isAuthRoute) {
      router.push('/');
    } else if (token) {
      if (user?.mustChangePassword && pathname !== '/change-password') {
        router.push('/change-password');
      } else if (isAuthRoute && pathname !== '/') {
        router.push('/dashboard');
      }
    }
  }, [token, user, pathname, isLoading, router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
