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

// Club types for dropdown
const CLUB_TYPES = [
  'Youth Group',
  'Bible Study',
  'Prayer Group',
  'Men\'s Ministry',
  'Women\'s Ministry',
  'Children\'s Ministry',
  'Worship Team',
  'Sports Team',
  'Community Service',
  'Fellowship Group',
  'Discipleship Group',
  'Evangelism Team',
  'Support Group',
  'Interest Group',
  'Hobby Club',
];

const LEADER_ROLES = [
  'President',
  'Coordinator',
  'Facilitator',
  'Leader',
  'Chairperson',
  'Director',
  'Captain',
  'Organizer',
  'Head',
  'Manager',
  'Supervisor',
  'Mentor',
  'Advisor',
  'Counselor',
  'Guide',
];

const MEETING_FREQUENCIES = [
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Twice a month',
  'Every Sunday',
  'Every Wednesday',
  'Weekends only',
  'Seasonal',
  'Quarterly',
  'As needed',
  'On demand',
  'Irregular schedule',
];

export default function ClubForm() {
  const router = useRouter();
  const { organizationData, updateOrganizationData } = useOrganization();
  
  const [formData, setFormData] = useState({
    clubName: organizationData.clubName || '',
    clubType: organizationData.clubType || '',
    leaderName: organizationData.leaderName || '',
    leaderRole: organizationData.leaderRole || '',
    meetingFrequency: organizationData.meetingFrequency || '',
    parentOrganization: organizationData.parentOrganization || '',
    socialLink: organizationData.socialLink || '',
    clubDescription: organizationData.clubDescription || '',
    clubDocument: organizationData.clubDocument || null,
  });

  const [showClubTypeModal, setShowClubTypeModal] = useState(false);
  const [showLeaderRoleModal, setShowLeaderRoleModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [searchClubType, setSearchClubType] = useState('');
  const [searchLeaderRole, setSearchLeaderRole] = useState('');
  const [searchFrequency, setSearchFrequency] = useState('');
  const [documentName, setDocumentName] = useState('');

  // Filter club types based on search
  const filteredClubTypes = CLUB_TYPES.filter(type =>
    type.toLowerCase().includes(searchClubType.toLowerCase())
  );

  // Filter leader roles based on search
  const filteredLeaderRoles = LEADER_ROLES.filter(role =>
    role.toLowerCase().includes(searchLeaderRole.toLowerCase())
  );

  // Filter frequencies based on search
  const filteredFrequencies = MEETING_FREQUENCIES.filter(freq =>
    freq.toLowerCase().includes(searchFrequency.toLowerCase())
  );

  const handleSelectClubType = (type: string) => {
    setFormData({ ...formData, clubType: type });
    setShowClubTypeModal(false);
    setSearchClubType('');
  };

  const handleSelectLeaderRole = (role: string) => {
    setFormData({ ...formData, leaderRole: role });
    setShowLeaderRoleModal(false);
    setSearchLeaderRole('');
  };

  const handleSelectFrequency = (frequency: string) => {
    setFormData({ ...formData, meetingFrequency: frequency });
    setShowFrequencyModal(false);
    setSearchFrequency('');
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets[0]) {
        const doc = result.assets[0];
        setFormData({ ...formData, clubDocument: doc.uri });
        setDocumentName(doc.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeDocument = () => {
    setFormData({ ...formData, clubDocument: null });
    setDocumentName('');
  };

  const isFormValid = () => {
    return formData.clubName.trim() !== '' && 
           formData.clubType.trim() !== '' && 
           formData.leaderName.trim() !== '' && 
           formData.leaderRole.trim() !== '';
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
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(245, 255, 245, 0.9)']}
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
            <Text style={styles.headerTitle}>Club Information</Text>
            <Text style={styles.headerSubtitle}>Complete your club profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>Club Details</Text>
            <Text style={styles.sectionSubtitle}>
              Fill in your club information for verification
            </Text>
          </View>

          {/* Club Badge */}
          <View style={styles.clubBadge}>
            <Ionicons name="people" size={20} color="#3F1F22" />
            <Text style={styles.clubBadgeText}>Community Club</Text>
          </View>

          <View style={styles.formSection}>
            {/* Club Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Club Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.clubName}
                onChangeText={(text) => setFormData({ ...formData, clubName: text })}
                placeholder="Enter club name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Club Type Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Club Type</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowClubTypeModal(true)}
              >
                <Text style={formData.clubType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.clubType || 'Select Club Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Leader Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Leader Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.leaderName}
                onChangeText={(text) => setFormData({ ...formData, leaderName: text })}
                placeholder="Club leader's full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Leader Role Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Leader Role</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowLeaderRoleModal(true)}
              >
                <Text style={formData.leaderRole ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.leaderRole || 'Select Leader Role'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Meeting Frequency Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Meeting Frequency</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  !formData.meetingFrequency && styles.frequencyDropdown
                ]}
                onPress={() => setShowFrequencyModal(true)}
              >
                <Text style={formData.meetingFrequency ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.meetingFrequency || 'Select Meeting Frequency'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Parent Organization */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Parent Organization</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.parentOrganization}
                onChangeText={(text) => setFormData({ ...formData, parentOrganization: text })}
                placeholder="If affiliated with a larger organization"
                placeholderTextColor="#999"
              />
            </View>

            {/* Social/Messaging Link */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Social/Messaging Link</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.socialLink}
                onChangeText={(text) => setFormData({ ...formData, socialLink: text })}
                placeholder="WhatsApp, Telegram, Discord, etc."
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            {/* Club Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.clubDescription}
                onChangeText={(text) => setFormData({ ...formData, clubDescription: text })}
                placeholder="Tell us about your club's purpose, activities, and goals..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Supporting Document Upload */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Supporting Document</Text>
                <Text style={styles.optional}>(Recommended)</Text>
              </View>
              
              {formData.clubDocument ? (
                <View style={styles.documentPreviewContainer}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentIconContainer}>
                      <Ionicons name="document-text" size={32} color="#3F1F22" />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {documentName || 'Club Document'}
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
                  <Text style={styles.uploadText}>Upload Supporting Document</Text>
                  <Text style={styles.uploadSubtext}>
                    Club registration, constitution, or official letter
                  </Text>
                  <Text style={styles.uploadHint}>
                    PDF, DOC, DOCX, or Image (Max 10MB)
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helperText}>
                Upload any document that verifies your club's existence and purpose
              </Text>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !isFormValid() && styles.continueButtonDisabled
              ]}
              disabled={!isFormValid()}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Preview & Submit</Text>
              <Ionicons name="eye-outline" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              Club information helps members find and join your community activities.
            </Text>
          </View>
        </ScrollView>

        {/* Club Type Selection Modal */}
        <Modal
          visible={showClubTypeModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Club Type</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowClubTypeModal(false);
                    setSearchClubType('');
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
                  placeholder="Search club types..."
                  value={searchClubType}
                  onChangeText={setSearchClubType}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredClubTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalItem,
                      formData.clubType === type && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectClubType(type)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="people-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.clubType === type && styles.modalItemTextSelected
                      ]}>
                        {type}
                      </Text>
                    </View>
                    {formData.clubType === type && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Leader Role Selection Modal */}
        <Modal
          visible={showLeaderRoleModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Leader Role</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowLeaderRoleModal(false);
                    setSearchLeaderRole('');
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
                  value={searchLeaderRole}
                  onChangeText={setSearchLeaderRole}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredLeaderRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.modalItem,
                      formData.leaderRole === role && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectLeaderRole(role)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="person-circle-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.leaderRole === role && styles.modalItemTextSelected
                      ]}>
                        {role}
                      </Text>
                    </View>
                    {formData.leaderRole === role && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Meeting Frequency Selection Modal */}
        <Modal
          visible={showFrequencyModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Meeting Frequency</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowFrequencyModal(false);
                    setSearchFrequency('');
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
                  placeholder="Search frequencies..."
                  value={searchFrequency}
                  onChangeText={setSearchFrequency}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredFrequencies.map((frequency) => (
                  <TouchableOpacity
                    key={frequency}
                    style={[
                      styles.modalItem,
                      formData.meetingFrequency === frequency && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectFrequency(frequency)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="time-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.meetingFrequency === frequency && styles.modalItemTextSelected
                      ]}>
                        {frequency}
                      </Text>
                    </View>
                    {formData.meetingFrequency === frequency && (
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
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0FFE0',
  },
  clubBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
    marginLeft: 8,
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
  frequencyDropdown: {
    borderStyle: 'dashed',
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
    backgroundColor: '#F0FFF5',
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