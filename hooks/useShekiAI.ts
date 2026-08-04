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
  // tutor search — lets the panel show real, clickable candidates right
  // where they were found instead of leaving them as plain prose.
  tutorCandidates?: TutorCandidate[];
}

export interface TutorCandidate {
  id: string;
  name: string;
  bio: string | null;
  church_role: string | null;
  courses: { id: string; title: string }[];
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
  // same stale cards to every unrelated reply after the actual search.
  const lastCandidateIds = useRef<string>('');
  const candidatesForTurn = useCallback((state: any): TutorCandidate[] | undefined => {
    const candidates: TutorCandidate[] | undefined = state?.candidates;
    if (!candidates?.length) return undefined;
    const ids = candidates.map((c) => c.id).sort().join(',');
    if (ids === lastCandidateIds.current) return undefined;
    lastCandidateIds.current = ids;
    return candidates;
  }, []);

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
        setMessages(
          initialMessage
            ? [
                { id: `u-${Date.now()}`, role: 'user', content: initialMessage },
                { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates },
              ]
            : [{ id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates }],
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
    [isStudent, candidatesForTurn],
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
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates }]);
        setStatus(statusFor(result.status));
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'sending that message'));
        setStatus('error');
      }
    },
    [sessionId, start, isStudent, candidatesForTurn],
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
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: result.assistantReply, tutorCandidates }]);
        setStatus(statusFor(result.status));
      } catch (e: any) {
        setError(getFriendlyErrorMessage(e, 'sharing that document'));
        setStatus('error');
      }
    },
    [sessionId, isStudent, candidatesForTurn],
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
    lastCandidateIds.current = '';
  }, [sessionId, isStudent]);

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
