// components/course-creation/SuccessScreen.tsx
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface Props {
  courseName: string;
  onDone: () => void;
}

export default function SuccessScreen({ courseName, onDone }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={200} 
              color="#25a230ff" 
              style={styles.checkmarkBackground}
            />
            <Image
              source={require('@/assets/images/Success.png')}
              style={styles.illustration}
              contentFit="contain"
            />
          </View>
          
          <Text style={styles.title}>Awesome</Text>
          <Text style={styles.subtitle}>
            Your course "{courseName || 'New Course'}" has been created successfully
          </Text>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: height * 0.8, 
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  checkmarkBackground: {
    position: 'absolute',
  },
  illustration: {
    width: 300,
    height: 200,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 15, 
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  doneButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});