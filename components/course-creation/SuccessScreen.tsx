// components/course-creation/SuccessScreen.tsx
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, lightColors } from '@/contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface Props {
  courseName: string;
  onDone: () => void;
}

export default function SuccessScreen({ courseName, onDone }: Props) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.wrapper}>
      <View style={s.modalContainer}>
        <View style={s.content}>
          <View style={s.imageContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={200} 
              color="#25a230ff" 
              style={s.checkmarkBackground}
            />
            <Image
              source={require('@/assets/images/Success.png')}
              style={s.illustration}
              contentFit="contain"
            />
          </View>
          
          <Text style={s.title}>Awesome</Text>
          <Text style={s.subtitle}>
            Your course "{courseName || 'New Course'}" has been created successfully
          </Text>
        </View>

        <TouchableOpacity style={s.doneButton} onPress={onDone}>
          <Text style={s.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: c.background,
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
      color: c.text,
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
      marginBottom: 15,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    doneButton: {
      backgroundColor: c.brand,
      paddingVertical: 18,
      alignItems: 'center',
      width: '100%',
      borderRadius: 10,
    },
    doneButtonText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '600',
    },
  });
}