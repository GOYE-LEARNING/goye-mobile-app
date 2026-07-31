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
  adminRole?: string;
  accountType?: 'ORGANIZATION' | 'USER';
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
  isSuperAdmin: boolean;
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
  // AdminProfile.role defaults to "super_admin" on the backend when no
  // profile row exists, so an admin with no adminRole set is treated the
  // same way here.
  const isSuperAdmin = isAdmin && (!user?.adminRole || user.adminRole === 'super_admin');

  // An organization owner's User.role is "org_admin" (OrganizationController
  // .CreateOrganization), and /user/login returns it as
  // organization.organization_role. This previously compared against
  // "administrator" — the value the org *signup form* collects into the separate
  // Organization.organization_role column, which login never returns — so the
  // flag was always false and every org-admin screen was unreachable.
  // accountType is definitive for fresh logins; the role check keeps sessions
  // already persisted in AsyncStorage working and covers invited members
  // promoted to org_admin, who log in via the regular-user path.
  const normalizedOriginalRole = user?.originalRole?.toLowerCase();
  const isOrganizationAdmin =
    user?.accountType === 'ORGANIZATION' ||
    normalizedOriginalRole === 'org_admin' ||
    normalizedOriginalRole === 'administrator';

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
        isSuperAdmin,
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