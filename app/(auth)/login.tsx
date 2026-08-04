// app/(auth)/login.tsx
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { API_CONFIG } from '@/constants/config';
import { getOrCreateDeviceId } from '@/utils/deviceId';

export default function Login() {
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Required Fields', 'Please enter both email and password');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }

    setLoading(true);

    try {
      if (__DEV__) console.log('[Login] Requesting', `${API_CONFIG.BASE_URL}/user/login`);

      const deviceId = await getOrCreateDeviceId();
      const response = await fetch(`${API_CONFIG.BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, deviceId, deviceType: 'mobile' }),
      });

      const result = await response.json();

      if (__DEV__) console.log('[Login] Response status:', response.status);

      if (response.ok) {
        // ✅ Extract both tokens
        const userToken = result.accessToken || result.data?.token || result.data?.accessToken;
        const userRefreshToken = result.refreshToken || result.data?.refreshToken || null;

        if (!userToken) {
          console.error('[Login] No token in response');
          Alert.alert('Error', 'Invalid response from server');
          setLoading(false);
          return;
        }

        // ── ORGANIZATION LOGIN ──────────────────────────────────────
        if (result.data?.organization) {
          const orgData = result.data.organization;

          const tokenPayload = JSON.parse(atob(userToken.split('.')[1]));

          const normalizedUserData = {
            id: tokenPayload.id,
            first_name: orgData.organization_name,
            last_name: '',
            email_address: orgData.organization_email,
            role: 'instructor' as const,
            originalRole: orgData.organization_role,
            // Definitive org-owner marker: this branch only runs when the
            // backend returned an organization payload. isOrganizationAdmin
            // relies on this rather than string-matching a role field.
            accountType: 'ORGANIZATION' as const,
            organizationId: tokenPayload.organizationId || orgData.id,
            user_pic: null,
          };

          await setUser(normalizedUserData, userToken, userRefreshToken);

          if (__DEV__) await debugTokens(userToken, userRefreshToken, 'organization');

          setTimeout(() => {
            router.replace('/(tabs)/home');
          }, 100);

        // ── REGULAR USER LOGIN ──────────────────────────────────────
        } else if (result.data?.user) {
          const userData = result.data.user;

          let appRole: 'student' | 'instructor' | 'admin' = 'student';
          if (userData.role === 'instructor') {
            appRole = 'instructor';
          } else if (userData.role === 'goye_admin') {
            // Backend stores platform admins with role "goye_admin" (see
            // UserController.Login/GoogleAuth) — not "admin".
            appRole = 'admin';
          }

          const normalizedUserData = {
            id: userData.id,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email_address: userData.email || userData.email_address || '',
            role: appRole,
            originalRole: userData.role,
            adminRole: userData.adminRole,
            // Invited members promoted to org_admin arrive on this path, so
            // isOrganizationAdmin still falls back to originalRole here.
            accountType: 'USER' as const,
            organizationId: userData.organizationId || '',
            phone_number: userData.phone_number || '',
            country: userData.country || '',
            state: userData.state || '',
            level: userData.level || '',
            user_pic: userData.user_pic || null,
          };

          await setUser(normalizedUserData, userToken, userRefreshToken);

          if (__DEV__) await debugTokens(userToken, userRefreshToken, userData.role);

          setTimeout(() => {
            router.replace('/(tabs)/home');
          }, 100);

        } else {
          Alert.alert('Error', 'Invalid response from server');
        }

      } else {
        let errorMessage = 'Login failed. Please try again.';
        if (result.message) {
          if (result.message.includes('Invalid credentials') ||
              result.message.includes('password') ||
              result.message.includes('email')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (result.message.includes('not found')) {
            errorMessage = 'No account found with this email. Please sign up first.';
          } else {
            errorMessage = result.message;
          }
        }
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('=== LOGIN EXCEPTION ===', error);
      Alert.alert('Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Debug function to analyze tokens
  const debugTokens = async (accessToken: string, refreshToken: string | null, role: string) => {
    console.log('=== 🔍 TOKEN STRUCTURE DEBUG ===');
    console.log('User role:', role);
    console.log('Access token exists:', !!accessToken);
    console.log('Refresh token exists:', !!refreshToken);
    console.log('Access token preview:', accessToken?.substring(0, 30) + '...');
    console.log('Refresh token preview:', refreshToken?.substring(0, 30) + '...');

    // Decode access token
    try {
      const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('📋 Access token payload:', JSON.stringify(accessPayload, null, 2));
      console.log('⏰ Access token expiry:', new Date(accessPayload.exp * 1000).toLocaleString());
      console.log('⏰ Access token issued at:', new Date(accessPayload.iat * 1000).toLocaleString());
      
      // Calculate time until expiry
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = accessPayload.exp - now;
      const minutesLeft = Math.floor(timeLeft / 60);
      const secondsLeft = timeLeft % 60;
      console.log(`⏱️ Token expires in: ${minutesLeft}m ${secondsLeft}s`);
    } catch (e) {
      console.log('❌ Could not decode access token:', e);
    }

    // Decode refresh token (if it exists)
    if (refreshToken) {
      try {
        const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
        console.log('📋 Refresh token payload:', JSON.stringify(refreshPayload, null, 2));
        console.log('⏰ Refresh token expiry:', new Date(refreshPayload.exp * 1000).toLocaleString());
        console.log('⏰ Refresh token issued at:', new Date(refreshPayload.iat * 1000).toLocaleString());
        
        // Check if refresh token has different claims
        const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
        console.log('🔑 Refresh token has same user?', refreshPayload.id === accessPayload.id);
        console.log('🔑 Refresh token has same role?', refreshPayload.role === accessPayload.role);
      } catch (e) {
        console.log('❌ Could not decode refresh token:', e);
      }
    } else {
      console.log('❌ No refresh token received from server!');
    }
    console.log('=========================================');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/get-started')}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20 },
  backButton: { paddingVertical: 10, marginBottom: 20, alignSelf: 'flex-start' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24 },
  form: { flex: 1 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
    backgroundColor: '#f9f9f9', paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#000' },
  eyeIcon: { padding: 5 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotPasswordText: { fontSize: 14, color: '#3F1F22', fontWeight: '600' },
  loginButton: {
    backgroundColor: '#3F1F22', paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 20,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  signupText: { fontSize: 14, color: '#666' },
  signupLink: { fontSize: 14, color: '#3F1F22', fontWeight: '600' },
});