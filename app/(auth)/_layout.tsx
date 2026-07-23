// File: app/(auth)/_layout.tsx

import { Stack } from 'expo-router';
import { OrganizationProvider } from '@/contexts/OrganizationContext';

export default function AuthLayout() {
  return (
    <OrganizationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Initial screens */}
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="get-started" />
        
        {/* Account type selection - NEW */}
        <Stack.Screen name="account-type" />
        
        {/* Organization flow - NEW */}
        <Stack.Screen name="organization-type" />
        <Stack.Screen name="organization-form" />
        <Stack.Screen name="user-profile-form" />
        <Stack.Screen name="church-form" />
        <Stack.Screen name="school-form" />
        <Stack.Screen name="club-form" />
        <Stack.Screen name="preview-verification" />
        
        {/* Individual flow (existing) */}
       
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="create-password"/>
        
        {/* Shared screens */}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="tell-us-more" />
        <Stack.Screen name="success" />
        
        {/* Login */}
        <Stack.Screen name="login" />
      </Stack>
    </OrganizationProvider>
  );
}