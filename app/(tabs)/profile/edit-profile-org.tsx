import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '@/contexts/UserContext';
import { getOrganizationProfile, updateOrganizationProfile } from '@/services/api';
import { getImageUri } from '@/utils/helpers';

const COUNTRIES = ['Nigeria', 'United States', 'United Kingdom', 'Canada'];
const STATES: Record<string, string[]> = {
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Rivers'],
  'United States': ['California', 'Texas', 'New York'],
  'United Kingdom': ['England', 'Scotland', 'Wales'],
  Canada: ['Ontario', 'Quebec', 'British Columbia'],
};

const ORG_TYPES = [
  { label: 'Church', value: 'CHURCH' },
  { label: 'School', value: 'SCHOOL' },
  { label: 'Club', value: 'CLUB' },
];

export default function EditProfileOrg() {
  const { user, token } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Organization fields ──────────────────────────────────────────
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('CHURCH');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgCountry, setOrgCountry] = useState('Nigeria');
  const [orgState, setOrgState] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgYear, setOrgYear] = useState('');

  // ── Admin / user fields ──────────────────────────────────────────
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userCountry, setUserCountry] = useState('Nigeria');
  const [userState, setUserState] = useState('');

  // ── Church fields ────────────────────────────────────────────────
  const [churchMinistryName, setChurchMinistryName] = useState('');
  const [churchLeadPastor, setChurchLeadPastor] = useState('');
  const [churchRole, setChurchRole] = useState('');
  const [churchEmail, setChurchEmail] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [churchWeeklyService, setChurchWeeklyService] = useState('');
  const [churchWebsite, setChurchWebsite] = useState('');

  // ── School fields ────────────────────────────────────────────────
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolAdminName, setSchoolAdminName] = useState('');
  const [schoolRole, setSchoolRole] = useState('');
  const [schoolWebsite, setSchoolWebsite] = useState('');
  const [schoolAccreditation, setSchoolAccreditation] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');

  // ── Club fields ──────────────────────────────────────────────────
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState('');
  const [clubLeaderName, setClubLeaderName] = useState('');
  const [clubMeetingFrequency, setClubMeetingFrequency] = useState('');
  const [clubSocialLink, setClubSocialLink] = useState('');
  const [clubParentOrg, setClubParentOrg] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubRole, setClubRole] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await getOrganizationProfile(token);
      const d = result.organization || result.data || result;

      setOrgName(d.organization_name || '');
      setOrgType(d.organization_type || 'CHURCH');
      setOrgEmail(d.organization_email || '');
      setOrgPhone(d.organization_phone_number || '');
      setOrgCountry(d.organization_country || 'Nigeria');
      setOrgState(d.organization_state || '');
      setOrgDescription(d.organization_description || '');
      setOrgYear(d.organization_year || '');

      
      setUserFirstName(d.user_first_name || '');
      setUserLastName(d.user_last_name || '');
      setUserEmail(d.user_email_address || '');
      setUserPhone(d.user_phone_number || '');
      setUserCountry(d.user_country || 'Nigeria');
      setUserState(d.user_state || '');

      if (d.church) {
        setChurchMinistryName(d.church.church_ministry_name || '');
        setChurchLeadPastor(d.church.church_lead_pastor || '');
        setChurchRole(d.church.church_leadership_role || '');
        setChurchEmail(d.church.church_email || '');
        setChurchAddress(d.church.church_address || '');
        setChurchWeeklyService(d.church.church_weekly_service || '');
        setChurchWebsite(d.church.church_website || '');
      }
      if (d.school) {
        setSchoolName(d.school.school_name || '');
        setSchoolType(d.school.school_type || '');
        setSchoolAddress(d.school.school_address || '');
        setSchoolAdminName(d.school.school_admin_name || '');
        setSchoolRole(d.school.school_role || '');
        setSchoolWebsite(d.school.school_website || '');
        setSchoolAccreditation(d.school.school_accreditation_number || '');
        setSchoolEmail(d.school.school_email || '');
      }
      if (d.club) {
        setClubName(d.club.club_name || '');
        setClubType(d.club.club_type || '');
        setClubLeaderName(d.club.club_leader_name || '');
        setClubMeetingFrequency(d.club.club_meeting_frequency || '');
        setClubSocialLink(d.club.club_social_link || '');
        setClubParentOrg(d.club.club_parent_org || '');
        setClubDescription(d.club.club_description || '');
        setClubRole(d.club.club_role || '');
      }
    } catch (err) {
      console.error('❌ Error fetching org profile:', err);
      Alert.alert('Error', 'Failed to load organization profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
  try {
    setSaving(true);

    // Map ALLCAPS org type to the FormType enum the backend expects
    const formTypeMap: Record<string, string> = {
      CHURCH: 'Church',
      SCHOOL: 'school',
      CLUB: 'Club',
    };

    const payload: any = {
      organization_name: orgName,
      organization_type: orgType,
      organization_email: orgEmail,
      organization_phone_number: orgPhone,
      organization_country: orgCountry,
      organization_state: orgState,
      organization_description: orgDescription,
      organization_year: orgYear ? String(orgYear) : '',
      organization_role: 'Administrator',
      user_first_name: userFirstName,
      user_last_name: userLastName,
      user_email_address: userEmail,
      user_phone_number: userPhone,
      user_country: userCountry,
      user_state: userState,
      user_role: 'Administrator',
      user_form_type: 'ORGANIZATION', // ← correct enum casing
    };

    if (orgType === 'CHURCH') {
      payload.church = {
        church_ministry_name: churchMinistryName,
        church_lead_pastor: churchLeadPastor,
        church_leadership_role: churchRole,
        church_email: churchEmail,
        church_address: churchAddress,
        church_weekly_service: churchWeeklyService,
        church_website: churchWebsite,
      };
    } else if (orgType === 'SCHOOL') {
      payload.school = {
        school_name: schoolName,
        school_type: schoolType,
        school_address: schoolAddress,
        school_admin_name: schoolAdminName,
        school_role: schoolRole,
        school_website: schoolWebsite,
        school_accreditation_number: schoolAccreditation,
        school_email: schoolEmail,
      };
    } else if (orgType === 'CLUB') {
      payload.club = {
        club_name: clubName,
        club_type: clubType,
        club_leader_name: clubLeaderName,
        club_meeting_frequency: clubMeetingFrequency,
        club_social_link: clubSocialLink,
        club_parent_org: clubParentOrg,
        club_description: clubDescription,
        club_role: clubRole,
      };
    }

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

    const result = await updateOrganizationProfile(token, user?.organizationId || user?.id, payload);
    console.log('📥 Response:', result);

    Alert.alert('Success', 'Profile updated successfully');
    router.back();
  } catch (err: any) {
    console.error('❌ Error updating org profile:', err);
    Alert.alert('Error', err.message || 'Failed to update profile.');
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3F1F22" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={40} color="#999" />
            </View>
            <TouchableOpacity style={styles.avatarEditButton}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Organization Logo</Text>
        </View>

        <View style={styles.form}>

          {/* ── Section: Organization Info ─────────────────────────── */}
          <SectionHeader title="Organization Information" />

          <InputField label="Organization Name" value={orgName} onChangeText={setOrgName} placeholder="Organization name" />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Type</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={orgType} onValueChange={setOrgType} style={styles.picker}>
               {ORG_TYPES.map((t) => (
  <Picker.Item key={t.value} label={t.label} value={t.value} />
))}
              </Picker>
            </View>
          </View>

          <InputField label="Organization Email" value={orgEmail} onChangeText={setOrgEmail} placeholder="Organization email" keyboardType="email-address" />
          <InputField label="Phone Number" value={orgPhone} onChangeText={setOrgPhone} placeholder="Phone number" keyboardType="phone-pad" />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={orgCountry} onValueChange={(v) => { setOrgCountry(v); setOrgState(''); }} style={styles.picker}>
                {COUNTRIES.map((c) => <Picker.Item key={c} label={c} value={c} />)}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={orgState} onValueChange={setOrgState} style={styles.picker}>
                {STATES[orgCountry]?.map((s) => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
            </View>
          </View>

          <InputField label="Year Founded" value={orgYear} onChangeText={setOrgYear} placeholder="e.g. 2010" keyboardType="numeric" />
          <InputField label="Description" value={orgDescription} onChangeText={setOrgDescription} placeholder="About your organization" multiline />

          {/* ── Section: Type-specific fields ─────────────────────── */}
          {orgType === 'CHURCH' && (
            <>
              <SectionHeader title="Church Details" />
              <InputField label="Ministry Name" value={churchMinistryName} onChangeText={setChurchMinistryName} placeholder="Ministry name" />
              <InputField label="Lead Pastor" value={churchLeadPastor} onChangeText={setChurchLeadPastor} placeholder="Lead pastor" />
              <InputField label="Your Leadership Role" value={churchRole} onChangeText={setChurchRole} placeholder="e.g. Pastor, Elder" />
              <InputField label="Church Email" value={churchEmail} onChangeText={setChurchEmail} placeholder="Church email" keyboardType="email-address" />
              <InputField label="Church Address" value={churchAddress} onChangeText={setChurchAddress} placeholder="Church address" />
              <InputField label="Weekly Service Schedule" value={churchWeeklyService} onChangeText={setChurchWeeklyService} placeholder="e.g. Sundays 9am & 11am" />
              <InputField label="Church Website" value={churchWebsite} onChangeText={setChurchWebsite} placeholder="https://..." keyboardType="url" />
            </>
          )}

          {orgType === 'SCHOOL' && (
            <>
              <SectionHeader title="School Details" />
              <InputField label="School Name" value={schoolName} onChangeText={setSchoolName} placeholder="School name" />
              <InputField label="School Type" value={schoolType} onChangeText={setSchoolType} placeholder="e.g. Primary, Secondary, University" />
              <InputField label="School Address" value={schoolAddress} onChangeText={setSchoolAddress} placeholder="School address" />
              <InputField label="Admin Name" value={schoolAdminName} onChangeText={setSchoolAdminName} placeholder="Administrator name" />
              <InputField label="Your Role" value={schoolRole} onChangeText={setSchoolRole} placeholder="e.g. Principal, Admin" />
              <InputField label="School Website" value={schoolWebsite} onChangeText={setSchoolWebsite} placeholder="https://..." keyboardType="url" />
              <InputField label="Accreditation Number" value={schoolAccreditation} onChangeText={setSchoolAccreditation} placeholder="Accreditation number" />
              <InputField label="School Email" value={schoolEmail} onChangeText={setSchoolEmail} placeholder="School email" keyboardType="email-address" />
            </>
          )}

          {orgType === 'CLUB' && (
            <>
              <SectionHeader title="Club Details" />
              <InputField label="Club Name" value={clubName} onChangeText={setClubName} placeholder="Club name" />
              <InputField label="Club Type" value={clubType} onChangeText={setClubType} placeholder="e.g. Sports, Academic, Social" />
              <InputField label="Club Leader Name" value={clubLeaderName} onChangeText={setClubLeaderName} placeholder="Leader name" />
              <InputField label="Meeting Frequency" value={clubMeetingFrequency} onChangeText={setClubMeetingFrequency} placeholder="e.g. Weekly, Bi-weekly" />
              <InputField label="Social Link" value={clubSocialLink} onChangeText={setClubSocialLink} placeholder="Instagram, Twitter, etc." keyboardType="url" />
              <InputField label="Parent Organization" value={clubParentOrg} onChangeText={setClubParentOrg} placeholder="Parent org (if any)" />
              <InputField label="Club Description" value={clubDescription} onChangeText={setClubDescription} placeholder="What does your club do?" multiline />
              <InputField label="Your Role" value={clubRole} onChangeText={setClubRole} placeholder="e.g. President, Secretary" />
            </>
          )}

          {/* ── Section: Admin / Contact Person ───────────────────── */}
          <SectionHeader title="Admin / Contact Person" />
          <InputField label="First Name" value={userFirstName} onChangeText={setUserFirstName} placeholder="First name" />
          <InputField label="Last Name" value={userLastName} onChangeText={setUserLastName} placeholder="Last name" />
          <InputField label="Email Address" value={userEmail} onChangeText={setUserEmail} placeholder="Email address" keyboardType="email-address" />
          <InputField label="Phone Number" value={userPhone} onChangeText={setUserPhone} placeholder="Phone number" keyboardType="phone-pad" />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={userCountry} onValueChange={(v) => { setUserCountry(v); setUserState(''); }} style={styles.picker}>
                {COUNTRIES.map((c) => <Picker.Item key={c} label={c} value={c} />)}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={userState} onValueChange={setUserState} style={styles.picker}>
                {STATES[userCountry]?.map((s) => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
            </View>
          </View>

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: '#666' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', flex: 1, textAlign: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: '#F0EDE8', justifyContent: 'center', alignItems: 'center' },
  avatarEditButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  avatarHint: { fontSize: 13, color: '#999', marginTop: 10 },
  form: { paddingHorizontal: 20 },
  sectionHeader: {
    marginTop: 16, marginBottom: 12,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  sectionHeaderText: { fontSize: 15, fontWeight: '700', color: '#3F1F22' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#999', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', padding: 16, fontSize: 16, color: '#333' },
  inputMultiline: { height: 90, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  saveButton: { backgroundColor: '#3F1F22', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#9B8A8B' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});