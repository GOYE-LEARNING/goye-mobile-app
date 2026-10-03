// app/(tabs)/profile/change-password.tsx
//
// Mirrors web's verification flow exactly (dashboard_change_password.tsx →
// dashboard_profile_verify_email.tsx → dashboard_profile_reset_password.tsx):
// 1. Confirm the account email, send an OTP to it.
// 2. Enter the 6-digit OTP (5 minute window, resend once expired).
// 3. Set a new password, which only needs the normal auth session - the
//    backend's /user/update-password doesn't re-check the OTP itself, same
//    as web, so this step is reached only after step 2 actually succeeds.
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { sendOtp, verifyOtp, updatePassword } from '@/services/api';
import { useAlert } from '@/hooks/useAlert';

type Step = 'email' | 'otp' | 'password';

const OTP_WINDOW_SECONDS = 300;

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'At least one number', test: (v: string) => /\d/.test(v) },
  { label: 'At least one symbol', test: (v: string) => /[@$!%*?&]/.test(v) },
];

export default function ChangePassword() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const s = makeStyles(colors);

  const [step, setStep] = useState<Step>('email');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_WINDOW_SECONDS);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const email = user?.email_address || '';

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [step, secondsLeft]);

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async () => {
    if (!email) {
      alert('Error', 'No email address found on your account.');
      return;
    }
    try {
      setSendingOtp(true);
      const result = await sendOtp(email);
      setSessionToken(result.sessionToken);
      setOtp(['', '', '', '', '', '']);
      setSecondsLeft(OTP_WINDOW_SECONDS);
      setStep('otp');
    } catch (err: any) {
      alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < 5) otpRefs.current[index + 1]?.focus();
    if (text && index === 5) {
      const fullOtp = next.join('');
      if (fullOtp.length === 6) handleVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (fullOtp: string) => {
    if (!sessionToken) return;
    try {
      setVerifyingOtp(true);
      await verifyOtp(sessionToken, fullOtp);
      setStep('password');
    } catch (err: any) {
      alert('Verification Failed', err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifyingOtp(false);
    }
  };

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(newPassword));

  const handleUpdatePassword = async () => {
    if (!allRulesPassed) {
      alert('Error', 'Please meet all password requirements');
      return;
    }
    try {
      setUpdating(true);
      await updatePassword(newPassword, token!);
      alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ], 'success');
    } catch (err: any) {
      alert('Error', err.message || 'Failed to update password. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const headerTitle =
    step === 'email' ? 'Change Password' : step === 'otp' ? 'Verify Email' : 'Reset Password';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => (step === 'email' ? router.back() : setStep(step === 'password' ? 'otp' : 'email'))}
          style={s.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {step === 'email' && (
          <View style={s.content}>
            <View style={s.infoRow}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={s.infoText}>We will be sending you an OTP to this email</Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email address</Text>
              <View style={[s.readOnlyField, { borderColor: colors.border }]}>
                <Text style={[s.readOnlyText, { color: colors.textMuted }]}>{email}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.primaryButton, { backgroundColor: colors.brand }, sendingOtp && s.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'otp' && (
          <View style={s.content}>
            <Text style={s.subtitle}>
              A one-time password has been sent to your email. Please check your inbox and enter the OTP below.
            </Text>

            <View style={s.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  style={[
                    s.otpBox,
                    { borderColor: colors.border, color: colors.text },
                    digit && { borderColor: colors.brand },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!verifyingOtp}
                />
              ))}
            </View>

            <Text style={[s.resendText, { color: colors.textMuted }]}>
              {secondsLeft > 0 ? (
                <>Resend OTP in <Text style={{ color: colors.brand, fontWeight: '600' }}>{formatTime(secondsLeft)}</Text></>
              ) : (
                'Your OTP has expired. Tap below to get a new code.'
              )}
            </Text>

            <TouchableOpacity
              style={[
                s.primaryButton,
                { backgroundColor: colors.brand },
                (verifyingOtp || (secondsLeft > 0 && sendingOtp)) && s.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={secondsLeft > 0 || sendingOtp}
            >
              {verifyingOtp || sendingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.primaryButtonText}>{secondsLeft === 0 ? 'Resend OTP' : 'Enter OTP above'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'password' && (
          <View style={s.content}>
            <Text style={s.subtitle}>
              Your password must be at least 8 characters long, and include 1 symbol and 1 number.
            </Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>New Password</Text>
              <View style={[s.passwordInput, { borderColor: colors.border }]}>
                <TextInput
                  style={[s.input, { color: colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholder="New Password"
                  placeholderTextColor={colors.textMuted}
                  editable={!updating}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {newPassword.length > 0 && (
              <View style={s.rulesList}>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPassword);
                  return (
                    <View key={rule.label} style={s.ruleRow}>
                      <Ionicons
                        name={passed ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={passed ? '#22c55e' : '#EF4444'}
                      />
                      <Text style={[s.ruleText, { color: passed ? '#22c55e' : colors.textMuted }]}>{rule.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryButton, { backgroundColor: colors.brand }, (updating || !allRulesPassed) && s.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={updating || !allRulesPassed}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      {AlertComponent}
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text, flex: 1, textAlign: 'center' },
    content: { padding: 20 },
    subtitle: { fontSize: 14, color: c.textSecondary, marginBottom: 24, lineHeight: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    infoText: { fontSize: 12, color: c.textSecondary, flex: 1 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 12, color: c.textMuted, marginBottom: 8 },
    readOnlyField: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 16 },
    readOnlyText: { fontSize: 16 },
    passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 16 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },
    primaryButton: { paddingVertical: 16, alignItems: 'center', borderRadius: 8, marginTop: 8 },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    buttonDisabled: { opacity: 0.6 },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
    otpBox: {
      flex: 1, borderWidth: 1.5, paddingVertical: 16, textAlign: 'center',
      fontSize: 24, fontWeight: '600', borderRadius: 8,
    },
    resendText: { fontSize: 14, marginBottom: 20 },
    rulesList: { gap: 8, marginBottom: 8 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ruleText: { fontSize: 13 },
  });
}
