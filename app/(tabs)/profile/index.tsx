// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useSignUp } from '@/contexts/SignUpContext';
import { getUserProfile, getOrganizationProfile, uploadProfilePicture } from '@/services/api';
import { getImageUri } from '@/utils/helpers';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import Toast from 'react-native-toast-message';

export default function Profile() {
  const { token, logout, isOrganizationAdmin, user, clearUserData } = useUser();
  const { reset } = useSignUp();
  const { signOutGoogle } = useGoogleSignIn();
  const { colors, isDark, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchProfileData(); }, [])
  );

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      if (isOrganizationAdmin) {
        try {
          result = await getOrganizationProfile(token);
          setProfileData(result.organization || result.data || result);
          console.log('✅ Organization profile loaded from API');
        } catch (apiErr: any) {
          console.log('⚠️ Organization API failed:', apiErr.message);
          
          // ✅ Check if session expired
          if (apiErr.message?.includes('SESSION_EXPIRED') || apiErr.message?.includes('Session expired')) {
            await clearUserData();
            router.replace('/(auth)/start');
            return;
          }
          
          // ✅ Fallback to cached user data
          if (user) {
            setProfileData({
              organization_name: user.first_name || 'Organization',
              organization_email: user.email_address || '',
              organization_phone_number: user.phone_number || '',
              organization_state: user.state || '',
              organization_logo: user.user_pic || null,
              user_first_name: user.first_name || '',
              user_last_name: user.last_name || '',
            });
            setError(null);
            Toast.show({
              type: 'info',
              text1: 'Using cached profile',
              text2: 'Could not fetch fresh data, showing saved profile',
              position: 'bottom',
            });
          } else {
            setError('Could not load organization profile');
          }
        }
      } else {
        try {
          result = await getUserProfile(token);
          const freshData = result.user || result.data || result;
          setProfileData(freshData);
          console.log('✅ Profile loaded from API');
        } catch (apiErr: any) {
          console.log('⚠️ API failed:', apiErr.message);
          
          // ✅ Check if session expired
          if (apiErr.message?.includes('SESSION_EXPIRED') || apiErr.message?.includes('Session expired')) {
            await clearUserData();
            router.replace('/(auth)/start');
            return;
          }
          
          // ✅ If API fails, use cached data from UserContext
          if (user) {
            const cachedData = {
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              email_address: user.email_address || '',
              phone_number: user.phone_number || '',
              state: user.state || '',
              country: user.country || '',
              user_pic: user.user_pic || null,
              level: user.level || '',
            };
            setProfileData(cachedData);
            setError(null);
            
            Toast.show({
              type: 'info',
              text1: 'Using cached profile',
              text2: 'Could not fetch fresh data, showing saved profile',
              position: 'bottom',
            });
          } else {
            setError('Could not load profile data');
          }
        }
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      
      // ✅ Check if session expired
      if (err.message?.includes('SESSION_EXPIRED') || err.message?.includes('Session expired')) {
        await clearUserData();
        router.replace('/(auth)/start');
        return;
      }
      
      setError('Failed to load profile');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile data',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Error', 'Could not read image data.'); return; }

    setUploadingPic(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] ?? 'jpg';
      await uploadProfilePicture(token!, {
        mimeType,
        fileName: asset.fileName ?? `profile_${Date.now()}.${extension}`,
        file: asset.base64,
      });
      Alert.alert('Success', 'Profile picture updated!');
      await fetchProfileData();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to upload profile picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => { 
          try {
            await logout(signOutGoogle);
            reset();
            console.log('✅ Sign-up data cleared on logout');
            router.replace('/(auth)/start');
          } catch (error) {
            console.error('Logout error:', error);
            router.replace('/(auth)/start');
          }
        } 
      },
    ]);
  };

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profileData) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={s.errorText}>{error || 'Failed to load profile'}</Text>
          <TouchableOpacity style={s.retryButton} onPress={fetchProfileData}>
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sharedProps = { 
    profileData, 
    onLogout: handleLogout, 
    onUploadPicture: handleUploadProfilePicture, 
    uploadingPic, 
    colors, 
    isDark, 
    toggleTheme, 
    s 
  };

  if (isOrganizationAdmin) return <OrganizationProfileView {...sharedProps} />;
  return <IndividualProfileView {...sharedProps} />;
}
// ── Shared prop type ──────────────────────────────────────────────────────────
type ViewProps = {
  profileData: any;
  onLogout: () => void;
  onUploadPicture: () => void;
  uploadingPic: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  toggleTheme: () => void;
  s: ReturnType<typeof makeStyles>;
};

// ── Individual Profile ────────────────────────────────────────────────────────
function IndividualProfileView({ profileData, onLogout, onUploadPicture, uploadingPic, colors, isDark, toggleTheme, s }: ViewProps) {
  const avatarUri = profileData.user_pic ? getImageUri(profileData.user_pic) : null;
  const fullName  = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'User';
  const email     = profileData.email_address || 'No email';
  const phone     = profileData.phone_number || 'No phone';
  const location  = profileData.state || 'No location set';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileHeader}>
          <View style={s.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Text style={s.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity style={s.avatarEditButton} onPress={onUploadPicture} disabled={uploadingPic}>
              {uploadingPic
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{fullName}</Text>
        </View>

        <View style={s.infoSection}>
          <InfoRow label="Email" value={email} s={s} />
          <InfoRow label="Phone Number" value={phone} s={s} />
          <InfoRow label="Location" value={location} s={s} last />
        </View>

        <View style={s.menuSection}>
          <MenuItem icon="person-outline" title="Profile" subtitle="Edit personal information" onPress={() => router.push('/(tabs)/profile/edit-profile' as any)} s={s} colors={colors} />
          <MenuItem icon="key-outline" title="Password" subtitle="Change your password" onPress={() => router.push('/(tabs)/profile/change-password' as any)} s={s} colors={colors} />
          <MenuItem icon="notifications-outline" title="Notifications" subtitle="Manage in-app and email notifications" onPress={() => router.push('/(tabs)/profile/notifications' as any)} s={s} colors={colors} />
          <MenuItem icon="globe-outline" title="Language" subtitle="English" s={s} colors={colors} />

          {/* Dark Mode Toggle */}
          <View style={s.menuItem}>
            <View style={s.menuItemLeft}>
              <View style={s.menuIcon}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.brand} />
              </View>
              <View style={s.menuTextContainer}>
                <Text style={s.menuItemTitle}>Dark Mode</Text>
                <Text style={s.menuItemSubtitle}>{isDark ? 'On' : 'Off'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderMid, true: colors.brand }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <LogoutButton onPress={onLogout} s={s} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Organization Profile ──────────────────────────────────────────────────────
function OrganizationProfileView({ profileData, onLogout, onUploadPicture, uploadingPic, colors, isDark, toggleTheme, s }: ViewProps) {
  const logoUri   = profileData.organization_logo ? getImageUri(profileData.organization_logo) : null;
  const orgName   = profileData.organization_name || 'Organization';
  const orgType   = profileData.organization_type || '';
  const email     = profileData.organization_email || 'No email';
  const phone     = profileData.organization_phone_number || 'No phone';
  const location  = profileData.organization_state || 'No location set';
  const adminName = `${profileData.user_first_name || ''} ${profileData.user_last_name || ''}`.trim() || 'Admin';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileHeader}>
          <View style={s.avatarContainer}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Text style={s.avatarText}>{orgName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity style={s.avatarEditButton} onPress={onUploadPicture} disabled={uploadingPic}>
              {uploadingPic
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{orgName}</Text>
          {orgType ? <View style={s.orgTypeBadge}><Text style={s.orgTypeText}>{orgType}</Text></View> : null}
        </View>

        <View style={s.infoSection}>
          <InfoRow label="Admin" value={adminName} s={s} />
          <InfoRow label="Email" value={email} s={s} />
          <InfoRow label="Phone Number" value={phone} s={s} />
          <InfoRow label="Location" value={location} s={s} last />
        </View>

        <View style={s.menuSection}>
          <MenuItem icon="business-outline" title="Organization Profile" subtitle="Edit organization information" onPress={() => router.push('/(tabs)/profile/edit-profile-org' as any)} s={s} colors={colors} />
          <MenuItem icon="key-outline" title="Password" subtitle="Change your password" onPress={() => router.push('/(tabs)/profile/change-password' as any)} s={s} colors={colors} />
          <MenuItem icon="notifications-outline" title="Notifications" subtitle="Manage in-app and email notifications" onPress={() => router.push('/(tabs)/profile/notifications' as any)} s={s} colors={colors} />
          <MenuItem icon="globe-outline" title="Language" subtitle="English" s={s} colors={colors} />

          <View style={s.menuItem}>
            <View style={s.menuItemLeft}>
              <View style={s.menuIcon}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.brand} />
              </View>
              <View style={s.menuTextContainer}>
                <Text style={s.menuItemTitle}>Dark Mode</Text>
                <Text style={s.menuItemSubtitle}>{isDark ? 'On' : 'Off'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderMid, true: colors.brand }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <LogoutButton onPress={onLogout} s={s} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ label, value, last, s }: { label: string; value: string; last?: boolean; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, title, subtitle, onPress, s, colors }: {
  icon: any; title: string; subtitle: string; onPress?: () => void;
  s: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <View style={s.menuItemLeft}>
        <View style={s.menuIcon}>
          <Ionicons name={icon} size={20} color={colors.brand} />
        </View>
        <View style={s.menuTextContainer}>
          <Text style={s.menuItemTitle}>{title}</Text>
          <Text style={s.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function LogoutButton({ onPress, s }: { onPress: () => void; s: ReturnType<typeof makeStyles> }) {
  return (
    <TouchableOpacity style={s.logoutButton} onPress={onPress}>
      <Ionicons name="log-out-outline" size={20} color="#EF4444" />
      <Text style={s.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: c.background },
    centerContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 40 },
    loadingText:      { fontSize: 16, color: c.textSecondary },
    errorText:        { fontSize: 16, color: c.textSecondary, textAlign: 'center' },
    retryButton:      { backgroundColor: c.brand, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 8 },
    retryButtonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
    backButton:       { paddingVertical: 12, paddingHorizontal: 32 },
    backButtonText:   { color: c.textSecondary, fontSize: 16 },

    profileHeader:    { alignItems: 'center', paddingVertical: 30 },
    avatarContainer:  { position: 'relative', marginBottom: 16 },
    avatar:           { width: 100, height: 100, borderRadius: 50, backgroundColor: c.backgroundMuted },
    avatarPlaceholder:{ justifyContent: 'center', alignItems: 'center', backgroundColor: c.borderMid },
    avatarText:       { fontSize: 40, fontWeight: '600', color: c.textSecondary },
    avatarEditButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.background },
    userName:         { fontSize: 24, fontWeight: '700', color: c.text },
    orgTypeBadge:     { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: c.brandLighter, borderRadius: 20 },
    orgTypeText:      { fontSize: 13, color: c.brand, fontWeight: '500', textTransform: 'capitalize' },

    infoSection:      { marginHorizontal: 20, marginBottom: 24, backgroundColor: c.backgroundSoft, paddingHorizontal: 16, borderRadius: 8 },
    infoRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    infoLabel:        { fontSize: 14, color: c.textSecondary },
    infoValue:        { fontSize: 14, color: c.text, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 16 },

    menuSection:      { marginHorizontal: 20, marginTop: 24, gap: 12 },
    menuItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderColor: c.border, borderWidth: 1, borderRadius: 8 },
    menuItemLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuIcon:         { width: 40, height: 40, borderRadius: 20, backgroundColor: c.backgroundMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    menuTextContainer:{ flex: 1 },
    menuItemTitle:    { fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 2 },
    menuItemSubtitle: { fontSize: 12, color: c.textMuted },

    logoutButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 32, paddingVertical: 16, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', borderRadius: 8 },
    logoutText:       { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  });
}