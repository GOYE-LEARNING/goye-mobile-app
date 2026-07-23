import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { useSignUp } from '@/contexts/SignUpContext';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next'; // ✅ CHANGE 1: ADD THIS
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/constants/config';
import { completeProfile } from '@/services/api';

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'India',
  'Brazil',
];

const STATES_BY_COUNTRY: { [key: string]: string[] } = {
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
  'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
};

const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
];

export default function TellUsMore() {
  const { data, setField } = useSignUp();
  const { setUser } = useUser();
  const { t } = useTranslation(); // ✅ CHANGE 2: ADD THIS
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState('');
  const [state, setStateVal] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'instructor' | ''>('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | ''>('');
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);

    try {
      if (data.isGoogleAuth) {
        // ─── Google Sign Up ───────────────────────────────────────────
        const result = await completeProfile(data.googleToken, {
          first_name: data.firstName,
          last_name: data.lastName,
          password: data.password,
          phone_number: `${countryCode}${phone}`,
          country,
          state,
          role,
          level,
          language: data.language,        // ✅ CHANGE 3: ADD THIS
          languageCode: data.languageCode, // ✅ CHANGE 3: ADD THIS
        });

        console.log('=== COMPLETE PROFILE RESPONSE ===');
        console.log(JSON.stringify(result, null, 2));

        if (result.data && result.token) {
          await setUser(result.data, result.token);
          console.log('✅ Google user profile completed');
        }

        router.push('/(auth)/success');

      } else {
        // ─── Regular Sign Up ──────────────────────────────────────────
        const signUpPayload = {
          first_name: data.firstName,
          last_name: data.lastName,
          email_address: data.email,
          password: data.password,
          country,
          state,
          phone_number: `${countryCode}${phone}`,
          role,
          level,
          language: data.language,        // ✅ CHANGE 4: ADD THIS
          languageCode: data.languageCode, // ✅ CHANGE 4: ADD THIS
        };

        console.log('=== SIGNUP REQUEST ===');
        console.log('URL:', `${API_CONFIG.BASE_URL}/user/signup`);
        console.log('Payload:', JSON.stringify(signUpPayload, null, 2));

        const response = await fetch(`${API_CONFIG.BASE_URL}/user/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signUpPayload),
        });

        const result = await response.json();

        console.log('=== SIGNUP RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Response Body:', JSON.stringify(result, null, 2));

        if (response.ok) {
          console.log('✅ Signup successful!');

          if (result.data && result.token) {
            await setUser(result.data, result.token);
            console.log('✅ User data saved successfully');
          }

          setField('country', country);
          setField('state', state);
          setField('phone', `${countryCode}${phone}`);
          setField('role', role);
          setField('level', level);

          // Send OTP
          try {
            console.log('📧 Sending OTP to:', data.email);
            const otpResponse = await fetch(`${API_CONFIG.BASE_URL}/user/sendOtp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email }),
            });

            const otpResult = await otpResponse.json();
            console.log('OTP Response:', otpResult);

            if (otpResponse.ok) {
              console.log('✅ OTP sent successfully');
              if (otpResult.sessionToken) {
                setField('otpSessionToken', otpResult.sessionToken);
                console.log('🔐 OTP session token saved');
              }
            } else {
              console.error('❌ Failed to send OTP:', otpResult);
            }
          } catch (otpError) {
            console.error('❌ OTP sending error:', otpError);
          }

          router.push('/(auth)/success');

        } else {
          console.error('❌ Signup failed with status:', response.status);

          let errorMessage = 'Something went wrong. Please try again.';

          if (result.message?.includes('Unique constraint failed on the fields: `email_address`')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (result.message?.toLowerCase().includes('already exist')) {
            errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (result.message?.includes('phone_number')) {
            errorMessage = 'This phone number is already registered. Please use a different number.';
          } else if (result.message || result.messgae) {
            errorMessage = result.message || result.messgae;
          }

          Alert.alert('Sign Up Failed', errorMessage);
        }
      }
    } catch (error) {
      console.error('=== SIGNUP EXCEPTION ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));

      Alert.alert(
        'Network Error',
        `Unable to connect to the server. Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && (!country || !state || !phone)) {
      return Alert.alert('Required Fields', 'Please fill all fields');
    }
    if (step === 1 && !role) {
      return Alert.alert('Role Required', 'Please select your role');
    }
    if (step === 2 && !level) {
      return Alert.alert('Level Required', 'Please select your level');
    }

    if (step < 2) {
      setStep(step + 1);
    } else {
      // On final step, call the API
      handleSignUp();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setStateVal('');
    
    // Auto-select country code when country changes
    const countryData = COUNTRY_CODES.find(item => item.country === value);
    if (countryData) {
      setCountryCode(countryData.code);
    }
  };

  const selectCountryCode = (code: string) => {
    setCountryCode(code);
    setShowCountryCodeModal(false);
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          title: 'Tell Us More About You',
          subtitle: 'Share your contact and where you\'re coming from',
        };
      case 1:
        return {
          title: 'What\'s Your Role?',
          subtitle: 'Select your role in the community',
        };
      case 2:
        return {
          title: 'What\'s Your Level?',
          subtitle: 'Tell us about your experience level',
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.progressBar,
            step >= index && styles.progressBarActive,
          ]}
        />
      ))}
    </View>
  );

  const { title, subtitle } = getStepContent();
  const availableStates = country ? STATES_BY_COUNTRY[country] || [] : [];
  const currentCountryData = COUNTRY_CODES.find(item => item.code === countryCode);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Title and Subtitle */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Step Content */}
        <View style={styles.content}>
          {step === 0 && (
            <>
              {/* Country Picker */}
              {/* Country Selector */}
<TouchableOpacity 
  style={styles.pickerContainer} 
  onPress={() => setShowCountryModal(true)}
>
  <Text style={[styles.pickerText, !country && styles.placeholderText]}>
    {country || 'Select Country'}
  </Text>
  <Ionicons name="chevron-down" size={16} color="#666" />
</TouchableOpacity>

{/* State Selector */}
<TouchableOpacity 
  style={styles.pickerContainer} 
  onPress={() => setShowStateModal(true)}
  disabled={!country}
>
  <Text style={[styles.pickerText, !state && styles.placeholderText]}>
    {state || 'Select State'}
  </Text>
  <Ionicons name="chevron-down" size={16} color="#666" />
</TouchableOpacity>

              {/* Phone Input with Country Code */}
              <View style={styles.phoneContainer}>
                <TouchableOpacity 
                  style={styles.countryCodeButton}
                  onPress={() => setShowCountryCodeModal(true)}
                  disabled={loading}
                >
                  <Text style={styles.countryCodeText}>
                    {currentCountryData?.flag} {countryCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  style={styles.phoneInput}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!loading}
                />
              </View>
            </>
          )}

          {step === 1 && (
            <View style={styles.options}>
              <TouchableOpacity
                style={[styles.option, role === 'student' && styles.activeOption]}
                onPress={() => setRole('student')}
                disabled={loading}
              >
                <Text style={[styles.optionText, role === 'student' && styles.activeOptionText]}>
                  Student
                </Text>
                <Text style={styles.optionDescription}>
                  i want to learn and track my journey
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, role === 'instructor' && styles.activeOption]}
                onPress={() => setRole('instructor')}
                disabled={loading}
              >
                <Text style={[styles.optionText, role === 'instructor' && styles.activeOptionText]}>
                  Instructor
                </Text>
                <Text style={styles.optionDescription}>
                  i want to teach and mentor students
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.options}>
              <TouchableOpacity
                style={[styles.option, level === 'beginner' && styles.activeOption]}
                onPress={() => setLevel('beginner')}
                disabled={loading}
              >
                <Text style={[styles.optionText, level === 'beginner' && styles.activeOptionText]}>
                  Beginner
                </Text>
                <Text style={styles.optionDescription}>
                  Just starting my journey
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, level === 'intermediate' && styles.activeOption]}
                onPress={() => setLevel('intermediate')}
                disabled={loading}
              >
                <Text style={[styles.optionText, level === 'intermediate' && styles.activeOptionText]}>
                  Intermediate
                </Text>
                <Text style={styles.optionDescription}>
                  I have some experience
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Next/Finish Button */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{step < 2 ? 'Next' : 'Finish'}</Text>
        )}
      </TouchableOpacity>



      {/* Country Code Modal */}
      {/* Country Modal */}
<Modal visible={showCountryModal} animationType="slide" presentationStyle="pageSheet">
  <SafeAreaView style={styles.modalContainer}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Select Country</Text>
      <TouchableOpacity onPress={() => setShowCountryModal(false)}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>
    </View>
    <ScrollView style={styles.modalContent}>
      {COUNTRIES.map((c) => (
        <TouchableOpacity
          key={c}
          style={[styles.countryCodeItem, country === c && styles.selectedCountryCode]}
          onPress={() => { handleCountryChange(c); setShowCountryModal(false); }}
        >
          <Text style={styles.countryName}>{c}</Text>
          {country === c && <Ionicons name="checkmark" size={20} color="#3F1F22" />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
</Modal>

{/* State Modal */}
<Modal visible={showStateModal} animationType="slide" presentationStyle="pageSheet">
  <SafeAreaView style={styles.modalContainer}>
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Select State</Text>
      <TouchableOpacity onPress={() => setShowStateModal(false)}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>
    </View>
    <ScrollView style={styles.modalContent}>
      {availableStates.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.countryCodeItem, state === s && styles.selectedCountryCode]}
          onPress={() => { setStateVal(s); setShowStateModal(false); }}
        >
          <Text style={styles.countryName}>{s}</Text>
          {state === s && <Ionicons name="checkmark" size={20} color="#3F1F22" />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#3F1F22',
  },
  headerSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
   pickerText: {
  fontSize: 16,
  color: '#000',
  flex: 1,
},
  placeholderText: {
  color: '#999',
},
  picker: {
    height: 50,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  countryCodeText: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  options: {
    flexDirection: 'column',
    gap: 15,
    marginTop: 20,
  },
  option: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  activeOption: {
    backgroundColor: '#FDF5F5',
    borderColor: '#3F1F22',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  activeOptionText: {
    color: '#3F1F22',
  },
  optionDescription: {
    fontSize: 14,
    color: '#999',
  },
  button: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  countryCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCountryCode: {
    backgroundColor: '#FDF5F5',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  countryCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
 


});