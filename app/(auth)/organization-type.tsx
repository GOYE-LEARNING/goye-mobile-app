// File: app/(auth)/organization-type.tsx

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function OrganizationType() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);

  const organizationTypes = [
    { 
      id: 'church', 
      label: 'Church', 
      icon: 'church', 
      description: 'Religious congregation or parish',
      color: '#3F1F22'
    },
    { 
      id: 'school', 
      label: 'School', 
      icon: 'school', 
      description: 'Educational institution',
      color: '#3F1F22'
    },
    { 
      id: 'club', 
      label: 'Community Club', 
      icon: 'people-circle', 
      description: 'Group or community organization',
      color: '#3F1F22'
    },
  ];

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: '/(auth)/organization-form',
        params: { orgType: selectedType }
      });
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
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#3F1F22" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Organization Type</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 3</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>What type of organization?</Text>
            <Text style={styles.subtitle}>
              Select the category that best fits your organization
            </Text>
          </View>

          <ScrollView 
            style={styles.typesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.typesListContent}
          >
            {organizationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <View style={styles.typeCardContent}>
                  <View style={[
                    styles.typeIconContainer,
                    selectedType === type.id && { backgroundColor: type.color }
                  ]}>
                    <Ionicons 
                      name={type.icon} 
                      size={32} 
                      color={selectedType === type.id ? '#FFFFFF' : '#3F1F22'} 
                    />
                  </View>
                  
                  <View style={styles.typeTextContainer}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                  
                  <View style={[
                    styles.radioOuter,
                    selectedType === type.id && styles.radioOuterSelected
                  ]}>
                    {selectedType === type.id && (
                      <View style={[styles.radioInner, { backgroundColor: type.color }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.bottomSection}>
            <Text style={styles.hintText}>
              Don't see your type? Select the closest match
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F1F22',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 22,
  },
  typesList: {
    flex: 1,
  },
  typesListContent: {
    paddingBottom: 20,
  },
  typeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  typeCardSelected: {
    borderColor: '#3F1F22',
    backgroundColor: '#FFF5F5',
    shadowColor: '#3F1F22',
    shadowOpacity: 0.1,
    transform: [{ scale: 1.01 }],
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  typeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3F1F22',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3F1F22',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomSection: {
    paddingTop: 20,
    paddingBottom: 40,
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