// app/(auth)/get-started.tsx
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSignUp } from '@/contexts/SignUpContext';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';


export default function GetStarted() {
  const { setField, data } = useSignUp();
  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn();
  const { isAuthenticated, isLoading } = useUser();
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [email, setEmail] = useState(data.email || '');
  const hasNavigated = useRef(false);

  // ✅ Handle navigation when authenticated - MORE RELIABLE
  useEffect(() => {
  console.log('🔍 [GetStarted] useEffect triggered:', {
    isLoading,
    isAuthenticated,
    hasNavigated: hasNavigated.current,
  });

  if (!isLoading && isAuthenticated && !hasNavigated.current) {
    hasNavigated.current = true;
    console.log('✅ [GetStarted] Navigating to tabs...');
    
    const timer = setTimeout(() => {
      console.log('➡️ [GetStarted] Executing router.replace to /(tabs)/home');
      // ✅ Navigate to the home tab specifically
      router.replace('/(tabs)/home');
    }, 300);
    
    return () => {
      console.log('🧹 [GetStarted] Cleaning up timer');
      clearTimeout(timer);
    };
  }
}, [isLoading, isAuthenticated]);

  // Show loading while checking auth
  if (isLoading) {
    console.log('⏳ [GetStarted] Loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If authenticated, show loading while navigation happens
  if (isAuthenticated) {
    console.log('🔄 [GetStarted] Authenticated, waiting for navigation...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F1F22" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  const handleNext = () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setField('firstName', firstName);
    setField('lastName', lastName);
    setField('email', email);
    router.push('/(auth)/create-password');
  };

  const handleGoogleSignUp = async () => {
    try {
      console.log('🔄 [GetStarted] Starting Google Sign-In...');
      await signInWithGoogle();
      console.log('✅ [GetStarted] Google sign-in completed, waiting for navigation...');
    } catch (err) {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      console.error('❌ [GetStarted] Google sign-in error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Let's get you started on your discipleship journey</Text>
        </View>

        <TextInput
          style={[styles.input, data.isGoogleAuth && data.firstName ? styles.inputPrefilled : null]}
          placeholder="First Name"
          placeholderTextColor="#999"
          value={firstName}
          onChangeText={setFirstName}
          editable={!data.isGoogleAuth || !data.firstName}
        />
        <TextInput
          style={[styles.input, data.isGoogleAuth && data.lastName ? styles.inputPrefilled : null]}
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={lastName}
          onChangeText={setLastName}
          editable={!data.isGoogleAuth || !data.lastName}
        />
        <TextInput
          style={[styles.input, data.isGoogleAuth && data.email ? styles.inputPrefilled : null]}
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!data.isGoogleAuth || !data.email}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignUp}
          disabled={googleLoading}
        >
          <Ionicons name="logo-google" size={20} color="#3F1F22" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.accountText}>
          Have an account?{' '}
          <Text style={styles.signInText} onPress={() => router.push('/(auth)/login')}>
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3F1F22',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  textContainer: {
    marginTop: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
  },
  inputPrefilled: {
    backgroundColor: '#F9F9F9',
    borderColor: '#e0e0e0',
    color: '#999',
  },
  subtitle: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3F1F22',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  accountText: {
    fontSize: 14,
    color: '#666',
  },
  signInText: {
    color: '#3F1F22',
    fontWeight: '600',
  },
});