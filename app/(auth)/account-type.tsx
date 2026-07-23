// File: app/(auth)/account-type.tsx

import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AccountType() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  const handleContinue = () => {
    if (selectedType === 'organization') {
      router.push('/(auth)/organization-type');
    } else {
      router.push('/(auth)/get-started');
    }
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255, 245, 245, 0.95)', 'rgba(255, 255, 255, 0.85)', 'transparent']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Goye</Text>
          </View>
          
          <Text style={styles.title}>Join Our Community</Text>
          <Text style={styles.subtitle}>How would you like to join us?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Individual Option - Moved first */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'individual' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedType('individual')}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.iconCircle,
                selectedType === 'individual' && styles.iconCircleSelected
              ]}>
                <Ionicons 
                  name="person-circle" 
                  size={40} 
                  color={selectedType === 'individual' ? '#FFFFFF' : '#3F1F22'} 
                />
              </View>
              <Text style={styles.optionTitle}>Individual</Text>
              <Text style={styles.optionDescription}>
                Personal account for believers
              </Text>
              
              {selectedType === 'individual' && (
                <View style={styles.selectionIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#3F1F22" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Organization Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'organization' && styles.optionCardSelected
            ]}
            onPress={() => setSelectedType('organization')}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.iconCircle,
                selectedType === 'organization' && styles.iconCircleSelected
              ]}>
                <Ionicons 
                  name="business" 
                  size={40} 
                  color={selectedType === 'organization' ? '#FFFFFF' : '#3F1F22'} 
                />
              </View>
              <Text style={styles.optionTitle}>Organization</Text>
              <Text style={styles.optionDescription}>
                For churches, schools & communities
              </Text>
              
              {selectedType === 'organization' && (
                <View style={styles.selectionIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#3F1F22" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.hintText}>
            You can always change this later in settings
          </Text>
          
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedType && styles.continueButtonDisabled
            ]}
            disabled={!selectedType}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F1F22',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F1F22',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System', // Consider using a custom font
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 140,
  },
  optionCardSelected: {
    borderColor: '#3F1F22',
    backgroundColor: '#FFF5F5',
    shadowColor: '#3F1F22',
    shadowOpacity: 0.1,
    transform: [{ scale: 1.02 }],
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconCircleSelected: {
    backgroundColor: '#3F1F22',
    borderColor: '#3F1F22',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3F1F22',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '90%',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomSection: {
    paddingTop: 20,
  },
  hintText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#3F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#D4D4D4',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    opacity: 0.9,
  },
});