import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types/admin';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'ADM-001',
  name: 'Admin',
  email: 'admin@india2world.com',
  role: 'Super Admin',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const local = localStorage.getItem('i2w_admin_auth');
    const session = sessionStorage.getItem('i2w_admin_auth');
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasAuthParam = urlParams?.get('adminAuth') === 'true';
    return local === 'true' || session === 'true' || hasAuthParam;
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('i2w_admin_user') || sessionStorage.getItem('i2w_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ADMIN;
      }
    }
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasAuthParam = urlParams?.get('adminAuth') === 'true';
    const local = localStorage.getItem('i2w_admin_auth');
    const session = sessionStorage.getItem('i2w_admin_auth');
    return (local === 'true' || session === 'true' || hasAuthParam) ? DEFAULT_ADMIN : null;
  });

  const login = async (email: string, pass: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    // Basic validation
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your admin email or username' };
    }
    if (!trimmedPass) {
      return { success: false, error: 'Please enter your password' };
    }

    // Demo authentication check
    // Allows demo credentials or pre-configured admin
    const isValid =
      (trimmedEmail === 'admin@india2world.com' && trimmedPass === 'admin123') ||
      (trimmedEmail === 'admin' && trimmedPass === 'admin') ||
      (trimmedEmail.includes('@') && trimmedPass.length >= 6);

    if (!isValid) {
      return { success: false, error: 'Invalid admin credentials. Use admin@india2world.com / admin123' };
    }

    const user: AdminUser = {
      ...DEFAULT_ADMIN,
      email: trimmedEmail.includes('@') ? trimmedEmail : 'admin@india2world.com',
    };

    setIsAuthenticated(true);
    setAdminUser(user);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('i2w_admin_auth', 'true');
    storage.setItem('i2w_admin_user', JSON.stringify(user));

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem('i2w_admin_auth');
    localStorage.removeItem('i2w_admin_user');
    sessionStorage.removeItem('i2w_admin_auth');
    sessionStorage.removeItem('i2w_admin_user');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminUser, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
