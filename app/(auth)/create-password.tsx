import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useSignUp } from '@/contexts/SignUpContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function CreatePassword() {
  const { setField, data } = useSignUp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const validatePassword = () => {
    return hasMinLength && hasNumber && hasSymbol && passwordsMatch;
  };

  const handleNext = () => {
    if (!hasMinLength || !hasNumber || !hasSymbol) {
      return alert('Password must be 8+ chars, include a number and a symbol.');
    }
    if (!passwordsMatch) {
      return alert('Passwords do not match. Please confirm your password.');
    }
    setField('password', password);

    if (data.isGoogleAuth) {
      // Google users skip account-type and get-started, go straight to tell-us-more
      router.push('/(auth)/tell-us-more');
    } else {
      // Regular users go through welcome → account-type → tell-us-more
      router.push('/(auth)/welcome');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {data.isGoogleAuth ? 'Set a Backup Password' : 'Create a Password'}
        </Text>
        <Text style={styles.subtitle}>
          {data.isGoogleAuth
            ? 'Set a backup password in case Google login is unavailable'
            : 'Your password must be at least 8 characters long, and include 1 symbol and 1 number'}
        </Text>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            placeholderTextColor="#999" 
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoComplete="off"        // ← add this
            textContentType="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && !passwordsMatch && styles.inputError
            ]}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
          {confirmPassword.length > 0 && passwordsMatch && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#22c55e"
              style={styles.confirmIcon}
            />
          )}
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Ionicons
              name="close-circle"
              size={20}
              color="#ef4444"
              style={styles.confirmIcon}
            />
          )}
        </View>

        {/* Password Criteria */}
        <View style={styles.criteriaContainer}>
          <View style={styles.criteriaItem}>
            <Ionicons
              name={hasMinLength ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasMinLength ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.criteriaText, hasMinLength && styles.criteriaTextValid]}>
              Minimum 8 characters
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons
              name={hasNumber ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasNumber ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.criteriaText, hasNumber && styles.criteriaTextValid]}>
              At least one number
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons
              name={hasSymbol ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasSymbol ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.criteriaText, hasSymbol && styles.criteriaTextValid]}>
              At least one symbol
            </Text>
          </View>

          <View style={styles.criteriaItem}>
            <Ionicons
              name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={passwordsMatch ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.criteriaText, passwordsMatch && styles.criteriaTextValid]}>
              Passwords match
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!validatePassword() || confirmPassword.length === 0) && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={!validatePassword() || confirmPassword.length === 0}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white'
  },
  content: {
    marginTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    fontSize: 16,
    paddingRight: 50,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  confirmIcon: {
    position: 'absolute',
    right: 45,
    top: 15,
  },
  criteriaContainer: {
    gap: 12,
    marginBottom: 40,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  criteriaText: {
    fontSize: 14,
    color: '#666',
  },
  criteriaTextValid: {
    color: '#22c55e',
    fontWeight: '500',
  },

  button: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },

  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});