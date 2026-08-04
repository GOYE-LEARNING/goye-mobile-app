// hooks/useShekiAI.ts
//
// Mobile port of the web app's app/hook/useShekiAI.ts. Voice was dropped
// from this feature everywhere (including web), and there's no live-progress
// socket here either — each call already returns its final result, so a
// local "thinking" flag while the request is in flight is enough.
import { useCallback, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getFriendlyErrorMessage } from '@/utils/errorMessages';
import {
  abandonCourseDraft,
  finalizeCourseDraft,
  sendCourseDraftDocument,
  sendCourseDraftMessage,
  startCourseDraft,
} from '@/services/shekiAiApi';
import {
  abandonMentorMatch,
  sendMentorMatchDocument,
  sendMentorMatchMessage,
  startMentorMatch,
} from '@/services/shekiAiApi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  // Only set on the assistant reply from the turn that actually ran a fresh
  // search_tutors/search_courses/search_groups — lets the panel show real,
  // clickable candidates right where they were found instead of leaving
  // them as plain prose.
  tutorCandidates?: TutorCandidate[];
  courseCandidates?: CourseCandidate[];
  groupCandidates?: GroupCandidate[];
}

export interface TutorCandidate {
  id: string;
  name: string;
  bio: string | null;
  church_role: string | null;
  courses: { id: string; title: string }[];
}

export interface CourseCandidate {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
}

export interface GroupCandidate {
  id: string;
  title: string;
  description: string | null;
  memberCount: number;
}

export type AssistantStatus = 'idle' | 'thinking' | 'awaiting_approval' | 'matched' | 'error';

export type AssistantMode = 'tutor' | 'student';

export interface MatchedTutor {
  id: string;
  name: string;
  reason: string;
}

function statusFor(backendStatus: string): AssistantStatus {
  if (backendStatus === 'AWAITING_APPROVAL') return 'awaiting_approval';
  if (backendStatus === 'MATCHED') return 'matched';
  return 'idle';
}

export function useShekiAI(mode: AssistantMode = 'tutor') {
  const isStudent = mode === 'student';
  const { user } = useUser();
  const tutorName = user?.first_name || 'there';

  const [matchedTutor, setMatchedTutor] = useState<MatchedTutor | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // See web's useShekiAI.ts for why this de-dupes: every turn's result
  // carries the full persisted state, so without this we'd re-attach the
  // same stale cards to every unrelated reply after the actual search. One
  // tracker per candidate kind, since a single turn can run more than one
  // search (e.g. both search_courses and search_groups).
  function useCandidateTracker<T extends { id: string }>(stateKey: 'candidates' | 'courseCandidates' | 'groupCandidates') {
    const lastIds = useRef<string>('');
    const tracker = useCallback(
      (state: any): T[] | undefined => {
        const candidates: T[] | undefined = state?.[stateKey];
        if (!candidates?.length) return undefined;
        const ids = candidates.map((c) => c.id).sort().join(',');
        if (ids === lastIds.current) return undefined;
        lastIds.current = ids;
        return candidates;
      },
      [stateKey],
    );
    const reset = useCallback(() => {
      lastIds.current = '';
    }, []);
    return [tracker, reset] as const;
  }
  const [candidatesForTurn, resetTutorCandidates] = useCandidateTracker<TutorCandidate>('candidates');
  const [courseCandidatesForTurn, resetCourseCandidates] = useCandidateTracker<CourseCandidate>('courseCandidates');
  const [groupCandidatesForTurn, resetGroupCandidates] = useCandidateTracker<GroupCandidate>('groupCandidates');

  const start = useCallback(
    async (initialMessage?: string) => {
      setIsStarting(true);
      setError(null);
      try {
        const res = isStudent ? await startMentorMatch(initialMessage) : await startCourseDraft(initialMessage);
        const result = res.data[0];
        setSessionId(result.sessionId);
        if (!isStudent) setCourseTitle(result.draft?.course_title || null);
        if (result.matchedTutor) setMatchedTutor(result.matchedTutor);
        const tutorCandidates = isStudent ? candidatesForTurn(result.state) : undefined;
        const courseCandidates = isStudent ? courseCandidatesForTurn(result.state) : undefined;
        const groupCandidates = isStudent ? groupCandidatesForTurn(result.state) : undefined;
        setMessages(
          initialMessage
            ? [
                { id: `u-${Date.now()}`, role: 'user', content: initialMessage },
                { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates, courseCandidates, groupCandidates },
              ]
            : [{ id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates, courseCandidates, groupCandidates }],
        );
        setStatus(statusFor(result.status));
        return result;
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'starting that conversation'));
        setStatus('error');
      } finally {
        setIsStarting(false);
      }
    },
    [isStudent, candidatesForTurn, courseCandidatesForTurn, groupCandidatesForTurn],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) return start(text);
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
      setStatus('thinking');
      setError(null);
      try {
        const res = isStudent ? await sendMentorMatchMessage(sessionId, text) : await sendCourseDraftMessage(sessionId, text);
        const result = res.data[0];
        if (!isStudent) setCourseTitle(result.draft?.course_title || null);
        if (result.matchedTutor) setMatchedTutor(result.matchedTutor);
        const tutorCandidates = isStudent ? candidatesForTurn(result.state) : undefined;
        const courseCandidates = isStudent ? courseCandidatesForTurn(result.state) : undefined;
        const groupCandidates = isStudent ? groupCandidatesForTurn(result.state) : undefined;
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates, courseCandidates, groupCandidates }]);
        setStatus(statusFor(result.status));
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'sending that message'));
        setStatus('error');
      }
    },
    [sessionId, start, isStudent, candidatesForTurn, courseCandidatesForTurn, groupCandidatesForTurn],
  );

  const sendDocument = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      if (!sessionId) return;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: `📄 Shared "${file.name}"` }]);
      setStatus('thinking');
      setError(null);
      try {
        const res = isStudent ? await sendMentorMatchDocument(sessionId, file) : await sendCourseDraftDocument(sessionId, file);
        const result = res.data[0];
        if (!isStudent) setCourseTitle(result.draft?.course_title || null);
        if (result.matchedTutor) setMatchedTutor(result.matchedTutor);
        const tutorCandidates = isStudent ? candidatesForTurn(result.state) : undefined;
        const courseCandidates = isStudent ? courseCandidatesForTurn(result.state) : undefined;
        const groupCandidates = isStudent ? groupCandidatesForTurn(result.state) : undefined;
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates, courseCandidates, groupCandidates }]);
        setStatus(statusFor(result.status));
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'sharing that document'));
        setStatus('error');
      }
    },
    [sessionId, isStudent, candidatesForTurn, courseCandidatesForTurn, groupCandidatesForTurn],
  );

  const finalize = useCallback(async () => {
    if (!sessionId) return null;
    const res = await finalizeCourseDraft(sessionId);
    return res.data[0]?.courseId as string | undefined;
  }, [sessionId]);

  const abandon = useCallback(async () => {
    if (!sessionId) return;
    if (isStudent) await abandonMentorMatch(sessionId);
    else await abandonCourseDraft(sessionId);
    setSessionId(null);
    setMessages([]);
    setCourseTitle(null);
    setMatchedTutor(null);
    setStatus('idle');
    resetTutorCandidates();
    resetCourseCandidates();
    resetGroupCandidates();
  }, [sessionId, isStudent, resetTutorCandidates, resetCourseCandidates, resetGroupCandidates]);

  return {
    tutorName,
    matchedTutor,
    sessionId,
    messages,
    status,
    courseTitle,
    isStarting,
    error,
    start,
    sendMessage,
    sendDocument,
    finalize,
    abandon,
  };
}
