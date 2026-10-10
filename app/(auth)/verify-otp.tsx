import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useSignUp } from '@/contexts/SignUpContext';
import { router } from 'expo-router';
import { API_CONFIG } from '@/constants/config';
import { useAlert } from '@/hooks/useAlert';
import { sendOtp } from '@/services/api';

const OTP_WINDOW_SECONDS = 300;

export default function VerifyOtp() {
  const { alert, AlertComponent } = useAlert();
  const {data, setField } = useSignUp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
   const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_WINDOW_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);


  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const formatTime = (total: number) =>
    `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await sendOtp(data.email, 'signup');
      setField('otpSessionToken', result.sessionToken);
      setOtp(['', '', '', '', '', '']);
      setSecondsLeft(OTP_WINDOW_SECONDS);
      inputRefs.current[0]?.focus();
      alert('Code sent', 'A new verification code is on its way.');
    } catch (err: any) {
      alert('Could not resend', err?.message || 'Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = async () => {
  const otpValue = otp.join('');
  if (otpValue.length !== 6) {
    return alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/user/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: data.otpSessionToken,
        otp: otpValue,
      }),
    });

    const result = await response.json();

    if (__DEV__) console.log('[OTP] Verification status:', response.status);

    if (response.ok) {
      console.log('✅ OTP verified successfully');
      setField('otp', otpValue);
      // Verified: on to choosing a password, as on the web.
      router.replace('/(auth)/create-password');
    } else {
      console.error('❌ OTP verification failed');
      alert(
        'Verification Failed',
        result.message || 'Invalid OTP. Please try again.'
      );
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    alert('Error', 'Unable to verify OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>A one-time password has been sent to your email.</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
              ]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {secondsLeft > 0 ? (
          <Text style={styles.resendText}>
            Code expires in <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
          </Text>
        ) : (
          <Text style={styles.resendText}>Your code has expired.</Text>
        )}
        <TouchableOpacity onPress={handleResend} disabled={resending || loading}>
          <Text style={[styles.timer, { marginBottom: 8 }]}>
            {resending ? 'Sending...' : 'Resend code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
      {AlertComponent}
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
    marginBottom: 40 
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    padding: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: '#f9f9f9',
  },
  otpBoxFilled: {
    borderColor: '#3F1F22',
    backgroundColor: 'white',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  timer: {
    color: '#3F1F22',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
   buttonDisabled: {
    opacity: 0.6,
  },
});