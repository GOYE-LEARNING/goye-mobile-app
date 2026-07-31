// app/(tabs)/organization/events.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createOrgEvent, getOrgEvents, updateOrgEvent, deleteOrgEvent } from '@/services/api';

export default function OrganizationEvents() {
  const { user, token } = useUser();
  const { colors } = useTheme();
  const organizationId = user?.organizationId;

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [type, setType] = useState('general');

  const s = makeStyles(colors);

  useEffect(() => {
    fetchEvents();
  }, [organizationId]);

  const fetchEvents = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getOrgEvents(organizationId, token!);
      setEvents(result.data || []);
    } catch (err) {
      console.error('[OrganizationEvents] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setDate(new Date());
    setTime('');
    setLocation('');
    setCapacity('');
    setType('general');
    setEditingEvent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setName(event.name);
    setDescription(event.description || '');
    setDate(new Date(event.date));
    setTime(event.time || '');
    setLocation(event.location || '');
    setCapacity(event.capacity ? String(event.capacity) : '');
    setType(event.type || 'general');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !time.trim()) {
      Alert.alert('Validation Error', 'Event name and time are required');
      return;
    }
    if (!organizationId) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        date: date.toISOString(),
        time: time.trim(),
        location: location.trim(),
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        type,
      };

      if (editingEvent) {
        await updateOrgEvent(organizationId, editingEvent.id, payload, token!);
      } else {
        await createOrgEvent(organizationId, payload, token!);
      }

      setModalVisible(false);
      resetForm();
      fetchEvents();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (event: any) => {
    Alert.alert('Delete Event', `Delete "${event.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!organizationId) return;
          try {
            await deleteOrgEvent(organizationId, event.id, token!);
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const renderEvent = ({ item }: { item: any }) => (
    <View style={s.eventCard}>
      <View style={s.eventDateBox}>
        <Text style={s.eventDateDay}>{new Date(item.date).getDate()}</Text>
        <Text style={s.eventDateMonth}>
          {new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}
        </Text>
      </View>
      <View style={s.eventInfo}>
        <Text style={s.eventName}>{item.name}</Text>
        <Text style={s.eventMeta}>{item.time} {item.location ? `• ${item.location}` : ''}</Text>
        {item.description ? <Text style={s.eventDescription} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.eventFooter}>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>{item.status}</Text>
          </View>
          <Text style={s.attendeesText}>{item.attendees ?? 0}/{item.capacity} attending</Text>
        </View>
      </View>
      <View style={s.eventActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={s.iconButton}>
          <Ionicons name="pencil" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={s.iconButton}>
          <Ionicons name="trash-outline" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Events</Text>
        <TouchableOpacity onPress={openCreateModal}>
          <Ionicons name="add" size={26} color={colors.brand} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={s.loading} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={<Text style={s.emptyText}>No events yet</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={s.label}>Event Name *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Sunday Bible Study" placeholderTextColor={colors.textMuted} />

              <Text style={s.label}>Description</Text>
              <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Event details" placeholderTextColor={colors.textMuted} />

              <Text style={s.label}>Date</Text>
              <TouchableOpacity style={s.input} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: colors.text }}>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setDate(selected);
                  }}
                />
              )}

              <Text style={s.label}>Time *</Text>
              <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="e.g. 10:00 AM" placeholderTextColor={colors.textMuted} />

              <Text style={s.label}>Location</Text>
              <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="Main Hall" placeholderTextColor={colors.textMuted} />

              <Text style={s.label}>Capacity</Text>
              <TextInput style={s.input} value={capacity} onChangeText={setCapacity} keyboardType="numeric" placeholder="100" placeholderTextColor={colors.textMuted} />

              <TouchableOpacity style={s.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>{editingEvent ? 'Update Event' : 'Create Event'}</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    loading: { marginTop: 40 },
    listContent: { padding: 20 },
    emptyText: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
    eventCard: {
      flexDirection: 'row', backgroundColor: c.backgroundMuted, borderRadius: 12, padding: 14, marginBottom: 12, gap: 12,
    },
    eventDateBox: {
      width: 48, height: 48, borderRadius: 10, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center',
    },
    eventDateDay: { fontSize: 18, fontWeight: '700', color: c.text },
    eventDateMonth: { fontSize: 11, color: c.textMuted, textTransform: 'uppercase' },
    eventInfo: { flex: 1 },
    eventName: { fontSize: 15, fontWeight: '600', color: c.text },
    eventMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    eventDescription: { fontSize: 12, color: c.textMuted, marginTop: 4 },
    eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    statusBadge: { backgroundColor: c.brandLighter, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '600', color: c.brand, textTransform: 'capitalize' },
    attendeesText: { fontSize: 11, color: c.textMuted },
    eventActions: { justifyContent: 'space-between' },
    iconButton: { padding: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: c.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    label: { fontSize: 13, fontWeight: '500', color: c.textSecondary, marginBottom: 6, marginTop: 12 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 12, fontSize: 15, color: c.text },
    textArea: { height: 80, textAlignVertical: 'top' },
    saveButton: { backgroundColor: c.brand, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  });
}
