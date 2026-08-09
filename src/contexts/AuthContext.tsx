import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'staff';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('eternarest_token');
    const storedUser = localStorage.getItem('eternarest_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('eternarest_token');
        localStorage.removeItem('eternarest_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('eternarest_token', response.data.token);
        localStorage.setItem('eternarest_user', JSON.stringify(response.data.user));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('eternarest_token');
    localStorage.removeItem('eternarest_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
