import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Modal,
  ImageBackground,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import * as DocumentPicker from 'expo-document-picker';

// School types for dropdown
const SCHOOL_TYPES = [
  'Preschool/Kindergarten',
  'Primary/Elementary School',
  'Middle School/Junior High',
  'High School/Secondary School',
  'College/University',
  'Technical/Vocational School',
  'Special Education School',
  'Language School',
  'International School',
  'Boarding School',
  'Montessori School',
  'Charter School',
  'Private School',
  'Public School',
  'Online/Virtual School',
];

const ADMIN_ROLES = [
  'Principal',
  'Headmaster/Headmistress',
  'Dean',
  'Director',
  'Administrator',
  'Head of School',
  'President',
  'Superintendent',
  'Registrar',
  'Bursar',
  'Chairperson',
  'Board Member',
  'School Manager',
  'Deputy Principal',
  'Academic Coordinator',
];

export default function SchoolForm() {
  const router = useRouter();
  const { organizationData, updateOrganizationData } = useOrganization();
  
  const [formData, setFormData] = useState({
    schoolName: organizationData.schoolName || '',
    schoolType: organizationData.schoolType || '',
    schoolAddress: organizationData.schoolAddress || '',
    adminName: organizationData.adminName || '',
    adminRole: organizationData.adminRole || '',
    school_email: organizationData.school_email || '',
    schoolWebsite: organizationData.schoolWebsite || '',
    accreditationNumber: organizationData.accreditationNumber || '',
    schoolDocument: organizationData.schoolDocument || null,
  });

  const [showSchoolTypeModal, setShowSchoolTypeModal] = useState(false);
  const [showAdminRoleModal, setShowAdminRoleModal] = useState(false);
  const [searchSchoolType, setSearchSchoolType] = useState('');
  const [searchAdminRole, setSearchAdminRole] = useState('');
  const [documentName, setDocumentName] = useState('');

  // Filter school types based on search
  const filteredSchoolTypes = SCHOOL_TYPES.filter(type =>
    type.toLowerCase().includes(searchSchoolType.toLowerCase())
  );

  // Filter admin roles based on search
  const filteredAdminRoles = ADMIN_ROLES.filter(role =>
    role.toLowerCase().includes(searchAdminRole.toLowerCase())
  );

  const handleSelectSchoolType = (type: string) => {
    setFormData({ ...formData, schoolType: type });
    setShowSchoolTypeModal(false);
    setSearchSchoolType('');
  };

  const handleSelectAdminRole = (role: string) => {
    setFormData({ ...formData, adminRole: role });
    setShowAdminRoleModal(false);
    setSearchAdminRole('');
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets[0]) {
        const doc = result.assets[0];
        setFormData({ ...formData, schoolDocument: doc.uri });
        setDocumentName(doc.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeDocument = () => {
    setFormData({ ...formData, schoolDocument: null });
    setDocumentName('');
  };

  const isFormValid = () => {
    return formData.schoolName.trim() !== '' && 
           formData.schoolType.trim() !== '' && 
           formData.schoolAddress.trim() !== '' && 
           formData.adminName.trim() !== '' && 
           formData.adminRole.trim() !== '';
  };

  const handleContinue = () => {
    if (!isFormValid()) return;
    updateOrganizationData(formData);
    router.push('/(auth)/preview-verification');
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 245, 245, 0.9)']}
        style={styles.gradient}
      />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#3F1F22" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>School Information</Text>
            <Text style={styles.headerSubtitle}>Complete your school profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>School Details</Text>
            <Text style={styles.sectionSubtitle}>
              Fill in your school's information for verification
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* School Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>School Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.schoolName}
                onChangeText={(text) => setFormData({ ...formData, schoolName: text })}
                placeholder="Enter school name"
                placeholderTextColor="#999"
              />
            </View>

            {/* School Type Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>School Type</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSchoolTypeModal(true)}
              >
                <Text style={formData.schoolType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.schoolType || 'Select School Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* School Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Physical Address</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.schoolAddress}
                onChangeText={(text) => setFormData({ ...formData, schoolAddress: text })}
                placeholder="Enter complete school address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Administrator Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Administrator Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.adminName}
                onChangeText={(text) => setFormData({ ...formData, adminName: text })}
                placeholder="Principal/Administrator name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Administrator Role Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Administrator Role</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowAdminRoleModal(true)}
              >
                <Text style={formData.adminRole ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.adminRole || 'Select Administrator Role'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Email Domain */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Official Email Domain</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <View style={styles.domainContainer}>
                <View style={styles.domainPrefix}>
                  <Text style={styles.domainPrefixText}>staff@</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.domainInput]}
                  value={formData.school_email}
                  onChangeText={(text) => setFormData({ ...formData, school_email: text })}
                  placeholder="school.edu"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.helperText}>
                Used for official school email addresses
              </Text>
            </View>

            {/* School Website */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>School Website</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.schoolWebsite}
                onChangeText={(text) => setFormData({ ...formData, schoolWebsite: text })}
                placeholder="https://yourschool.edu"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            {/* Accreditation Number */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Accreditation Number</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.accreditationNumber}
                onChangeText={(text) => setFormData({ ...formData, accreditationNumber: text })}
                placeholder="Enter accreditation/license number"
                placeholderTextColor="#999"
              />
            </View>

            {/* Document Upload */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Official Document</Text>
                <Text style={styles.required}>*</Text>
              </View>
              
              {formData.schoolDocument ? (
                <View style={styles.documentPreviewContainer}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentIconContainer}>
                      <Ionicons name="document-text" size={32} color="#3F1F22" />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {documentName || 'School Document'}
                      </Text>
                      <Text style={styles.documentStatus}>
                        <Ionicons name="checkmark-circle" size={12} color="#4CAF50" /> Uploaded
                      </Text>
                    </View>
                  </View>
                  <View style={styles.documentActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.changeButton]}
                      onPress={pickDocument}
                    >
                      <Ionicons name="refresh" size={16} color="#3F1F22" />
                      <Text style={styles.changeButtonText}>Change Document</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={removeDocument}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.documentUploadButton}
                  onPress={pickDocument}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="document-attach-outline" size={32} color="#3F1F22" />
                  </View>
                  <Text style={styles.uploadText}>Upload Official Document</Text>
                  <Text style={styles.uploadSubtext}>
                    Accreditation, license, or registration certificate
                  </Text>
                  <Text style={styles.uploadHint}>
                    PDF, DOC, DOCX, or Image (Max 10MB)
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helperText}>
                Upload a scanned copy of your school's official document
              </Text>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!isFormValid() || !formData.schoolDocument) && styles.continueButtonDisabled
              ]}
              disabled={!isFormValid() || !formData.schoolDocument}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Preview & Submit</Text>
              <Ionicons name="eye-outline" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              Your information will be reviewed for verification within 24-48 hours.
            </Text>
          </View>
        </ScrollView>

        {/* School Type Selection Modal */}
        <Modal
          visible={showSchoolTypeModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select School Type</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowSchoolTypeModal(false);
                    setSearchSchoolType('');
                  }}
                >
                  <Ionicons name="close" size={24} color="#3F1F22" />
                </TouchableOpacity>
              </View>
              
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search school types..."
                  value={searchSchoolType}
                  onChangeText={setSearchSchoolType}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredSchoolTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalItem,
                      formData.schoolType === type && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectSchoolType(type)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="school-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.schoolType === type && styles.modalItemTextSelected
                      ]}>
                        {type}
                      </Text>
                    </View>
                    {formData.schoolType === type && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Administrator Role Selection Modal */}
        <Modal
          visible={showAdminRoleModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Administrator Role</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowAdminRoleModal(false);
                    setSearchAdminRole('');
                  }}
                >
                  <Ionicons name="close" size={24} color="#3F1F22" />
                </TouchableOpacity>
              </View>
              
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search roles..."
                  value={searchAdminRole}
                  onChangeText={setSearchAdminRole}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredAdminRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.modalItem,
                      formData.adminRole === role && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectAdminRole(role)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="person-circle-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.adminRole === role && styles.modalItemTextSelected
                      ]}>
                        {role}
                      </Text>
                    </View>
                    {formData.adminRole === role && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F1F22',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
    marginRight: 4,
  },
  required: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  optional: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  domainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainPrefix: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  domainPrefixText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  domainInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dropdownButton: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  documentPreviewContainer: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  changeButton: {
    backgroundColor: 'white',
    borderColor: '#3F1F22',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
  },
  removeButton: {
    backgroundColor: 'white',
    borderColor: '#FF3B30',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  documentUploadButton: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F1F22',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSection: {
    marginTop: 10,
  },
  continueButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#3F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#D4D4D4',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    opacity: 0.9,
  },
  footerNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3F1F22',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemIcon: {
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#3F1F22',
    fontWeight: '500',
  },
});