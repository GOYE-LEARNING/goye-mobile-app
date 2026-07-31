import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <View style={styles.container}>
      
      <Text style={styles.header}>Welcome to DTS App</Text>

     
      <View style={styles.spacer} />

      
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Welcome to your new experience.</Text>
        <Text style={styles.subtitle}>Grow deeper, walk stronger.</Text>
      </View>

      {/* Separator line */}
      <View style={styles.divider} />

     
      <View style={styles.flexSpacer} />

      
      <Image
        source={require('@/assets/images/Frame.png')}
        style={styles.illustration}
        contentFit="contain"
      />

      {/* Continue button at bottom */}
      <TouchableOpacity 
        style={styles.continueButton} 
        onPress={() => router.push('/(auth)/tell-us-more')}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 40,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  spacer: {
    height: 150,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: { 
    fontSize: 17, 
    color: '#757272', 
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#d0d0d0',
    alignSelf: 'center',
    marginTop: 50,
  },
  flexSpacer: {
    flex: 0.7,
  },
  illustration: {
    width: '90%',
    height: 180,
    marginBottom: 60,
    alignSelf: 'center'
  },
  continueButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});