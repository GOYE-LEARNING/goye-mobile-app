// services/shekiAiApi.ts
//
// Client for GOYE's course-draft / mentor-match proxy routes (which call
// ShekiAI server-to-server) — the mobile equivalent of the web app's
// utils/ai/courseDraftApi.ts + mentorMatchApi.ts. Voice was dropped from
// this feature everywhere (web included), so this is text + document only.
import { fetchWithAuth } from './apiClient';

export interface ApiResponse<T = any> {
  message: string;
  data: T[];
  status: number;
  error: string[];
}

async function call(base: 'course-draft' | 'mentor-match', path: string, options: RequestInit = {}): Promise<ApiResponse> {
  const response = await fetchWithAuth(`/${base}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

// ─── Course draft (tutor/instructor) ──────────────────────────────────────

export const startCourseDraft = (message?: string) =>
  call('course-draft', '/start', { method: 'POST', body: JSON.stringify({ message }) });

export const sendCourseDraftMessage = (sessionId: string, message: string) =>
  call('course-draft', `/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ message }) });

export const finalizeCourseDraft = (sessionId: string) =>
  call('course-draft', `/${sessionId}/finalize`, { method: 'POST' });

export const abandonCourseDraft = (sessionId: string) =>
  call('course-draft', `/${sessionId}/abandon`, { method: 'POST' });

export const sendCourseDraftDocument = (sessionId: string, file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  form.append('document', { uri: file.uri, name: file.name, type: file.type } as any);
  return call('course-draft', `/${sessionId}/document`, { method: 'POST', body: form });
};

// ─── Mentor match (student) ────────────────────────────────────────────────

export const startMentorMatch = (message?: string) =>
  call('mentor-match', '/start', { method: 'POST', body: JSON.stringify({ message }) });

export const sendMentorMatchMessage = (sessionId: string, message: string) =>
  call('mentor-match', `/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ message }) });

export const abandonMentorMatch = (sessionId: string) =>
  call('mentor-match', `/${sessionId}/abandon`, { method: 'POST' });

export const sendMentorMatchDocument = (sessionId: string, file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  form.append('document', { uri: file.uri, name: file.name, type: file.type } as any);
  return call('mentor-match', `/${sessionId}/document`, { method: 'POST', body: form });
};
