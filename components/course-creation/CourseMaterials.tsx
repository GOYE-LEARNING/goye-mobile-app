// components/course-creation/CourseMaterials.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface Material {
  id: string;
  title: string;
  description: string;
  pages: string;
  document: string | null;
  expanded: boolean;
}

interface Props {
  data: any;
  onChange: (data: any) => void;
}

export default function CourseMaterials({ data, onChange }: Props) {
  const { colors } = useTheme();
  const [materials, setMaterials] = useState<Material[]>(data.materials || []);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      title: '',
      description: '',
      pages: '',
      document: null,
      expanded: true,
    };
    const updated = [...materials, newMaterial];
    setMaterials(updated);
    setExpandedMaterial(newMaterial.id);
    onChange({ materials: updated });
  };

  const updateMaterial = (materialId: string, field: string, value: string) => {
    const updated = materials.map(m => 
      m.id === materialId ? { ...m, [field]: value } : m
    );
    setMaterials(updated);
    onChange({ materials: updated });
  };

  const deleteMaterial = (materialId: string) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = materials.filter(m => m.id !== materialId);
            setMaterials(updated);
            onChange({ materials: updated });
          },
        },
      ]
    );
  };

  const pickDocument = async (materialId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        updateMaterial(materialId, 'document', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking document:', error);
    }
  };

  const toggleMaterial = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.sectionTitle}>Course Materials</Text>
        <TouchableOpacity style={s.addButton} onPress={addMaterial}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
          <Text style={[s.addButtonText, { color: colors.brand }]}>Add Material</Text>
        </TouchableOpacity>
      </View>

      {materials.map((material, materialIndex) => (
        <View key={material.id} style={[s.materialCard, { backgroundColor: colors.backgroundSoft }]}>
          {/* Material Header */}
          <View style={s.materialHeader}>
            <View style={[s.materialNumber, { backgroundColor: colors.success }]}>
              <Text style={s.materialNumberText}>{materialIndex + 1}</Text>
            </View>
            <TouchableOpacity 
              style={s.materialHeaderContent}
              onPress={() => toggleMaterial(material.id)}
            >
              <Text style={[s.materialLabel, { color: colors.text }]}>Material</Text>
              <Ionicons 
                name={expandedMaterial === material.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.deleteButton}
              onPress={() => deleteMaterial(material.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Expanded Material Content */}
          {expandedMaterial === material.id && (
            <>
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Material Title</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Discipleship Foundation Guide"
                  placeholderTextColor={colors.textMuted}
                  value={material.title}
                  onChangeText={(text) => updateMaterial(material.id, 'title', text)}
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[s.input, s.textArea, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Comprehensive guide covering the basics of Christian discipleship and spiritual growth"
                  placeholderTextColor={colors.textMuted}
                  value={material.description}
                  onChangeText={(text) => updateMaterial(material.id, 'description', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Number of Pages</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.borderMid, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="12"
                  placeholderTextColor={colors.textMuted}
                  value={material.pages}
                  onChangeText={(text) => updateMaterial(material.id, 'pages', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.field}>
                <Text style={[s.label, { color: colors.textSecondary }]}>Material Document</Text>
                {material.document ? (
                  <View style={[s.documentPreview, { backgroundColor: colors.background, borderColor: colors.borderMid }]}>
                    <View style={s.documentInfo}>
                      <Ionicons name="document-text" size={32} color={colors.brand} />
                      <View style={s.documentDetails}>
                        <Text style={[s.documentName, { color: colors.text }]}>Document attached</Text>
                        <Text style={[s.documentSize, { color: colors.textSecondary }]}>PDF or DOC</Text>
                      </View>
                    </View>
                    <View style={s.documentActions}>
                      <TouchableOpacity 
                        style={[s.documentActionButton, { borderColor: '#EF4444' }]}
                        onPress={() => updateMaterial(material.id, 'document', '')}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={[s.documentActionText, { color: '#EF4444' }]}>Remove</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.documentActionButton, s.replaceButton, { borderColor: colors.brand }]}
                        onPress={() => pickDocument(material.id)}
                      >
                        <Ionicons name="reload-outline" size={16} color={colors.brand} />
                        <Text style={[s.documentActionText, s.replaceText, { color: colors.brand }]}>Replace</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[s.uploadBox, { borderColor: colors.borderMid, backgroundColor: colors.backgroundSoft }]}
                    onPress={() => pickDocument(material.id)}
                  >
                    <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
                    <Text style={[s.uploadText, { color: colors.text }]}>Upload document</Text>
                    <Text style={[s.uploadSubtext, { color: colors.textMuted }]}>Supports PDF or DOC</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      ))}

      {materials.length === 0 && (
        <View style={s.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No materials yet</Text>
          <Text style={[s.emptySubtext, { color: colors.textMuted }]}>Click "Add Material" to get started</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      paddingVertical: 20,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    materialCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    materialHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    materialNumber: {
      width: 32,
      height: 32,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    materialNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    materialHeaderContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    materialLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
    deleteButton: {
      padding: 4,
      marginLeft: 8,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      padding: 12,
      fontSize: 15,
      borderRadius: 8,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    uploadBox: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 40,
      alignItems: 'center',
    },
    uploadText: {
      fontSize: 15,
      fontWeight: '500',
      marginTop: 12,
    },
    uploadSubtext: {
      fontSize: 13,
      marginTop: 4,
    },
    documentPreview: {
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
    },
    documentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    documentDetails: {
      flex: 1,
      marginLeft: 12,
    },
    documentName: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    documentSize: {
      fontSize: 13,
    },
    documentActions: {
      flexDirection: 'row',
      gap: 12,
    },
    documentActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 6,
      borderWidth: 1,
    },
    documentActionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    replaceButton: {
      borderWidth: 1,
    },
    replaceText: {
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 4,
    },
  });
}