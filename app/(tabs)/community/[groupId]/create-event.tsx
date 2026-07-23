// app/(tabs)/community/[groupId]/create-event.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '@/contexts/UserContext';
import { createEvent } from '@/services/api';

const EVENT_TYPES = ['Meeting', 'Session', 'Fellowship', 'Service'];

export default function CreateEvent() {
  const params = useLocalSearchParams();
  const { user, isInstructor,  token } = useUser();
  
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Meeting');
  const [eventLink, setEventLink] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 90 * 60000)); // 1.5 hours later
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showEventTypeMenu, setShowEventTypeMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  // Protect this route
  if (!isInstructor) {
    router.back();
    return null;
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleCreate = async () => {
  if (!eventName.trim()) {
    Alert.alert('Error', 'Please enter an event name');
    return;
  }

  if (!description.trim()) {
    Alert.alert('Error', 'Please enter a description');
    return;
  }

   try {
    setLoading(true);
    
    // Debug: Check what eventType value is
    console.log('🔍 Current eventType:', eventType);
    console.log('🔍 Event types available:', EVENT_TYPES);
    
    const formatTimeForAPI = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }).replace(' ', ' ');
    };

    const eventData = {
      event_name: eventName,
      event_description: description,
      event_time: `${formatTimeForAPI(startTime)} - ${formatTimeForAPI(endTime)}`,
      event_date: date.toISOString().split('T')[0],
      event_type: eventType, // Make sure this is correct
      event_link: eventLink || '',
    };

    console.log('📤 Sending event data:', JSON.stringify(eventData, null, 2));

    const result = await createEvent(params.groupId as string, eventData, token);
    
    console.log('✅ Event created! Response:', result);
    Alert.alert('Success', result.message || 'Event created successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  } catch (error: any) {
    console.error('❌ Error creating event:', error);
    Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
  } finally {
    setLoading(false);
  }
};
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Weekly Bible Study"
            value={eventName}
            onChangeText={setEventName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Deep dive into James Chapter 2: Faith in Action. Come prepared with your Bible and notebook!"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Time */}
        <View style={styles.field}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity 
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.inputText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>-</Text>
            <TouchableOpacity 
              style={[styles.input, styles.timeInput]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.inputText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>

        {/* Event Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Event Type</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowEventTypeMenu(!showEventTypeMenu)}
          >
            <Text style={styles.inputText}>{eventType}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {showEventTypeMenu && (
            <View style={styles.dropdownMenu}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setEventType(type);
                    setShowEventTypeMenu(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    type === eventType && styles.dropdownItemTextActive
                  ]}>
                    {type}
                  </Text>
                  {type === eventType && (
                    <Ionicons name="checkmark" size={20} color="#3F1F22" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Event Link */}
        <View style={styles.field}>
          <Text style={styles.label}>Event Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://meet.google.com/wto-dtbv-xyt"
            value={eventLink}
            onChangeText={setEventLink}
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
  style={[styles.createButton, loading && styles.createButtonDisabled]} 
  onPress={handleCreate}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="white" />
  ) : (
    <Text style={styles.createButtonText}>Create Event</Text>
  )}
</TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(Platform.OS === 'ios');
            if (selectedTime) setStartTime(selectedTime);
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(Platform.OS === 'ios');
            if (selectedTime) setEndTime(selectedTime);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  inputText: {
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#3F1F22',
  },
  footer: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
   createButtonDisabled: { // ADD THIS STYLE
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
});