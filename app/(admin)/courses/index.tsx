import { View, Text, StyleSheet } from 'react-native';

export default function AdminCourses() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Courses - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});