// app/(tabs)/courses/[id]/add-material.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { API_CONFIG } from '@/constants/config';
import { useUser } from '@/contexts/UserContext';
import { getCourse } from '@/services/api';

export default function AddMaterial() {
  const params = useLocalSearchParams();
  const { id: courseId } = params;
  const { token } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pages, setPages] = useState('');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setDocumentUri(result.assets[0].uri);
        setDocumentName(result.assets[0].name);
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadMaterialDocument = async (materialId: string) => {
    const fileName = documentName || documentUri!.split('/').pop() || `material-${Date.now()}.pdf`;
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'doc'
      ? 'application/msword'
      : extension === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    const formData = new FormData();
    formData.append('file', {
      uri: documentUri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await fetch(`${API_CONFIG.BASE_URL}/course/upload-course-material/${courseId}/${materialId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: Failed to upload document`);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Material title is required');
      return;
    }

    setSaving(true);
    try {
      // update-course deletes any material not present in the payload, so we
      // must include the course's existing materials alongside the new one.
      const courseResult = await getCourse(courseId as string, token!);
      const existingMaterials = (courseResult.data?.material || []).map((m: any) => ({
        id: m.id,
        material_title: m.material_title,
        material_description: m.material_description,
        material_pages: m.material_pages,
        material_document: m.material_document,
      }));

      const response = await fetch(`${API_CONFIG.BASE_URL}/course/update-course/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materials: [
            ...existingMaterials,
            {
              material_title: title,
              material_description: description,
              material_pages: pages ? parseInt(pages, 10) : 0,
              material_document: '',
            },
          ],
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: Failed to add material`);
      }

      if (documentUri) {
        const existingIds = new Set(existingMaterials.map((m: any) => m.id));
        const createdMaterial = (result.data?.material || []).find((m: any) => !existingIds.has(m.id));
        if (createdMaterial) {
          await uploadMaterialDocument(createdMaterial.id);
        }
      }

      Alert.alert('Success', 'Material added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error adding material:', error);
      Alert.alert('Error', error.message || 'Failed to add material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Material</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#3F1F22" /> : <Text style={styles.saveButton}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Material Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Discipleship Foundation Guide"
            value={title}
            onChangeText={setTitle}
            editable={!saving}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Comprehensive guide covering the basics of Christian discipleship."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Number of Pages</Text>
          <TextInput
            style={styles.input}
            placeholder="12"
            value={pages}
            onChangeText={setPages}
            keyboardType="numeric"
            editable={!saving}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Document</Text>
          {documentUri ? (
            <View style={styles.documentPreview}>
              <Ionicons name="document-text" size={32} color="#3F1F22" />
              <View style={styles.documentDetails}>
                <Text style={styles.documentName} numberOfLines={1}>{documentName}</Text>
              </View>
              <TouchableOpacity onPress={() => { setDocumentUri(null); setDocumentName(null); }} disabled={saving}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={pickDocument} disabled={saving}>
              <Ionicons name="cloud-upload-outline" size={28} color="#999" />
              <Text style={styles.uploadText}>Upload document (Optional)</Text>
              <Text style={styles.uploadSubtext}>Supports PDF, DOC, DOCX</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  saveButton: { fontSize: 16, fontWeight: '600', color: '#3F1F22' },
  content: { flex: 1, padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: '#666', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: 'white',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadText: { fontSize: 14, fontWeight: '500', color: '#333', marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: '#999', marginTop: 4 },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  documentDetails: { flex: 1 },
  documentName: { fontSize: 14, fontWeight: '500', color: '#333' },
});
