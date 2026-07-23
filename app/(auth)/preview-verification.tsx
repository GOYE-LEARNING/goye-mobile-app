// File: app/(auth)/preview-verification.tsx

import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { createOrganization } from '@/utils/organizationApi';

type EditSection = 'organization' | 'user' | 'church' | 'school' | 'club';

interface InfoRowProps {
  label: string;
  value: string;
}

export default function PreviewVerification() {
  const router = useRouter();
  const { organizationData } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const orgType = organizationData.organizationType;

  const InfoRow = ({ label, value }: InfoRowProps) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '----'}</Text>
    </View>
  );

  const handleEdit = (section: EditSection) => {
    if (section === 'organization') {
      router.push({
        pathname: '/(auth)/organization-form',
        params: { orgType: organizationData.organizationType }
      });
    } else if (section === 'user') {
      router.push({
        pathname: '/(auth)/user-profile-form',
        params: { orgType: organizationData.organizationType }
      });
    } else {
      const routes: Record<'church' | 'school' | 'club', string> = {
        church: '/(auth)/church-form',
        school: '/(auth)/school-form',
        club: '/(auth)/club-form',
      };
      router.push(routes[section]);
    }
  };

  const handleCopyPassword = () => {
    Clipboard.setString(generatedPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await createOrganization(organizationData);
      
      if (result.success) {
        // Check if password was generated
        if (result.data.generatedPassword) {
          setGeneratedPassword(result.data.generatedPassword);
          setShowPasswordModal(true);
        } else if (result.passwordError) {
          // Organization created but password generation failed
          Alert.alert(
            'Partial Success',
            'Organization created successfully, but password generation failed. Please contact support.',
            [
              {
                text: 'OK',
                onPress: () => router.push('/(auth)/login')
              }
            ]
          );
        } else {
          // Organization created without password (shouldn't happen)
          Alert.alert(
            'Success!',
            'Your organization has been created successfully.',
            [
              {
                text: 'OK',
                onPress: () => router.push('/(auth)/login')
              }
            ]
          );
        }
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to create organization. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    router.push('/(auth)/login');
  };

  // Progress steps component
  const ProgressSteps = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressStep}>
        <View style={[styles.stepCircle, styles.stepCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.stepLabel}>Organization Type</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.stepCircle, styles.stepCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.stepLabel}>Organization Information</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.stepCircle, styles.stepCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.stepLabel}>User Information</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.stepCircle, styles.stepCompleted]}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <Text style={styles.stepLabel}>Organization Type Validation</Text>
      </View>
      
      <View style={styles.progressLine} />
      
      <View style={styles.progressStep}>
        <View style={[styles.stepCircle, styles.stepActive]}>
          <Text style={styles.stepNumber}>5</Text>
        </View>
        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Verification</Text>
      </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>Preview & Verify</Text>
            <Text style={styles.headerSubtitle}>Final Step</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress Steps */}
          <ProgressSteps />

          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Review Your Information</Text>
            <Text style={styles.pageSubtitle}>
              Please review all details before submitting
            </Text>
          </View>

          {/* Organization Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="business" size={20} color="#3F1F22" />
                <Text style={styles.sectionTitle}>Organization Information</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEdit('organization')}
              >
                <Ionicons name="create-outline" size={20} color="#3F1F22" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <InfoRow label="Organization Name" value={organizationData.organizationName || ''} />
            <InfoRow label="Organization Type" value={organizationData.organizationType || ''} />
            <InfoRow label="Email Address" value={organizationData.email || ''} />
            <InfoRow label="Phone Number" value={organizationData.phone || ''} />
            <InfoRow label="Country" value={organizationData.country || ''} />
            <InfoRow label="State" value={organizationData.state || ''} />
            <InfoRow label="Year Established" value={organizationData.yearEstablished || ''} />
            <InfoRow label="Description" value={organizationData.description || ''} />
          </View>

          {/* User Profile Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="person" size={20} color="#3F1F22" />
                <Text style={styles.sectionTitle}>Administrator Information</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEdit('user')}
              >
                <Ionicons name="create-outline" size={20} color="#3F1F22" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <InfoRow label="First Name" value={organizationData.userFirstName || ''} />
            <InfoRow label="Last Name" value={organizationData.userLastName || ''} />
            <InfoRow label="Email Address" value={organizationData.userEmail || ''} />
            <InfoRow label="Phone Number" value={organizationData.userPhone || ''} />
            <InfoRow label="Country" value={organizationData.userCountry || ''} />
            <InfoRow label="State" value={organizationData.userState || ''} />
            <InfoRow label="Role" value={organizationData.userRole || ''} />
          </View>

          {/* Type-Specific Section */}
          {orgType === 'church' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="church" size={20} color="#3F1F22" />
                  <Text style={styles.sectionTitle}>Church Information</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEdit('church')}
                >
                  <Ionicons name="create-outline" size={20} color="#3F1F22" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <InfoRow label="Ministry Name" value={organizationData.ministryName || ''} />
              <InfoRow label="Lead Pastor" value={organizationData.leadPastor || ''} />
              <InfoRow label="Leadership Role" value={organizationData.leadershipRole || ''} />
              <InfoRow label="Weekly Service" value={organizationData.weeklyService || ''} />
              <InfoRow label="Website" value={organizationData.churchWebsite || ''} />
              <InfoRow label="Address" value={organizationData.churchAddress || ''} />
            </View>
          )}


          {orgType === 'school' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="school" size={20} color="#3F1F22" />
                  <Text style={styles.sectionTitle}>School Information</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEdit('school')}
                >
                  <Ionicons name="create-outline" size={20} color="#3F1F22" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              

              <InfoRow label="School Name" value={organizationData.schoolName || ''} />
              <InfoRow label="School Type" value={organizationData.schoolType || ''} />
              <InfoRow label="Address" value={organizationData.schoolAddress || ''} />
              <InfoRow label="Admin Name" value={organizationData.adminName || ''} />
              <InfoRow label="Admin Role" value={organizationData.adminRole || ''} />
              <InfoRow label="Email Domain" value={organizationData.school_email || ''} />
              <InfoRow label="Website" value={organizationData.schoolWebsite || ''} />
              <InfoRow label="Accreditation Number" value={organizationData.accreditationNumber || ''} />
            </View>
          )}


          {orgType === 'club' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="people-circle" size={20} color="#3F1F22" />
                  <Text style={styles.sectionTitle}>Club Information</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit('club')}
                >
                  <Ionicons name="create-outline" size={20} color="#3F1F22" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <InfoRow label="Club Name" value={organizationData.clubName || ''} />
              <InfoRow label="Club Type" value={organizationData.clubType || ''} />
              <InfoRow label="Leader Name" value={organizationData.leaderName || ''} />
              <InfoRow label="Leader Role" value={organizationData.leaderRole || ''} />
              <InfoRow label="Meeting Frequency" value={organizationData.meetingFrequency || ''} />
              <InfoRow label="Parent Organization" value={organizationData.parentOrganization || ''} />
              <InfoRow label="Social/Messaging Link" value={organizationData.socialLink || ''} />
              <InfoRow label="Description" value={organizationData.clubDescription || ''} />
            </View>
          )}


          <TouchableOpacity
            style={[styles.verifyButton, isSubmitting && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.verifyButtonText}>  Submitting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.verifyButtonText}>Verify & Submit</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By submitting, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </View>

      {/* Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={handleClosePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>Organization Created!</Text>
              <Text style={styles.modalSubtitle}>Save your password securely</Text>
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>Your Organization Password:</Text>
              <View style={styles.passwordBox}>
                <Text style={styles.passwordText}>{generatedPassword}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopyPassword}
              >
                <Ionicons 
                  name={passwordCopied ? "checkmark-circle" : "copy-outline"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.copyButtonText}>
                  {passwordCopied ? 'Copied!' : 'Copy Password'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Please save this password. You'll need it to log in to your organization account.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleClosePasswordModal}
              >
                <Text style={styles.continueButtonText}>Continue to Login</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Progress Steps Styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepActive: {
    backgroundColor: '#3F1F22',
  },
  stepNumber: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  stepLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    maxWidth: 80,
  },
  stepLabelActive: {
    color: '#3F1F22',
    fontWeight: '600',
  },
  progressLine: {
    height: 2,
    flex: 0.5,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
    marginBottom: 28,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F1F22',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#3F1F22',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#3F1F22',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  verifyButton: {
    backgroundColor: '#3F1F22',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#3F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
  },
  verifyButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3F1F22',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  passwordContainer: {
    marginBottom: 24,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F1F22',
    marginBottom: 12,
  },
  passwordBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 12,
  },
  passwordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F1F22',
    textAlign: 'center',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F1F22',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  modalFooter: {
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});