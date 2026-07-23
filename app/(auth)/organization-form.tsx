import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,  
  TouchableOpacity, 
  Modal,
  ImageBackground 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

// Country and State data
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'India',
  'Brazil',
  'Germany',
  'France',
  'Japan',
  'China',
  'Mexico',
];

const STATES_BY_COUNTRY: { [key: string]: string[] } = {
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ],
  'Nigeria': [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
    'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
    'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
    'Yukon'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Australia': [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania',
    'Victoria', 'Western Australia', 'Australian Capital Territory',
    'Northern Territory'
  ],
};

export default function OrganizationForm() {
  const router = useRouter();
  const { orgType } = useLocalSearchParams();
  const { organizationData, updateOrganizationData } = useOrganization();
  
  const [formData, setFormData] = useState({
    organizationName: organizationData.organizationName || '',
    email: organizationData.email || '',
    phone: organizationData.phone || '',
    country: organizationData.country || '',
    state: organizationData.state || '',
    yearEstablished: organizationData.yearEstablished || '',
    description: organizationData.description || '',
    
  });

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [searchState, setSearchState] = useState('');

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(searchCountry.toLowerCase())
  );

  // Filter states based on search and selected country
  const availableStates = formData.country ? (STATES_BY_COUNTRY[formData.country] || []) : [];
  const filteredStates = availableStates.filter(state =>
    state.toLowerCase().includes(searchState.toLowerCase())
  );

  const handleSelectCountry = (country: string) => {
    setFormData({ ...formData, country, state: '' });
    setShowCountryModal(false);
    setSearchCountry('');
  };

  const handleSelectState = (state: string) => {
    setFormData({ ...formData, state });
    setShowStateModal(false);
    setSearchState('');
  };

  const isFormValid = () => {
    return formData.organizationName.trim() !== '' && 
           formData.email.trim() !== '' && 
           formData.phone.trim() !== '' && 
           formData.country.trim() !== '' && 
           formData.state.trim() !== '';
  };

  const handleContinue = () => {
    if (!isFormValid()) return;
    
    updateOrganizationData({
      organizationType: orgType,
      ...formData
    });
    
    // Navigate to type-specific form
    const routes = {
      church: '/(auth)/church-form',
      school: '/(auth)/school-form',
      club: '/(auth)/club-form',
      nonprofit: '/(auth)/organization-form',
      ministry: '/(auth)/organization-form',
    };
    
    router.push({
  pathname: '/(auth)/user-profile-form',
  params: { orgType: orgType }
}); // Goes
  };

  const getOrgTypeDisplay = () => {
    const typeMap = {
      church: 'Church',
      school: 'School',
      club: 'Community Club',
      nonprofit: 'Non-Profit',
      ministry: 'Ministry'
    };
    return typeMap[orgType] || orgType.charAt(0).toUpperCase() + orgType.slice(1);
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
            <Text style={styles.headerTitle}>Organization Details</Text>
            <Text style={styles.headerSubtitle}>Step 3 of 3</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>General Information</Text>
            <Text style={styles.sectionSubtitle}>
              Please fill in your organization's basic details
            </Text>
          </View>

          {/* Organization Type Badge */}
          <View style={styles.orgTypeBadge}>
            <Ionicons name="business" size={16} color="#3F1F22" />
            <Text style={styles.orgTypeText}>{getOrgTypeDisplay()}</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Organization Name</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.organizationName}
                onChangeText={(text) => setFormData({ ...formData, organizationName: text })}
                placeholder="Enter organization name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Email Address</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="organization@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+1 (234) 567-8900"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Country Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Country</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={formData.country ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {formData.country || 'Select Country'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* State Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>State/Province</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  !formData.country && styles.dropdownDisabled
                ]}
                onPress={() => formData.country && setShowStateModal(true)}
                disabled={!formData.country}
              >
                <Text style={
                  formData.state ? styles.dropdownText : 
                  !formData.country ? styles.dropdownPlaceholderDisabled : 
                  styles.dropdownPlaceholder
                }>
                  {formData.state || 
                    (formData.country ? 'Select State/Province' : 'Select country first')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={!formData.country ? '#CCC' : '#999'} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Year Established</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.yearEstablished}
                onChangeText={(text) => setFormData({ ...formData, yearEstablished: text })}
                placeholder="YYYY"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Tell us about your organization's mission, values, and activities..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
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
              <Text style={styles.continueButtonText}>Continue to Setup</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              Your information is secure and will only be used for verification purposes.
            </Text>
          </View>
        </ScrollView>

        {/* Country Selection Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowCountryModal(false);
                    setSearchCountry('');
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
                  placeholder="Search countries..."
                  value={searchCountry}
                  onChangeText={setSearchCountry}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredCountries.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.modalItem,
                      formData.country === country && styles.modalItemSelected
                    ]}
                    onPress={() => handleSelectCountry(country)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      formData.country === country && styles.modalItemTextSelected
                    ]}>
                      {country}
                    </Text>
                    {formData.country === country && (
                      <Ionicons name="checkmark" size={20} color="#3F1F22" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* State Selection Modal */}
        <Modal
          visible={showStateModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select State/Province</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowStateModal(false);
                    setSearchState('');
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
                  placeholder={`Search ${formData.country} states...`}
                  value={searchState}
                  onChangeText={setSearchState}
                  autoCapitalize="none"
                />
              </View>
              
              <ScrollView style={styles.modalList}>
                {filteredStates.length > 0 ? (
                  filteredStates.map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.modalItem,
                        formData.state === state && styles.modalItemSelected
                      ]}
                      onPress={() => handleSelectState(state)}
                    >
                      <Text style={[
                        styles.modalItemText,
                        formData.state === state && styles.modalItemTextSelected
                      ]}>
                        {state}
                      </Text>
                      {formData.state === state && (
                        <Ionicons name="checkmark" size={20} color="#3F1F22" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyStateText}>
                      No states found for this country
                    </Text>
                  </View>
                )}
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
  orgTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  orgTypeText: {
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
  dropdownDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownPlaceholderDisabled: {
    fontSize: 16,
    color: '#CCC',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
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
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#3F1F22',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});