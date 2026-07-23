import { View, Text, StyleSheet } from 'react-native';

export default function AdminProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Profile - Coming Soon</Text>
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