import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ImageBackground
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import * as ImagePicker from 'expo-image-picker';

// Church leadership roles
const LEADERSHIP_ROLES = [
  'Senior Pastor',
  'Lead Pastor',
  'Associate Pastor',
  'Youth Pastor',
  'Children\'s Pastor',
  'Worship Pastor',
  'Executive Pastor',
  'Teaching Pastor',
  'Minister',
  'Elder',
  'Deacon',
  'Bishop',
  'Reverend',
  'Priest',
  'Chaplain',
];

// Weekly service schedule templates
const SERVICE_SCHEDULES = [
  'Sunday: 8:00 AM, 10:00 AM, 6:00 PM',
  'Sunday: 9:00 AM & 11:00 AM',
  'Sunday: 7:00 AM, 9:00 AM, 11:00 AM, 5:00 PM',
  'Sunday: 10:00 AM | Wednesday: 7:00 PM',
  'Saturday: 5:00 PM | Sunday: 9:00 AM & 11:00 AM',
  'Sunday: 8:30 AM & 10:30 AM',
  'Sunday: 7:30 AM, 9:30 AM, 11:30 AM',
  'Sunday: 9:00 AM | Midweek: Wednesday 7:00 PM',
  'Multiple services throughout the week',
];

export default function ChurchForm() {
  const router = useRouter();
  const { organizationData, updateOrganizationData } = useOrganization();
  
  const [formData, setFormData] = useState({
    ministryName: organizationData.ministryName || '',
    leadPastor: organizationData.leadPastor || '',
    leadershipRole: organizationData.leadershipRole || '',
    weeklyService: organizationData.weeklyService || '',
    churchWebsite: organizationData.churchWebsite || '',
    churchAddress: organizationData.churchAddress || '',
    churchLogo: organizationData.churchLogo || null,
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchRole, setSearchRole] = useState('');
  const [searchSchedule, setSearchSchedule] = useState('');

  // Filter roles based on search
  const filteredRoles = LEADERSHIP_ROLES.filter(role =>
    role.toLowerCase().includes(searchRole.toLowerCase())
  );

  // Filter schedules based on search
  const filteredSchedules = SERVICE_SCHEDULES.filter(schedule =>
    schedule.toLowerCase().includes(searchSchedule.toLowerCase())
  );

  const handleSelectRole = (role: string) => {
    setFormData({ ...formData, leadershipRole: role });
    setShowRoleModal(false);
    setSearchRole('');
  };

  const handleSelectSchedule = (schedule: string) => {
    setFormData({ ...formData, weeklyService: schedule });
    setShowScheduleModal(false);
    setSearchSchedule('');
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, churchLogo: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, churchLogo: null });
  };

  const isFormValid = () => {
    return formData.ministryName.trim() !== '' && 
           formData.leadPastor.trim() !== '' && 
           formData.leadershipRole.trim() !== '' && 
           formData.churchAddress.trim() !== '';
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
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(245, 245, 255, 0.9)']}
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
            <Text style={styles.headerTitle}>Church Information</Text>
            <Text style={styles.headerSubtitle}>Complete your church profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>Ministry Details</Text>
            <Text style={styles.sectionSubtitle}>
              Fill in your church information for verification
            </Text>
          </View>

          {/* Church Badge */}
          <View style={styles.churchBadge}>
            <Ionicons name="church" size={20} color="#3F1F22" />
            <Text style={styles.churchBadgeText}>Church Ministry</Text>
          </View>

          <View style={styles.formSection}>
            {/* Ministry Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Ministry Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.ministryName}
                onChangeText={(text) => setFormData({ ...formData, ministryName: text })}
                placeholder="Enter ministry/church name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Lead Pastor */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Lead Pastor</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.leadPastor}
                onChangeText={(text) => setFormData({ ...formData, leadPastor: text })}
                placeholder="Pastor's full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Leadership Role Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Leadership Role</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowRoleModal(true)}
              >
                <Text style={formData.leadershipRole ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.leadershipRole || 'Select Leadership Role'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Weekly Service Schedule */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Weekly Service Schedule</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  !formData.weeklyService && styles.scheduleDropdown
                ]}
                onPress={() => setShowScheduleModal(true)}
              >
                <Text style={formData.weeklyService ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.weeklyService || 'Select or enter service schedule'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#999" />
              </TouchableOpacity>
              {formData.weeklyService && (
                <Text style={styles.scheduleHelperText}>
                  This helps members find service times
                </Text>
              )}
            </View>

            {/* Church Website */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Church Website</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.churchWebsite}
                onChangeText={(text) => setFormData({ ...formData, churchWebsite: text })}
                placeholder="https://yourchurch.com"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            {/* Church Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Physical Address</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.churchAddress}
                onChangeText={(text) => setFormData({ ...formData, churchAddress: text })}
                placeholder="Enter complete church address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Church Logo Upload */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Church Logo</Text>
                <Text style={styles.optional}>(Recommended)</Text>
              </View>
              
              {formData.churchLogo ? (
                <View style={styles.logoPreviewContainer}>
                  <View style={styles.logoImageContainer}>
                    <Image 
                      source={{ uri: formData.churchLogo }} 
                      style={styles.logoImage}
                    />
                    <View style={styles.logoOverlay}>
                      <TouchableOpacity 
                        style={styles.overlayButton}
                        onPress={pickImage}
                      >
                        <Ionicons name="camera" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.overlayButton}
                        onPress={removeImage}
                      >
                        <Ionicons name="trash-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.logoActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.changeButton]}
                      onPress={pickImage}
                    >
                      <Ionicons name="refresh" size={16} color="#3F1F22" />
                      <Text style={styles.changeButtonText}>Change Logo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={removeImage}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.logoUploadButton}
                  onPress={pickImage}
                >
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#3F1F22" />
                  </View>
                  <Text style={styles.uploadText}>Upload Church Logo</Text>
                  <Text style={styles.uploadSubtext}>
                    JPG, PNG or SVG (Max 5MB)
                  </Text>
                  <Text style={styles.uploadHint}>
                    Recommended size: 500×500px
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.helperText}>
                A professional logo helps establish your church's identity
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
              Your church information will be verified for authenticity.
            </Text>
          </View>
        </ScrollView>

        {/* Leadership Role Selection Modal */}
        <Modal
          visible={showRoleModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Leadership Role</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowRoleModal(false);
                    setSearchRole('');
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
                  value={searchRole}
                  onChangeText={setSearchRole}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.modalItem,
                      formData.leadershipRole === role && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectRole(role)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="person-circle-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.leadershipRole === role && styles.modalItemTextSelected
                      ]}>
                        {role}
                      </Text>
                    </View>
                    {formData.leadershipRole === role && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Service Schedule Selection Modal */}
        <Modal
          visible={showScheduleModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Service Schedule</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowScheduleModal(false);
                    setSearchSchedule('');
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
                  placeholder="Search schedules..."
                  value={searchSchedule}
                  onChangeText={setSearchSchedule}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                <View style={styles.scheduleHeader}>
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <Text style={styles.scheduleHeaderText}>Common Service Schedules</Text>
                </View>
                
                {filteredSchedules.map((schedule) => (
                  <TouchableOpacity
                    key={schedule}
                    style={[
                      styles.modalItem,
                      formData.weeklyService === schedule && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectSchedule(schedule)}
                  >
                    <View style={styles.modalItemContent}>
                      <Ionicons name="calendar-outline" size={20} color="#3F1F22" style={styles.modalItemIcon} />
                      <Text style={[
                        styles.modalItemText,
                        formData.weeklyService === schedule && styles.modalItemTextSelected
                      ]}>
                        {schedule}
                      </Text>
                    </View>
                    {formData.weeklyService === schedule && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
                
                {/* Custom Schedule Option */}
                <TouchableOpacity
                  style={styles.customScheduleOption}
                  onPress={() => {
                    setShowScheduleModal(false);
                    setSearchSchedule('');
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#3F1F22" />
                  <Text style={styles.customScheduleText}>Enter custom schedule</Text>
                </TouchableOpacity>
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
  churchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0EAFF',
  },
  churchBadgeText: {
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
  scheduleDropdown: {
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
  scheduleHelperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  logoPreviewContainer: {
    alignItems: 'center',
  },
  logoImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(63, 31, 34, 0.8)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 16,
  },
  overlayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  logoActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  logoUploadButton: {
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
    textAlign: 'center',
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
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  scheduleHeaderText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
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
    backgroundColor: '#F0F5FF',
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
  customScheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 10,
  },
  customScheduleText: {
    fontSize: 16,
    color: '#3F1F22',
    fontWeight: '500',
    marginLeft: 12,
  },
});