// contexts/UserContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type Role = 'student' | 'instructor' | 'admin';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  role: Role;
  originalRole?: string;
  organizationId?: string;
  user_pic?: string | null;
  phone_number?: string;
  country?: string;
  state?: string;
  level?: string;
  completed?: string;
  createdAt?: string;
  isOnline?: boolean;
  lastActive?: string;
}

type UserContextType = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean; 
  setUser: (user: User, token?: string, refreshToken?: string) => Promise<void>;
  logout: (onSignOutComplete?: () => Promise<void>) => Promise<void>;
  isInstructor: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isOrganizationAdmin: boolean;
  isAuthenticated: boolean;
  clearUserData: () => Promise<void>;
};


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOrganizationAdmin = user?.originalRole?.toLowerCase() === 'administrator';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userData, userToken, userRefreshToken] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('refreshToken'),
      ]);
      if (userData) setUserState(JSON.parse(userData));
      if (userToken) setToken(userToken);
      if (userRefreshToken) setRefreshToken(userRefreshToken);
      console.log('✅ User data loaded:', { hasUser: !!userData, hasToken: !!userToken, hasRefresh: !!userRefreshToken });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User, userToken?: string, userRefreshToken?: string) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUserState(userData);
      
      if (userToken) {
        await AsyncStorage.setItem('userToken', userToken);
        setToken(userToken);
      }
      
      if (userRefreshToken) {
        await AsyncStorage.setItem('refreshToken', userRefreshToken);
        setRefreshToken(userRefreshToken);
      }
      
      console.log('✅ User data saved successfully');
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      setUserState(null);
      setToken(null);
      setRefreshToken(null);
      console.log('✅ User data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  };

  const logout = async (onSignOutComplete?: () => Promise<void>) => {
    try {
      await clearUserData();
      console.log('✅ Local user data cleared');

      if (onSignOutComplete) {
        await onSignOutComplete();
      }
      
      // Navigate to login
      router.replace('/(auth)/start');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        setUser,
        logout,
        clearUserData,
        isInstructor,
        isStudent,
        isAdmin,
        isOrganizationAdmin,
        isAuthenticated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};