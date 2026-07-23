import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Onboarding() {
  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* White gradient overlay */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.7)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      
      <View style={styles.container}>
        {/* Main content area */}
        <View style={styles.content}>
          <Text style={styles.title}>Disciple Training School</Text>
          <Text style={styles.subtitle}>Faith Community App</Text>
        </View>
        
        {/* Buttons container at the bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.btnStyle}>
            <Link href="/(auth)/start" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.buttonTwo}>
                <Text style={styles.buttonTextTwo}>Log In</Text>
              </TouchableOpacity>
            </Link>
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
    height: '50%',
  },
  container: { 
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: "black",
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: { 
    fontSize: 16, 
    color: 'black', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  btnStyle: {
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonTwo: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextTwo: {
    color: '#3F1F22',
    fontSize: 16,
    fontWeight: '600',
  }
});