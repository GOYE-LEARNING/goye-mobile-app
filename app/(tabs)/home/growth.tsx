// app/(tabs)/spiritual-growth.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTheme, lightColors } from '@/contexts/ThemeContext';
import { getGrowthByProgressId, getUserCertificates } from '@/services/api';

const BADGE_ICON_MAP: Record<string, string> = {
  CADET_BADGE: 'shield-outline',
  PRAYER_BADGE: 'hand-right-outline',
  WISDOM_BADGE: 'school-outline',
  SCRIPTURE_BADGE: 'book-outline',
  CONSISTENCY_BADGE: 'calendar-outline',
  COMMUNITY_BADGE: 'people-outline',
  COMPLETION_BADGE: 'trophy-outline',
};

export default function SpiritualGrowth() {
  const params = useLocalSearchParams<{ progressId?: string; tab?: string }>();
  const { token } = useUser();
  const { colors } = useTheme();

  const isValidTab = (tab?: string): tab is 'achievements' | 'certificates' | 'badges' =>
    tab === 'achievements' || tab === 'certificates' || tab === 'badges';

  const [activeTab, setActiveTab] = useState<'achievements' | 'certificates' | 'badges'>(
    isValidTab(params.tab) ? params.tab : 'achievements'
  );
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  // Fetch growth data using progressId from params
  useEffect(() => {
    if (params.progressId) {
      fetchGrowthData(params.progressId);
    } else {
      setLoading(false);
    }
  }, [params.progressId]);

  // Fetch certificates when tab changes to certificates
  useEffect(() => {
    if (activeTab === 'certificates' && token) {
      fetchCertificates();
    }
  }, [activeTab, token]);

  const fetchGrowthData = async (progressId: string) => {
    setLoading(true);
    try {
      const result = await getGrowthByProgressId(progressId, token!);
      if (result?.data) {
        setGrowthData(result.data);
      }
    } catch (err: any) {
      console.error('[Growth] fetch growth data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    if (!token) return;
    setLoadingCertificates(true);
    try {
      const result = await getUserCertificates(token);
      if (result?.data) {
        const certs = Array.isArray(result.data) ? result.data : [result.data];
        setCertificates(certs);
        console.log('[Certificates] Fetched:', certs.length);
      } else {
        setCertificates([]);
      }
    } catch (err: any) {
      console.error('[Certificates] fetch error:', err);
      setCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleViewCertificate = (cert: any) => {
    const certUrl = cert.url || cert.certificate_url;
    Alert.alert(
      'Certificate Details',
      `Course: ${cert.courseTitle || cert.course_title || 'Course Certificate'}\n` +
      `Issued: ${new Date(cert.issuedAt || cert.createdAt || Date.now()).toLocaleDateString()}\n` +
      `ID: ${cert.id || cert._id || 'N/A'}`,
      [
        { text: 'Close', style: 'cancel' },
        ...(certUrl ? [{ 
          text: 'View PDF', 
          onPress: () => {
            Linking.openURL(certUrl).catch(err => {
              console.error('Error opening URL:', err);
              Alert.alert('Error', 'Could not open the certificate. Please try again.');
            });
          }
        }] : [])
      ]
    );
  };

  // Extract data from the growth response
  const user = growthData?.user || {};
  const stats = growthData?.stats || {};
  const achievements = growthData?.achievements || {};
  const badges = achievements?.badges || [];
  const levelProgress = achievements?.levelProgress || {};
  
  const levelName = levelProgress?.name || user?.currentLevel?.replace(/_/g, ' ') || 'Seeker';
  const currentLevel = levelProgress?.level || user?.levelNumber || 1;
  const nextLevelXP = levelProgress?.nextLevelXP || user?.nextLevelXP || 460;
  const progressToNext = levelProgress?.progressToNext || user?.progressToNextLevel || 0;
  const progressPct = Math.min((progressToNext / nextLevelXP) * 100, 100);
  
  const totalPoints = user?.totalXP || stats?.totalPoints || 0;
  const totalBadges = stats?.totalBadges || badges.length;
  const totalAchievements = stats?.totalAchievements || 0;
  const completedCourses = stats?.completedCourses || 0;

  const achievementItems = badges.map((badge: any) => ({
    id: badge.id,
    title: badge.achievement?.title || badge.badges?.replace(/_/g, ' ') || 'Achievement',
    content: badge.achievement?.content || '',
    point: badge.achievement?.point || 0,
    createdAt: badge.createdAt,
    badge: badge.badges,
  }));

  const s = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Spiritual Growth</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={s.loadingText}>Loading growth data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!growthData) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Spiritual Growth</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.emptyState}>
          <Ionicons name="leaf-outline" size={64} color={colors.textMuted} />
          <Text style={s.emptyText}>No growth data available</Text>
          <Text style={s.emptySubText}>Start your journey to see your progress</Text>
          <TouchableOpacity 
            style={s.startButton}
            onPress={() => router.back()}
          >
            <Text style={s.startButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Spiritual Growth</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Overview Card */}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <View style={s.levelBadge}>
              <Text style={s.levelText}>
                {levelName} (Level {currentLevel})
              </Text>
            </View>
            <Text style={s.pointsText}>{totalPoints} XP</Text>
          </View>

          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={s.progressInfo}>
            {progressToNext} / {nextLevelXP} XP to next level
          </Text>

          {/* Stats Grid */}
          <View style={s.statsGrid}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{totalAchievements}</Text>
              <Text style={s.statLabel}>Achievements</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{completedCourses}</Text>
              <Text style={s.statLabel}>Certificates</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{totalBadges}</Text>
              <Text style={s.statLabel}>Badges</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{totalPoints}</Text>
              <Text style={s.statLabel}>Total Points</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabsContainer}>
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, activeTab === 'achievements' && s.tabActive]}
              onPress={() => setActiveTab('achievements')}
            >
              <Text style={[s.tabText, activeTab === 'achievements' && s.tabTextActive]}>
                Achievements
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, activeTab === 'badges' && s.tabActive]}
              onPress={() => setActiveTab('badges')}
            >
              <Text style={[s.tabText, activeTab === 'badges' && s.tabTextActive]}>
                Badges
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, activeTab === 'certificates' && s.tabActive]}
              onPress={() => setActiveTab('certificates')}
            >
              <Text style={[s.tabText, activeTab === 'certificates' && s.tabTextActive]}>
                Certificates
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <View style={s.listContainer}>
            {achievementItems.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
                <Text style={s.emptyText}>No achievements yet</Text>
                <Text style={s.emptySubText}>Complete activities to earn achievements</Text>
              </View>
            ) : (
              achievementItems.map((item: any) => (
                <View key={item.id} style={s.achievementItem}>
                  <View style={s.achievementIcon}>
                    <Ionicons
                      name={(BADGE_ICON_MAP[item.badge] ?? 'star-outline') as any}
                      size={24}
                      color={colors.brand}
                    />
                  </View>
                  <View style={s.achievementContent}>
                    <Text style={s.achievementTitle}>{item.title}</Text>
                    <Text style={s.achievementDescription}>{item.content}</Text>
                    <Text style={s.achievementDate}>
                      Earned {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={s.pointsBadge}>
                    <Text style={s.pointsBadgeText}>+{item.point}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <View style={s.listContainer}>
            {badges.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
                <Text style={s.emptyText}>No badges yet</Text>
                <Text style={s.emptySubText}>Earn badges by completing achievements</Text>
              </View>
            ) : (
              <View style={s.badgesGrid}>
                {badges.map((badge: any) => (
                  <View key={badge.id} style={s.badgeCard}>
                    <View style={s.badgeIconWrapper}>
                      <Ionicons
                        name={(BADGE_ICON_MAP[badge.badges] ?? 'shield-checkmark-outline') as any}
                        size={32}
                        color={colors.brand}
                      />
                    </View>
                    <Text style={s.badgeLabel}>
                      {badge.badges?.replace(/_/g, ' ')}
                    </Text>
                    <Text style={s.badgeDate}>
                      {new Date(badge.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <View style={s.listContainer}>
            {loadingCertificates ? (
              <View style={s.loadingContainer}>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={s.loadingText}>Loading certificates...</Text>
              </View>
            ) : certificates.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="ribbon-outline" size={48} color={colors.textMuted} />
                <Text style={s.emptyText}>No certificates yet</Text>
                <Text style={s.emptySubText}>Complete courses to earn certificates</Text>
                
                {growthData?.courses?.completed?.length > 0 && (
                  <View style={s.completedCoursesInfo}>
                    <Text style={s.completedCoursesTitle}>Completed Courses:</Text>
                    {growthData.courses.completed.map((course: any) => (
                      <View key={course.courseId} style={s.completedCourseItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={s.completedCourseName}>{course.course_title}</Text>
                        <View style={s.pendingBadge}>
                          <Text style={s.pendingBadgeText}>Pending</Text>
                        </View>
                      </View>
                    ))}
                    <Text style={s.certificatePendingText}>
                      Certificates will be available soon
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={s.browseButton}
                  onPress={() => router.push('/(tabs)/home')}
                >
                  <Text style={s.browseButtonText}>Browse Courses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.certificatesList}>
                <View style={s.certCountContainer}>
                  <Text style={s.certCountText}>
                    You have {certificates.length} certificate{certificates.length > 1 ? 's' : ''}
                  </Text>
                </View>
                
                {certificates.map((cert: any) => (
                  <TouchableOpacity 
                    key={cert.id || cert._id} 
                    style={s.certificateCard}
                    onPress={() => handleViewCertificate(cert)}
                  >
                    <View style={s.certificateIconContainer}>
                      <Ionicons name="ribbon" size={32} color={colors.brand} />
                    </View>
                    <View style={s.certificateInfo}>
                      <Text style={s.certificateTitle}>
                        {cert.courseTitle || cert.course_title || 'Course Certificate'}
                      </Text>
                      <Text style={s.certificateSubtitle}>
                        Issued: {new Date(cert.issuedAt || cert.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                      {cert.credentialId && (
                        <Text style={s.certificateId}>ID: {cert.credentialId}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: typeof lightColors) {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: c.background 
    },
    loadingContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: 16, 
      paddingVertical: 40 
    },
    loadingText: { 
      fontSize: 16, 
      color: c.textSecondary 
    },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: c.border 
    },
    backButton: { 
      padding: 4 
    },
    headerTitle: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: c.text 
    },
    progressCard: { 
      backgroundColor: c.cardContent, 
      margin: 20, 
      padding: 20, 
      borderRadius: 12,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    progressHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 16 
    },
    levelBadge: { 
      backgroundColor: c.brandLight, 
      paddingHorizontal: 14, 
      paddingVertical: 6, 
      borderRadius: 16 
    },
    levelText: { 
      color: c.brand, 
      fontSize: 13, 
      fontWeight: '700' 
    },
    pointsText: { 
      fontSize: 14, 
      color: c.textSecondary 
    },
    progressBar: { 
      width: '100%', 
      height: 8, 
      backgroundColor: c.borderMid, 
      borderRadius: 4, 
      overflow: 'hidden', 
      marginBottom: 8 
    },
    progressFill: { 
      height: '100%', 
      backgroundColor: c.success 
    },
    progressInfo: { 
      fontSize: 13, 
      color: c.textSecondary, 
      textAlign: 'center', 
      marginBottom: 20 
    },
    statsGrid: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingTop: 20, 
      borderTopWidth: 1, 
      borderTopColor: c.borderMid 
    },
    statItem: { 
      alignItems: 'center', 
      flex: 1 
    },
    statNumber: { 
      fontSize: 28, 
      fontWeight: '700', 
      color: c.text, 
      marginBottom: 4 
    },
    statLabel: { 
      fontSize: 12, 
      color: c.textSecondary, 
      textAlign: 'center' 
    },
    tabsContainer: { 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      marginBottom: 4 
    },
    tabs: { 
      flexDirection: 'row', 
      backgroundColor: c.backgroundMuted, 
      padding: 4, 
      borderRadius: 8 
    },
    tab: { 
      flex: 1, 
      paddingVertical: 12, 
      paddingHorizontal: 8, 
      alignItems: 'center', 
      borderRadius: 6 
    },
    tabActive: { 
      backgroundColor: c.card, 
      shadowColor: c.shadow, 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 3, 
      elevation: 2 
    },
    tabText: { 
      fontSize: 13, 
      fontWeight: '500', 
      color: c.textSecondary 
    },
    tabTextActive: { 
      color: c.brand, 
      fontWeight: '600' 
    },
    listContainer: { 
      paddingHorizontal: 20 
    },
    emptyState: { 
      alignItems: 'center', 
      paddingVertical: 48, 
      gap: 8 
    },
    emptyText: { 
      fontSize: 15, 
      fontWeight: '600', 
      color: c.textMuted 
    },
    emptySubText: { 
      fontSize: 13, 
      color: c.textLight, 
      textAlign: 'center' 
    },
    achievementItem: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      marginBottom: 20, 
      gap: 12 
    },
    achievementIcon: { 
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      backgroundColor: c.brandLighter, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    achievementContent: { 
      flex: 1 
    },
    achievementTitle: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: c.text, 
      marginBottom: 4 
    },
    achievementDescription: { 
      fontSize: 13, 
      color: c.textSecondary, 
      marginBottom: 4, 
      lineHeight: 18 
    },
    achievementDate: { 
      fontSize: 12, 
      color: c.success 
    },
    pointsBadge: { 
      backgroundColor: c.success, 
      paddingHorizontal: 10, 
      paddingVertical: 4, 
      borderRadius: 12 
    },
    pointsBadgeText: { 
      color: 'white', 
      fontSize: 12, 
      fontWeight: '600' 
    },
    badgesGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 12 
    },
    badgeCard: { 
      width: '46%', 
      backgroundColor: c.cardContent, 
      borderRadius: 12, 
      padding: 16, 
      alignItems: 'center', 
      gap: 8,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    badgeIconWrapper: { 
      width: 64, 
      height: 64, 
      borderRadius: 32, 
      backgroundColor: c.brandLighter, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    badgeLabel: { 
      fontSize: 12, 
      fontWeight: '700', 
      color: c.brand, 
      textAlign: 'center' 
    },
    badgeDate: { 
      fontSize: 11, 
      color: c.textMuted, 
      textAlign: 'center' 
    },
    certificatesList: { 
      paddingVertical: 8 
    },
    certCountContainer: { 
      marginBottom: 16 
    },
    certCountText: { 
      fontSize: 14, 
      color: c.textSecondary 
    },
    certificateCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 16, 
      backgroundColor: c.cardContent, 
      borderRadius: 12, 
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    certificateIconContainer: { 
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      backgroundColor: c.brandLighter, 
      alignItems: 'center', 
      justifyContent: 'center',
      marginRight: 12,
    },
    certificateInfo: { 
      flex: 1 
    },
    certificateTitle: { 
      fontSize: 15, 
      fontWeight: '600', 
      color: c.text, 
      marginBottom: 2 
    },
    certificateSubtitle: { 
      fontSize: 12, 
      color: c.textSecondary 
    },
    certificateId: { 
      fontSize: 11, 
      color: c.textMuted, 
      marginTop: 2 
    },
    completedCoursesInfo: { 
      marginTop: 16, 
      padding: 16, 
      backgroundColor: c.successLight || '#F0FDF4', 
      borderRadius: 8, 
      width: '100%' 
    },
    completedCoursesTitle: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: c.text, 
      marginBottom: 8 
    },
    completedCourseItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8, 
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border || '#E5E7EB',
    },
    completedCourseName: { 
      fontSize: 13, 
      color: c.textSecondary,
      flex: 1,
    },
    pendingBadge: {
      backgroundColor: c.warningLight || '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pendingBadgeText: {
      color: c.warning || '#D97706',
      fontSize: 11,
      fontWeight: '600',
    },
    certificatePendingText: { 
      fontSize: 12, 
      color: c.warning || '#F59E0B', 
      marginTop: 8, 
      fontStyle: 'italic',
      textAlign: 'center',
    },
    browseButton: { 
      backgroundColor: c.brand, 
      paddingHorizontal: 24, 
      paddingVertical: 12, 
      borderRadius: 8, 
      marginTop: 16 
    },
    browseButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
    startButton: { 
      backgroundColor: c.brand, 
      paddingHorizontal: 24, 
      paddingVertical: 12, 
      borderRadius: 8, 
      marginTop: 16 
    },
    startButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
  });
}