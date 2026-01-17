"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { authApi, getAuthToken, setAuthToken } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = getAuthToken();
    setIsInitialized(true);
    if (!token) {
      setAuthToken(null);
    }
  }, []);

  // Fetch current user
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
    enabled: isInitialized && !!getAuthToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const token = getAuthToken();

    if (!user || !token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    const handleMessageCount = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
    };

    socket.on('notification:new', handleNotification);
    socket.on('message:unread-count', handleMessageCount);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('message:unread-count', handleMessageCount);
    };
  }, [user, queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('tibeb_just_registered', '0');
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      localStorage.setItem('tibeb_just_registered', '1');
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = useCallback(async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(() => {
    authApi.logout();
    disconnectSocket();
    localStorage.removeItem('tibeb_just_registered');
    queryClient.setQueryData(['currentUser'], null);
    queryClient.clear();
  }, [queryClient]);

  const refetchUser = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: !isInitialized || isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
