"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, User, mapBackendRoleToFrontend } from './types';
import { authAPI, APIError } from './api';

interface RoleContextType {
  currentRole: Role | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (zohoUserId: string) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('kra360_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (err) {
        console.error('Failed to restore session:', err);
        sessionStorage.removeItem('kra360_user');
      }
    }
  }, []);

  /**
   * Login with Zoho User ID
   * Calls backend API and stores user data
   */
  const login = async (zohoUserId: string): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API
      const response = await authAPI.loginWithZohoId(zohoUserId);

      // Transform backend response to frontend User type
      const userData: User = {
        id: response.id,
        zohoUserId: response.zohoUserId,
        name: response.name,
        email: response.email,
        role: mapBackendRoleToFrontend(response.role),
        designation: response.designation,
        department: response.department,
        status: response.status,
        photo: response.photo,
        // Generate avatar initials from name
        avatar: response.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      };

      // Store in state
      setCurrentUser(userData);

      // Persist to sessionStorage
      sessionStorage.setItem('kra360_user', JSON.stringify(userData));

      return userData;
    } catch (err) {
      const errorMessage = err instanceof APIError
        ? err.message
        : 'Failed to login. Please try again.';

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout - clear user data
   */
  const logout = () => {
    setCurrentUser(null);
    setError(null);
    sessionStorage.removeItem('kra360_user');
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  const currentRole = currentUser?.role || null;

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        isLoading,
        error,
        login,
        logout,
        clearError
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
