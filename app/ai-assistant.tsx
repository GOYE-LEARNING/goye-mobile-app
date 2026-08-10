// app/ai-assistant.tsx
//
// Mobile port of the web app's ShekiAI assistant panel (course-drafting for
// tutors, mentor-matching for students). Voice was dropped from this feature
// everywhere, so this is text + document upload only, presented as a modal
// reachable from the floating trigger mounted at the root layout.
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { ChatMessage, CourseCandidate, GroupCandidate, TutorCandidate, useShekiAI } from '@/hooks/useShekiAI';
import ShekiAIOrb from '@/components/ShekiAIOrb';

const ACCENT = '#FFA500';
const ACCENT_GRADIENT: [string, string] = ['#FBB041', '#FFA500'];

// labelKey only — the prompt text is what actually gets sent to the AI as
// the user's message, and stays in English regardless of app language. The
// model reasons more reliably in English; only the button the user sees
// needs to be translated. Chat replies from the AI itself are a separate,
// much bigger problem (the model would need to be told to reply in the
// user's language) and aren't covered by this.
const TUTOR_QUICK_ACTIONS = [
  { labelKey: 'aiAssistant.quickActions.createCourse', prompt: "I'd like to create a new course. Can you help me plan it out?" },
  { labelKey: 'aiAssistant.quickActions.giveIdeas', prompt: "I'm not sure what to teach yet — can you suggest some course ideas?" },
  { labelKey: 'aiAssistant.quickActions.addQuiz', prompt: "Let's add a quiz to test what students have learned." },
  { labelKey: 'aiAssistant.quickActions.reviewDraft', prompt: "Can you show me what we've built so far?" },
];

const STUDENT_QUICK_ACTIONS = [
  { labelKey: 'aiAssistant.quickActions.findMentor', prompt: "I'd like to find a mentor who can guide me." },
  { labelKey: 'aiAssistant.quickActions.growSpiritually', prompt: 'I want to grow spiritually — can you connect me with someone who can help?' },
  { labelKey: 'aiAssistant.quickActions.strugglingHelp', prompt: "I'm struggling with something and could use someone to talk to and learn from." },
  { labelKey: 'aiAssistant.quickActions.learnSkill', prompt: 'I want to learn a new skill — who on GOYE could teach me?' },
];

// Reveals assistant text a chunk at a time rather than dumping it all at
// once — chunked so a long reply still finishes in roughly the same time
// regardless of length, instead of a fixed per-character delay.
function TypingText({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= text.length) {
      onDone();
      return;
    }
    const step = Math.max(1, Math.round(text.length / 60));
    const id = setTimeout(() => setShown((s) => Math.min(text.length, s + step)), 18);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, text]);

  return <Text style={{ color }}>{text.slice(0, shown)}</Text>;
}

function TutorCandidateCards({
  candidates,
  colors,
  onPick,
  onOpenCourse,
}: {
  candidates: TutorCandidate[];
  colors: any;
  onPick: (tutor: TutorCandidate) => void;
  onOpenCourse: (courseId: string) => void;
}) {
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      {candidates.map((tutor) => (
        <View key={tutor.id} style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={() => onPick(tutor)} style={cardStyles.tutorRow}>
            <LinearGradient colors={ACCENT_GRADIENT} style={cardStyles.avatar}>
              <Ionicons name="school" size={16} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={1}>{tutor.name}</Text>
              {!!tutor.church_role && (
                <Text style={[cardStyles.role, { color: colors.textMuted }]} numberOfLines={1}>{tutor.church_role}</Text>
              )}
              {!!tutor.bio && (
                <Text style={[cardStyles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{tutor.bio}</Text>
              )}
            </View>
          </Pressable>
          {tutor.courses.length > 0 && (
            <View style={cardStyles.chipRow}>
              {tutor.courses.slice(0, 3).map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() => onOpenCourse(course.id)}
                  style={[cardStyles.chip, { backgroundColor: `${ACCENT}26` }]}
                >
                  <Text style={[cardStyles.chipText, { color: ACCENT }]} numberOfLines={1}>{course.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function CourseCandidateCards({
  candidates,
  colors,
  onOpen,
}: {
  candidates: CourseCandidate[];
  colors: any;
  onOpen: (courseId: string) => void;
}) {
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      {candidates.map((course) => (
        <Pressable
          key={course.id}
          onPress={() => onOpen(course.id)}
          style={[cardStyles.card, cardStyles.tutorRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient colors={ACCENT_GRADIENT} style={cardStyles.avatar}>
            <Ionicons name="school-outline" size={16} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={1}>{course.title}</Text>
            {!!course.level && (
              <Text style={[cardStyles.role, { color: colors.textMuted }]} numberOfLines={1}>{course.level}</Text>
            )}
            {!!course.description && (
              <Text style={[cardStyles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{course.description}</Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function GroupCandidateCards({
  candidates,
  colors,
  onOpen,
}: {
  candidates: GroupCandidate[];
  colors: any;
  onOpen: (groupId: string) => void;
}) {
  return (
    <View style={{ gap: 8, marginTop: 4 }}>
      {candidates.map((group) => (
        <Pressable
          key={group.id}
          onPress={() => onOpen(group.id)}
          style={[cardStyles.card, cardStyles.tutorRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient colors={ACCENT_GRADIENT} style={cardStyles.avatar}>
            <Ionicons name="people-outline" size={16} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={1}>{group.title}</Text>
            <Text style={[cardStyles.role, { color: colors.textMuted }]} numberOfLines={1}>
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
            {!!group.description && (
              <Text style={[cardStyles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{group.description}</Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isInstructor } = useUser();
  const mode = isInstructor ? 'tutor' : 'student';
  const isStudent = mode === 'student';
  const QUICK_ACTIONS = isStudent ? STUDENT_QUICK_ACTIONS : TUTOR_QUICK_ACTIONS;

  const {
    tutorName,
    matchedTutor,
    sessionId,
    messages,
    status,
    isStarting,
    error,
    start,
    sendMessage,
    sendDocument,
    finalize,
  } = useShekiAI(mode);

  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizedCourseId, setFinalizedCourseId] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);
  const animatedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const handleSend = async () => {
    const value = input.trim();
    if (isStarting || isUploadingDoc) return;

    if (pendingFile) {
      const file = pendingFile;
      setPendingFile(null);
      setInput('');
      setIsUploadingDoc(true);
      try {
        await sendDocument(file);
        if (value) await sendMessage(value);
      } finally {
        setIsUploadingDoc(false);
      }
      return;
    }

    if (!value) return;
    setInput('');
    await sendMessage(value);
  };

  const handleQuickAction = (prompt: string) => {
    if (!sessionId) start(prompt);
    else sendMessage(prompt);
  };

  const handleAttach = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPendingFile({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
  };

  // Clicking a candidate doesn't fake a navigation — it asks the assistant
  // to actually propose the match, so the real propose_match tool call (and
  // the notification/chat it opens) still happens on the backend.
  const handlePickTutor = (tutor: TutorCandidate) => {
    sendMessage(`I'd like to connect with ${tutor.name}.`);
  };

  // replace, not push: this screen is itself a modal on the root Stack.
  // Pushing the destination on top of it left the modal underneath in the
  // back-stack (Home -> AI modal -> Course), so pressing back tried to
  // re-enter the modal instead of returning to Home and broke navigation.
  // Replacing swaps the modal out for the destination directly, so back
  // goes to wherever the user actually was before opening the assistant.
  const handleOpenCourse = (courseId: string) => {
    router.replace({ pathname: '/(tabs)/courses/[id]/overview', params: { id: courseId } });
  };

  const handleOpenGroup = (groupId: string) => {
    router.replace({ pathname: '/(tabs)/community/[groupId]', params: { groupId } });
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const courseId = await finalize();
      if (courseId) setFinalizedCourseId(courseId);
    } finally {
      setIsFinalizing(false);
    }
  };

  const showGreeting = messages.length === 0 && !sessionId;

  const renderMessage = ({ item: m }: { item: ChatMessage }) => {
    const alreadyAnimated = animatedIds.current.has(m.id);
    const isUser = m.role === 'user';
    return (
      <View style={{ marginBottom: 10 }}>
        <View style={[msgStyles.row, isUser ? msgStyles.rowUser : msgStyles.rowAssistant]}>
          {!isUser && (
            <View style={msgStyles.orb}>
              <ShekiAIOrb size={24} />
            </View>
          )}
          <View
            style={[
              msgStyles.bubble,
              isUser
                ? { backgroundColor: ACCENT, borderBottomRightRadius: 4 }
                : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
            ]}
          >
            {isUser || alreadyAnimated ? (
              <Text style={{ color: isUser ? '#fff' : colors.text }}>{m.content}</Text>
            ) : (
              <TypingText text={m.content} color={colors.text} onDone={() => animatedIds.current.add(m.id)} />
            )}
          </View>
        </View>
        {!isUser && m.tutorCandidates && (
          <View style={{ marginLeft: 34 }}>
            <TutorCandidateCards
              candidates={m.tutorCandidates}
              colors={colors}
              onPick={handlePickTutor}
              onOpenCourse={handleOpenCourse}
            />
          </View>
        )}
        {!isUser && m.courseCandidates && (
          <View style={{ marginLeft: 34 }}>
            <CourseCandidateCards candidates={m.courseCandidates} colors={colors} onOpen={handleOpenCourse} />
          </View>
        )}
        {!isUser && m.groupCandidates && (
          <View style={{ marginLeft: 34 }}>
            <GroupCandidateCards candidates={m.groupCandidates} colors={colors} onOpen={handleOpenGroup} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <ShekiAIOrb size={28} active={status === 'thinking'} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>ShekiAI</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showGreeting ? (
          <View style={styles.greeting}>
            <ShekiAIOrb size={110} active={isStarting} />
            <Text style={[styles.greetingTitle, { color: colors.text, marginTop: 20 }]}>{t('aiAssistant.greeting', { name: tutorName })}</Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]}>
              {isStudent ? t('aiAssistant.studentSubtitle') : t('aiAssistant.tutorSubtitle')}
            </Text>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.labelKey}
                  onPress={() => handleQuickAction(action.prompt)}
                  disabled={isStarting}
                  style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.quickActionText, { color: colors.text }]}>{t(action.labelKey)}</Text>
                </Pressable>
              ))}
            </View>
            {isStarting && <ActivityIndicator color={ACCENT} style={{ marginTop: 16 }} />}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              <>
                {(status === 'thinking' || isUploadingDoc) && (
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={ACCENT} />
                    <Text style={{ color: colors.textMuted, marginLeft: 8 }}>
                      {isUploadingDoc ? t('aiAssistant.readingDocument') : t('aiAssistant.thinking')}
                    </Text>
                  </View>
                )}
                {!!error && <Text style={{ color: '#E53E3E', marginTop: 4 }}>{error}</Text>}
                {!isStudent && status === 'awaiting_approval' && !finalizedCourseId && (
                  <View style={[styles.banner, { backgroundColor: `${ACCENT}1A`, borderColor: `${ACCENT}66` }]}>
                    <Text style={[styles.bannerText, { color: colors.text }]}>
                      {t('aiAssistant.draftReady')}
                    </Text>
                    <Pressable onPress={handleFinalize} disabled={isFinalizing} style={styles.bannerBtn}>
                      <Text style={styles.bannerBtnText}>{isFinalizing ? t('aiAssistant.creating') : t('aiAssistant.createIt')}</Text>
                    </Pressable>
                  </View>
                )}
                {finalizedCourseId && (
                  <View style={[styles.banner, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.4)' }]}>
                    <Text style={[styles.bannerText, { color: colors.text }]}>
                      {t('aiAssistant.courseCreated')}
                    </Text>
                  </View>
                )}
                {isStudent && matchedTutor && (
                  <View style={[styles.banner, { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.4)' }]}>
                    <Text style={[styles.bannerText, { color: colors.text }]}>
                      {t('aiAssistant.matchedNotified', { name: matchedTutor.name })}
                    </Text>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(tabs)/community/chat/[userId]', params: { userId: matchedTutor.id } })}
                      style={styles.bannerBtn}
                    >
                      <Text style={styles.bannerBtnText}>{t('aiAssistant.openChat')}</Text>
                    </Pressable>
                  </View>
                )}
              </>
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          {pendingFile && (
            <View style={[styles.fileChip, { backgroundColor: colors.backgroundMuted }]}>
              <Ionicons name="document-text" size={16} color={ACCENT} />
              <Text style={[styles.fileChipText, { color: colors.text }]} numberOfLines={1}>{pendingFile.name}</Text>
              <Pressable onPress={() => setPendingFile(null)} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
          <View style={styles.inputRow}>
            <Pressable onPress={handleAttach} disabled={!sessionId || isUploadingDoc} hitSlop={8}>
              <Ionicons name="attach" size={22} color={sessionId ? colors.textSecondary : colors.textMuted} />
            </Pressable>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundMuted }]}
              placeholder={pendingFile ? t('aiAssistant.documentCaption') : t('aiAssistant.askAnything')}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              editable={!isUploadingDoc}
              multiline
              onSubmitEditing={handleSend}
            />
            {(input.trim() || pendingFile) && (
              <Pressable onPress={handleSend} disabled={isUploadingDoc} style={[styles.sendBtn, { backgroundColor: ACCENT }]}>
                <Ionicons name="send" size={16} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  greeting: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  greetingTitle: { fontSize: 20, fontWeight: '600' },
  greetingSubtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28, justifyContent: 'center' },
  quickAction: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, width: '46%' },
  quickActionText: { fontSize: 13, textAlign: 'center' },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 4 },
  banner: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 10, gap: 8 },
  bannerText: { fontSize: 13 },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  bannerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, padding: 10, gap: 8 },
  fileChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  fileChipText: { flex: 1, fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, fontSize: 14 },
  sendBtn: { height: 36, width: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

const msgStyles = StyleSheet.create({
  row: { flexDirection: 'row', maxWidth: '85%' },
  rowUser: { alignSelf: 'flex-end' },
  rowAssistant: { alignSelf: 'flex-start' },
  orb: { height: 24, width: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 2 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexShrink: 1 },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  tutorRow: { flexDirection: 'row', gap: 10 },
  avatar: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  role: { fontSize: 12 },
  bio: { fontSize: 12, marginTop: 3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 44 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, maxWidth: 150 },
  chipText: { fontSize: 11 },
});
