// File: app/(auth)/get-started.tsx

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function GetStarted() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF5F5', '#FFFFFF']}
        style={styles.gradient}
      />
      
      
      <View style={styles.content}>
        {/* Logo/Icon section */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>✝️</Text>
          <Text style={styles.logoText}>Goye</Text>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Goye</Text>
            <Text style={styles.subtitle}>
              Begin your discipleship journey with a community of believers
            </Text>
          </View>



          <TouchableOpacity
            style={styles.button} 
            onPress={() => router.push('/(auth)/account-type')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#3F1F22', '#5A2F33']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.accountText}>
          Already have an account?{' '}
          <Text 
            style={styles.signInText}
            onPress={() => router.push('/(auth)/login')}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '60%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F1F22',
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: { 
    fontSize: 32,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666666', 
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  accountText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  signInText: {
    color: '#3F1F22',
    fontWeight: '600',
  },
});