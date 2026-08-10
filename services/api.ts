// services/api.ts
import { API_CONFIG } from '@/constants/config';
import { fetchWithAuth, apiCall } from './apiClient';

interface ApiResponse<T> {
  message: string;
  data: T;
}

// ─── Course APIs ──────────────────────────────────────────────────────────────

/**
 * Get course details by ID
 */
export const getCourse = async (courseId: string, token?: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/course/get-course/${courseId}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

/**
 * Get all courses
 */
export const getCourses = async (token?: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetchWithAuth('/course/get-courses', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

/**
 * Create a new course
 */
export const createCourse = async (courseData: any, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/course/create-course', {
      method: 'POST',
      body: JSON.stringify(courseData),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Update a course
 */
export const updateCourse = async (courseId: string, courseData: any, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/course/update-course/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

/**
 * Delete a Course
 */
export const deleteCourse = async (courseId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/course/delete-course/${courseId}`, {
      method: 'DELETE',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

/**
 * Complete a lesson - marks lesson as completed for the user
 * POST /course/complete-lesson/{courseId}/{lessonId}
 */
export const completeLesson = async (
  token: string,
  courseId: string,
  lessonId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/course/complete-lesson/${courseId}/${lessonId}`, {
      method: 'POST',
    }, token);
    
    const result = await response.json();
    console.log('[Lesson] complete-lesson:', result?.message);
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
};

// ─── Social/Group APIs ──────────────────────────────────────────────────────

interface CreatePostData {
  postId?: string;
  title: string;
  content: string;
}

/**
 * Create a new Forum post
 */
export const createPost = async (courseId: string, postData: CreatePostData, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/create-post/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(postData),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

interface CreateGroupData {
  group_title: string;
  group_short_description: string;
  group_description: string;
  group_image: string;
}

/**
 * Create Group
 */
export const createGroup = async (groupData: CreateGroupData, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/socials/create-group', {
      method: 'POST',
      body: JSON.stringify(groupData),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * Get all groups
 */
export const getGroups = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetchWithAuth('/socials/get-groups', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

/**
 * Get a specific group
 */
export const getGroup = async (groupId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/get-group/${groupId}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

/**
 * Delete a Group
 */
export const deleteGroup = async (groupId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/delete-group/${groupId}`, {
      method: 'DELETE',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

/**
 * Join Group
 */
export const joinGroup = async (groupId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/join-group/${groupId}`, {
      method: 'POST',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

/**
 * Exit Group
 */
export const exitGroup = async (groupId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/exit-group/${groupId}`, {
      method: 'DELETE',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error exiting group:', error);
    throw error;
  }
};

// ─── Event APIs ──────────────────────────────────────────────────────────────

interface CreateEventData {
  event_name: string;
  event_description: string;
  event_time: string;
  event_date: string;
  event_type: string;
  event_link: string;
}

/**
 * Create Event for a Group
 */
export const createEvent = async (groupId: string, eventData: CreateEventData, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/socials/create-event/${groupId}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get All Events
 */
export const getEvents = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetchWithAuth('/socials/get-event', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Get Events For A Specific Group
 */
export const getGroupEvents = async (groupId: string, token: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetchWithAuth(`/socials/get-group-event/${groupId}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching group events:', error);
    throw error;
  }
};

/**
 * Get student group events
 */
export const getStudentGroupEvents = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/socials/fetch-event-by-the-student-group', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    if (__DEV__) console.log('[Events] student group events:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching student group events:', error);
    throw error;
  }
};

// ─── User APIs ───────────────────────────────────────────────────────────────

/**
 * Get individual user profile
 */
export const getUserProfile = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/user/profile', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Upload profile picture
 * POST /user/upload-profile-picture
 */
export const uploadProfilePicture = async (
  token: string,
  file: { mimeType: string; fileName: string; file: string }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/user/upload-profile-picture', {
      method: 'POST',
      body: JSON.stringify(file),
    }, token);
    
    const result = await response.json();
    console.log('[Profile] upload-profile-picture:', result?.message);
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Update user profile
 * PUT /user/update-user
 */
export const updateUser = async (
  token: string,
  data: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    country?: string;
    state?: string;
  }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/user/update-user', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
    
    const result = await response.json();
    console.log('[Profile] update-user:', result?.message);
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// ─── Organization APIs ──────────────────────────────────────────────────────

/**
 * Get organization profile
 */
export const getOrganizationProfile = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/organizations/profile', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    throw error;
  }
};

/**
 * Update organization profile
 */
export const updateOrganizationProfile = async (
  token: string,
  orgId: string,
  data: any
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/organizations/update-organization/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      if (__DEV__) console.error('📥 Update error body:', JSON.stringify(result, null, 2));
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating organization profile:', error);
    throw error;
  }
};

/**
 * Invite users to organization
 */
export const inviteUsersToOrganization = async (
  token: string,
  organizationId: string,
  sentByUserId: string,
  users: { email: string; role: string }[]
): Promise<any> => {
  try {
    const payload = { users };

    const response = await fetchWithAuth(`/organizations/invite-users-to-organization/${organizationId}/${sentByUserId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);

    const result = await response.json();
    if (__DEV__) console.log('📥 Invite response status:', response.status, JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error inviting users to organization:', error);
    throw error;
  }
};

/**
 * Organization member roster. No single backend route returns a member list
 * with names/emails, so this composes /fetch-specific-organization/{id}
 * (roster: userId/role/joinedAt) with /user-details/{userId} (name/email)
 * for each member.
 */
export const getOrgMembers = async (organizationId: string, token: string): Promise<any> => {
  const orgResponse = await fetchWithAuth(`/organizations/fetch-specific-organization/${organizationId}`, { method: 'GET' }, token);
  const orgResult = await orgResponse.json();
  if (!orgResponse.ok) throw new Error(orgResult.message || 'Failed to fetch organization');

  const roster = (orgResult.data?.members || []).filter((m: any) => m.isActive);

  const members = await Promise.all(
    roster.map(async (member: any) => {
      try {
        const detailResponse = await fetchWithAuth(`/organizations/user-details/${member.userId}`, { method: 'GET' }, token);
        const detailResult = await detailResponse.json();
        if (!detailResponse.ok || detailResult.success === false) return null;
        return { ...member, user: detailResult.data };
      } catch {
        return null;
      }
    })
  );

  return { success: true, data: members.filter(Boolean) };
};

export const getOrgMemberDetail = async (userId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/user-details/${userId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch member detail');
  return result;
};

/**
 * GET /organizations/overview-stats/{organizationId}
 */
export const getOrgOverviewStats = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/overview-stats/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch organization overview stats');
  return result;
};

/**
 * GET /organizations/user-breakdown/{organizationId}
 */
export const getOrgUserBreakdown = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/user-breakdown/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch organization user breakdown');
  return result;
};

/**
 * GET /organizations/courses-with-stats/{organizationId}
 */
export const getOrgCoursesWithStats = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/courses-with-stats/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch organization courses');
  return result;
};

/**
 * GET /organizations/activities/{organizationId}
 */
export const getOrgActivities = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/activities/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch organization activities');
  return result;
};

/**
 * DELETE /organizations/members/{organizationId}/{userId}
 */
export const removeMember = async (organizationId: string, userId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/members/${organizationId}/${userId}`, { method: 'DELETE' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to remove member');
  return result;
};

/**
 * PUT /organizations/members/{organizationId}/{userId}/suspend
 */
export const suspendMember = async (organizationId: string, userId: string, suspend: boolean, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/members/${organizationId}/${userId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ suspend }),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to update member status');
  return result;
};

/**
 * POST /organizations/announcements/{organizationId}
 */
export const createOrgAnnouncement = async (
  organizationId: string,
  data: { title: string; message: string; audience: 'all' | 'students' | 'instructors' | 'specific'; targetUserIds?: string[] },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/announcements/${organizationId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to create announcement');
  return result;
};

/**
 * GET /organizations/announcements/{organizationId}
 */
export const getOrgAnnouncements = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/announcements/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch announcements');
  return result;
};

/**
 * POST /organizations/events/{organizationId}
 */
export const createOrgEvent = async (
  organizationId: string,
  data: { name: string; description: string; date: string; time: string; location?: string; capacity?: number; type: string },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/events/${organizationId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to create event');
  return result;
};

/**
 * GET /organizations/events/{organizationId}
 */
export const getOrgEvents = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/events/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch events');
  return result;
};

/**
 * PUT /organizations/events/{organizationId}/{eventId}
 */
export const updateOrgEvent = async (
  organizationId: string,
  eventId: string,
  data: { name?: string; description?: string; date?: string; time?: string; location?: string; capacity?: number; status?: string },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/events/${organizationId}/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to update event');
  return result;
};

/**
 * DELETE /organizations/events/{organizationId}/{eventId}
 */
export const deleteOrgEvent = async (organizationId: string, eventId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/events/${organizationId}/${eventId}`, { method: 'DELETE' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to delete event');
  return result;
};

/**
 * GET /organizations/invited-users/{organizationId}
 */
export const getInvitedUsers = async (organizationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/invited-users/${organizationId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch invited users');
  return result;
};

/**
 * POST /organizations/resend-invitation/{invitationId}
 */
export const resendInvitation = async (invitationId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/organizations/resend-invitation/${invitationId}`, { method: 'POST' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to resend invitation');
  return result;
};

// ─── Enrollment APIs ─────────────────────────────────────────────────────────

/**
 * Enroll Student in a course
 */
export const enrollInCourse = async (courseId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/enroll/student-enroll/${courseId}`, {
      method: 'POST',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

/**
 * Get courses enrolled by student
 */
export const getEnrolledCourses = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/enroll/get-courses-enrolled-by-student', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

/**
 * Fetch All Students
 */
export const getAllStudents = async (token: string): Promise<any> => {
  try {
    const response = await fetchWithAuth('/enroll/fetch-all-students', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Get student details
 */
export const getStudentDetails = async (studentId: string, token: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`/enroll/fetch-student-details/${studentId}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    const cleanForLogging = (obj: any): any => {
      if (!obj) return obj;
      if (typeof obj === 'string' && obj.length > 1000) return `[BASE64_IMAGE:${obj.length} chars]`;
      if (Array.isArray(obj)) return obj.map(item => cleanForLogging(item));
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if ((key === 'course_image' || key === 'profile_picture' || key.includes('image') || key.includes('pic')) && typeof obj[key] === 'string' && obj[key].length > 1000) {
            cleaned[key] = `[BASE64_IMAGE:${obj[key].length} chars]`;
          } else {
            cleaned[key] = cleanForLogging(obj[key]);
          }
        }
        return cleaned;
      }
      return obj;
    };

    console.log('📦 Cleaned student details:', JSON.stringify(cleanForLogging(result), null, 2));
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching student details:', error);
    throw error;
  }
};

// ─── Notification APIs ──────────────────────────────────────────────────────

/**
 * Get all notifications for user
 */
export const getUserNotifications = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/notifications/user', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Get notifications failed:', response.status, result);
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/notifications/unread-count', {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/notifications/read-all', {
      method: 'PUT',
    }, token);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

// ─── Growth APIs ─────────────────────────────────────────────────────────────

/**
 * Start the user's spiritual growth journey.
 * POST /growth/start-journey
 */
export const startGrowthJourney = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/growth/start-journey', {
      method: 'POST',
    }, token);

    const result = await response.json();
    if (__DEV__) console.log('[Growth] start-journey response:', JSON.stringify(result, null, 2));

    // Check if the response indicates the journey is already started
    if (result.message === "You have already started your journey!") {
      console.log('[Growth] Journey already started, returning existing data');
      return {
        success: true,
        message: result.message,
        data: result.data,
        alreadyStarted: true
      };
    }

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error starting growth journey:', error);
    throw error;
  }
};

/**
 * Fetch the user's growth progress by progressId.
 * GET /growth/fetch-growth-user
 */
export const getGrowthByProgressId = async (progressId: string, token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/growth/fetch-growth-user', {
      method: 'GET',
    }, token);

    const result = await response.json();
    if (__DEV__) console.log('[Growth] fetch-growth-user response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching growth data:', error);
    throw error;
  }
};

/**
 * Fetch all achievements for the current user
 * GET /growth/fetch-achivement
 */
export const getAchievements = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/growth/fetch-achivement', {
      method: 'GET',
    }, token);

    const result = await response.json();
    if (__DEV__) console.log('[Growth] fetch-achivement response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

// ─── Video Tracking APIs ─────────────────────────────────────────────────────

/**
 * Start tracking a video — call once on first play.
 * POST /video/track-video
 */
export const trackVideo = async (
  token: string,
  data: {
    courseId: string;
    lessonId: string;
    videoFinished: boolean;
    videoTrackTime: number;
  }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/video/track-video', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);

    const result = await response.json();
    console.log('[Video] track-video:', result?.message, '| id:', result?.data?.id);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error tracking video:', error);
    throw error;
  }
};

/**
 * Update video progress — call on pause, lesson switch, or screen leave.
 * PUT /video/update-track-video/{videoTrackerId}
 */
export const updateVideoTrack = async (
  token: string,
  videoTrackerId: string,
  data: {
    videoFinished: boolean;
    videoTrackTime: number;
  }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/video/update-track-video/${videoTrackerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);

    const result = await response.json();
    console.log('[Video] update-track-video:', result?.message);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error updating video track:', error);
    throw error;
  }
};

/**
 * Fetch saved progress for a tracker.
 * GET /video/fetch-track-video/{videoTrackerId}
 */
export const fetchVideoTrack = async (
  token: string,
  videoTrackerId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/video/fetch-track-video/${videoTrackerId}`, {
      method: 'GET',
    }, token);

    const result = await response.json();
    console.log('[Video] fetch-track-video:', result?.data);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching video track:', error);
    throw error;
  }
};

/**
 * Get existing tracker for a lesson (uses progressId from bearer token server-side).
 * GET /video/get-tracker-id/{lessonId}
 */
export const getTrackerByLesson = async (
  token: string,
  lessonId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(`/video/get-tracker-id/${lessonId}`, {
      method: 'GET',
    }, token);

    const result = await response.json();
    console.log('[Video] get-tracker-id:', result?.message, '| id:', result?.data?.id);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error getting tracker by lesson:', error);
    throw error;
  }
};

// ─── Certificate APIs ────────────────────────────────────────────────────────

/**
 * Generate a certificate for a completed course
 * POST /certificate/generate
 */
export const generateCertificate = async (
  token: string,
  data: {
    courseId: string;
    enrollmentId?: string;
  }
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/certificate/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);

    const result = await response.json();
    console.log('[Certificate] generate:', result);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
};

/**
 * Get all certificates for the current user
 * GET /certificate/user/certificates
 */
export const getUserCertificates = async (
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth('/certificate/user/certificates', {
      method: 'GET',
    }, token);

    const result = await response.json();
    console.log('[Certificate] user/certificates:', result);

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

// ─── Gamification APIs ───────────────────────────────────────────────────────

export const getLeaderboard = async (
  token: string,
  type: 'global' | 'course' | 'group' = 'global',
  id?: string,
  limit: number = 20
) => {
  const params = new URLSearchParams({ type, limit: limit.toString() });
  if (id) params.append('id', id);

  const response = await fetchWithAuth(`/gamification/leaderboard?${params}`, {
    method: 'GET',
  }, token);
  
  return response.json();
};

// ─── Discussion APIs ─────────────────────────────────────────────────────────

export enum DiscussionCategory {
  PRAYER = 'PRAYER',
  DISCUSSION = 'DISCUSSION', 
  DEVOTION = 'DEVOTION',
  BLESSING = 'BLESSING',
  TESTIMONY = 'TESTIMONY',
  QUESTION = 'QUESTION'
}

export interface DiscussionMediaUrl {
  type: 'image' | 'video';
  url: string;
  filename: string;
  caption?: string;
}

/**
 * Upload image for discussion
 */
export const uploadDiscussionImage = async (
  token: string,
  payload: { mimeType: string; fileName: string; file: string }
): Promise<ApiResponse<{ url: string }>> => {
  try {
    console.log('[Discussion] Uploading image...', payload.fileName);
    const response = await fetchWithAuth('/discussion/upload/image', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Upload image response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to upload image');
    return result;
  } catch (error) {
    console.error('[Discussion] Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload video for discussion
 */
export const uploadDiscussionVideo = async (
  token: string,
  payload: { mimeType: string; fileName: string; file: string }
): Promise<ApiResponse<{ url: string }>> => {
  try {
    console.log('[Discussion] Uploading video...', payload.fileName);
    const response = await fetchWithAuth('/discussion/upload/video', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Upload video response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to upload video');
    return result;
  } catch (error) {
    console.error('[Discussion] Error uploading video:', error);
    throw error;
  }
};

/**
 * Create a public discussion post
 */
export const createPublicDiscussion = async (
  token: string,
  payload: {
    content: string;
    isPublic: boolean;
    category?: DiscussionCategory;
    mediaUrls?: DiscussionMediaUrl[];
  }
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Creating post:', { 
      content: payload.content.substring(0, 50), 
      isPublic: payload.isPublic, 
      category: payload.category,
      mediaCount: payload.mediaUrls?.length 
    });
    
    const response = await fetchWithAuth('/discussion/public', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Create post response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to create discussion');
    return result;
  } catch (error) {
    console.error('[Discussion] Error creating discussion:', error);
    throw error;
  }
};

/**
 * Get public discussions
 */
export const getPublicDiscussions = async (
  token: string,
  sort: 'latest' | 'popular' = 'latest',
  category?: DiscussionCategory
): Promise<ApiResponse<any>> => {
  try {
    let url = `/discussion/public?sort=${sort}`;
    if (category) {
      url += `&category=${category}`;
    }
    
    console.log('[Discussion] Fetching discussions with sort:', sort, 'category:', category || 'ALL');
    
    const response = await fetchWithAuth(url, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Fetch discussions response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to fetch discussions');
    return result;
  } catch (error) {
    console.error('[Discussion] Error fetching discussions:', error);
    throw error;
  }
};

/**
 * Get single discussion with nested replies
 */
export const getDiscussion = async (
  token: string,
  discussionId: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Fetching discussion:', discussionId, { page, limit });
    
    const response = await fetchWithAuth(`/discussion/public/${discussionId}?page=${page}&limit=${limit}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Fetch discussion response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to fetch discussion');
    return result;
  } catch (error) {
    console.error('[Discussion] Error fetching discussion:', error);
    throw error;
  }
};

/**
 * Get comments/replies for a discussion (paginated)
 */
export const getDiscussionComments = async (
  token: string,
  discussionId: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Fetching comments for discussion:', discussionId, { page, limit });
    
    const response = await fetchWithAuth(`/discussion/public/${discussionId}/comments?page=${page}&limit=${limit}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Fetch comments response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to fetch comments');
    return result;
  } catch (error) {
    console.error('[Discussion] Error fetching comments:', error);
    throw error;
  }
};

/**
 * Reply to a discussion
 */
export const replyToDiscussion = async (
  token: string,
  discussionId: string,
  payload: {
    content: string;
    mediaUrls?: DiscussionMediaUrl[];
    parentReplyId?: string;
  }
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Replying to discussion:', discussionId);
    
    const response = await fetchWithAuth(`/discussion/public/${discussionId}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Reply response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to post reply');
    return result;
  } catch (error) {
    console.error('[Discussion] Error posting reply:', error);
    throw error;
  }
};

/**
 * Nested reply to a reply
 */
export const nestedReplyToReply = async (
  token: string,
  replyId: string,
  payload: {
    content: string;
    mediaUrls?: DiscussionMediaUrl[];
  }
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Nested reply to reply:', replyId);
    
    const response = await fetchWithAuth(`/discussion/reply/${replyId}/nested`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Nested reply response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to post nested reply');
    return result;
  } catch (error) {
    console.error('[Discussion] Error posting nested reply:', error);
    throw error;
  }
};

/**
 * Get a single reply with nested replies
 */
export const getReply = async (
  token: string,
  replyId: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Fetching reply:', replyId);
    
    const response = await fetchWithAuth(`/discussion/reply/${replyId}?page=${page}&limit=${limit}`, {
      method: 'GET',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Fetch reply response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to fetch reply');
    return result;
  } catch (error) {
    console.error('[Discussion] Error fetching reply:', error);
    throw error;
  }
};

/**
 * Like a discussion
 */
export const likeDiscussion = async (token: string, discussionId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Liking discussion:', discussionId);
    
    const response = await fetchWithAuth(`/discussion/${discussionId}/like`, {
      method: 'POST',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Like response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to like discussion');
    return result;
  } catch (error) {
    console.error('[Discussion] Error liking discussion:', error);
    throw error;
  }
};

/**
 * Delete a discussion
 */
export const deleteDiscussion = async (token: string, discussionId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('[Discussion] Deleting discussion:', discussionId);
    
    const response = await fetchWithAuth(`/discussion/${discussionId}`, {
      method: 'DELETE',
    }, token);
    
    const result = await response.json();
    console.log('[Discussion] Delete response:', response.status, result);
    
    if (!response.ok) throw new Error(result.message || 'Failed to delete discussion');
    return result;
  } catch (error) {
    console.error('[Discussion] Error deleting discussion:', error);
    throw error;
  }
};

// ─── Private Messaging APIs ─────────────────────────────────────────────────

/**
 * Get tutors the student can message
 */
export const getMessagableTutors = async (token: string) => {
  const response = await fetchWithAuth('/discussion/tutors', {
    method: 'GET',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch tutors');
  return result;
};

/**
 * Get students the tutor can message
 */
export const getMessagableStudents = async (token: string) => {
  const response = await fetchWithAuth('/discussion/students', {
    method: 'GET',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch students');
  return result;
};

/**
 * Send a private message (REST fallback)
 */
export const sendPrivateMessage = async (
  token: string,
  payload: { receiverId: string; content: string }
) => {
  const response = await fetchWithAuth('/discussion/private', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to send message');
  return result;
};

/**
 * Get all conversations (inbox list)
 */
export const getConversations = async (token: string) => {
  const response = await fetchWithAuth('/discussion/private/conversations', {
    method: 'GET',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch conversations');
  return result;
};

/**
 * Get messages with a specific user
 */
export const getPrivateMessages = async (
  token: string,
  userId: string,
  page = 1,
  limit = 50
) => {
  const response = await fetchWithAuth(`/discussion/private/${userId}?page=${page}&limit=${limit}`, {
    method: 'GET',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch messages');
  return result;
};

/**
 * Get unread message count
 */
export const getPrivateUnreadCount = async (token: string) => {
  try {
    const response = await fetchWithAuth('/discussion/private/unread/count', {
      method: 'GET',
    }, token);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch unread count');
    return result;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Edit a private message
 */
export const editPrivateMessage = async (
  token: string,
  messageId: string,
  content: string
) => {
  const response = await fetchWithAuth(`/discussion/private/message/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to edit message');
  return result;
};

/**
 * Delete a private message
 */
export const deletePrivateMessage = async (token: string, messageId: string) => {
  const response = await fetchWithAuth(`/discussion/private/message/${messageId}`, {
    method: 'DELETE',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to delete message');
  return result;
};

/**
 * Clear all messages with a user
 */
export const clearConversation = async (token: string, userId: string) => {
  const response = await fetchWithAuth(`/discussion/private/clear/${userId}`, {
    method: 'DELETE',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to clear conversation');
  return result;
};

// ─── Auth APIs ──────────────────────────────────────────────────────────────

/**
 * Refresh the access token using refresh token
 * POST /verify/refresh-token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
  try {
    // The backend (UserVerificationController.RefreshToken) only ever reads
    // refreshToken/deviceId from req.cookies or the x-refresh-token/x-device-id
    // headers — it never looks at the body. Mobile has no browser cookie jar,
    // so every refresh was silently doomed regardless of body shape ("No
    // refresh token or device ID provided"). deviceId is already embedded in
    // the refresh token's own JWT payload (see login.tsx's debug decode), so
    // it can be pulled out here with no extra storage or backend change.
    let deviceId: string | undefined;
    try {
      deviceId = JSON.parse(atob(refreshToken.split('.')[1]))?.deviceId;
    } catch {
      // Backend will reject with a clear message if this stays undefined.
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/verify/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-refresh-token': refreshToken,
        ...(deviceId ? { 'x-device-id': deviceId } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();

    // ✅ Check for success in different formats
    if (result?.success === false) {
      console.log('[Auth] Refresh failed:', result.message);
      throw new Error(result.message || 'Invalid session');
    }

    // ✅ Try different response paths for the new token
    const newToken = result?.data?.token || 
                     result?.data?.accessToken || 
                     result?.token || 
                     result?.accessToken;

    if (!newToken) {
      throw new Error('No token in refresh response');
    }

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return { data: { token: newToken } };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Google Auth
 */
export const googleAuth = async (idToken: string): Promise<any> => {
  const response = await apiCall('/user/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Google auth failed');
  return result;
};

/**
 * Complete profile after signup
 */
export const completeProfile = async (
  token: string,
  data: {
    first_name: string;
    last_name: string;
    phone_number: string;
    country: string;
    state: string;
    role: string;
    level: string;
    password?: string;
  }
): Promise<any> => {
  const response = await fetchWithAuth('/user/complete-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to complete profile');
  return result;
};

// ─── Admin APIs ───────────────────────────────────────────────────────────────

/**
 * Platform admin dashboard stats + recent activity
 * GET /user/admin-dashboard-stats
 */
export const getAdminDashboardStats = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/user/admin-dashboard-stats', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch admin dashboard stats');
  return result;
};

/**
 * GET /user/fetch-users-student
 */
export const getAdminStudents = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/user/fetch-users-student', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch students');
  return result;
};

/**
 * GET /user/fetch-users-tutors
 */
export const getAdminTutors = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/user/fetch-users-tutors', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch tutors');
  return result;
};

// ─── Super Admin APIs ─────────────────────────────────────────────────────────
// All routes below require the signed-in admin's adminRole to be "super_admin"
// (see UserContext.isSuperAdmin) — the backend enforces this independently.

export const getSuperAdminUsers = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/users', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch users');
  return result;
};

export const getSuperAdminUserDetail = async (userId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/super-admin/users/${userId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch user detail');
  return result;
};

export const suspendSuperAdminUser = async (userId: string, suspend: boolean, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/super-admin/users/${userId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ suspend }),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to update user status');
  return result;
};

export const getSuperAdminOrganizations = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/organizations', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch organizations');
  return result;
};

export const suspendSuperAdminOrganization = async (organizationId: string, suspend: boolean, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/super-admin/organizations/${organizationId}/suspend`, {
    method: 'PUT',
    body: JSON.stringify({ suspend }),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to update organization status');
  return result;
};

export const getSuperAdminCourses = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/courses', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch courses');
  return result;
};

export const deleteSuperAdminCourse = async (courseId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/super-admin/courses/${courseId}`, { method: 'DELETE' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to delete course');
  return result;
};

export const sendSuperAdminAnnouncement = async (
  data: { title: string; message: string; audience?: 'all' | 'students' | 'tutors' | 'org_admins' },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to send announcement');
  return result;
};

export const getSuperAdminOverview = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/overview', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch overview');
  return result;
};

export const getSuperAdminActivity = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/activity', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch activity');
  return result;
};

export const getSuperAdminEvents = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/events', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to fetch events');
  return result;
};

export const deleteSuperAdminEvent = async (eventId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/super-admin/events/${eventId}`, { method: 'DELETE' }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to delete event');
  return result;
};

export const sendSuperAdminEmail = async (
  data: { subject: string; message: string; audience?: 'all' | 'students' | 'tutors' | 'org_admins' },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth('/super-admin/email', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok || result.success === false) throw new Error(result.message || 'Failed to send email');
  return result;
};

// ─── Feedback APIs ────────────────────────────────────────────────────────────

export const submitFeedback = async (
  data: { message: string; type: 'COURSE' | 'GROUP' | 'OTHER' },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth('/feedback/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to send feedback');
  return result;
};

export const getAllFeedback = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/feedback/fetch-feedbacks', {
    method: 'GET',
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch feedback');
  return result;
};

// ─── Tutor Overview APIs ──────────────────────────────────────────────────────

/**
 * GET /course/tutor-overview
 */
export const getTutorOverview = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/course/tutor-overview', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch tutor overview');
  return result;
};

/**
 * GET /course/fetch-activities/{courseId}
 */
export const getCourseActivities = async (courseId: string, token: string): Promise<any> => {
  const response = await fetchWithAuth(`/course/fetch-activities/${courseId}`, { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch course activities');
  return result;
};

// ─── Settings APIs ────────────────────────────────────────────────────────────

/**
 * GET /user/settings
 */
export const getSettings = async (token: string): Promise<any> => {
  const response = await fetchWithAuth('/user/settings', { method: 'GET' }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch settings');
  return result;
};

/**
 * PUT /notifications/change-notification-settings/{settingsId}
 */
export const updateNotificationSettings = async (
  settingsId: string,
  data: {
    enable_push_notification: boolean;
    course_updates: boolean;
    event: boolean;
    achievement: boolean;
    daily_reminders: boolean;
    group_activity: boolean;
    email_notification: boolean;
    darkMode: boolean;
  },
  token: string
): Promise<any> => {
  const response = await fetchWithAuth(`/notifications/change-notification-settings/${settingsId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to update notification settings');
  return result;
};