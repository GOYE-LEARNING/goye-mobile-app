// File: utils/organizationApi.ts
import { API_CONFIG } from '@/constants/config';

export interface OrganizationData {
  organizationType: string;
  organizationName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  yearEstablished: string;
  description: string;
  
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  userCountry: string;
  userState: string;
  userRole: string;
  userFormType: string;
  
  // Church fields
  ministryName?: string;
  leadPastor?: string;
  leadershipRole?: string;
  weeklyService?: string;
  churchWebsite?: string;
  churchAddress?: string;
  churchLogo?: string | null;
  
  // School fields
  schoolName?: string;
  schoolType?: string;
  schoolAddress?: string;
  adminName?: string;
  adminRole?: string;
  emailDomain?: string;
  schoolWebsite?: string;
  accreditationNumber?: string;
  schoolDocument?: string | null;
  
  // Club fields
  clubName?: string;
  clubType?: string;
  leaderName?: string;
  leaderRole?: string;
  meetingFrequency?: string;
  parentOrganization?: string;
  socialLink?: string;
  clubDescription?: string;
  clubDocument?: string | null;
}

export const formatOrganizationDataForAPI = (data: OrganizationData) => {
  const payload: any = {
    organization_name: data.organizationName,
    organization_type: data.organizationType,
    organization_email: data.email,
    organization_phone_number: data.phone,
    organization_country: data.country,
    organization_state: data.state,
    organization_description: data.description,
    organization_role: data.userRole || 'admin',
    organization_year: data.yearEstablished,
    
    user_first_name: data.userFirstName,
    user_last_name: data.userLastName,
    user_email_address: data.userEmail,
    user_country: data.userCountry,
    user_state: data.userState,
    user_role: data.userRole || 'admin',
    user_phone_number: data.userPhone,
    user_form_type: data.userFormType || 'organization',
  };

  // Church object - ALWAYS present
  payload.church = {
    church_ministry_name: data.organizationType === 'church' ? (data.ministryName || '') : '',
    church_lead_pastor: data.organizationType === 'church' ? (data.leadPastor || '') : '',
    church_leadership_role: data.organizationType === 'church' ? (data.leadershipRole || '') : '',
    church_email: data.organizationType === 'church' ? (data.email || '') : '',
    church_address: data.organizationType === 'church' ? (data.churchAddress || '') : '',
    church_weekly_service: data.organizationType === 'church' ? (data.weeklyService || '') : '',
    church_website: data.organizationType === 'church' ? (data.churchWebsite || '') : '',
    church_logo: data.organizationType === 'church' ? (data.churchLogo || '') : '',
  };

  // School object - ALWAYS present
  payload.school = {
    school_name: data.organizationType === 'school' ? (data.schoolName || '') : '',
    school_type: data.organizationType === 'school' ? (data.schoolType || '') : '',
    school_address: data.organizationType === 'school' ? (data.schoolAddress || '') : '',
    school_admin_name: data.organizationType === 'school' ? (data.adminName || '') : '',
    school_role: data.organizationType === 'school' ? (data.adminRole || '') : '',
    school_website: data.organizationType === 'school' ? (data.schoolWebsite || '') : '',
    school_accreditation_number: data.organizationType === 'school' ? (data.accreditationNumber || '') : '',
    school_document: data.organizationType === 'school' ? (data.schoolDocument || '') : '',
    school_email: data.organizationType === 'school' ? (data.emailDomain || '') : '',
  };

  // Club object - ALWAYS present
  payload.club = {
    club_name: data.organizationType === 'club' ? (data.clubName || '') : '',
    club_type: data.organizationType === 'club' ? (data.clubType || '') : '',
    club_leader_name: data.organizationType === 'club' ? (data.leaderName || '') : '',
    club_meeting_frequency: data.organizationType === 'club' ? (data.meetingFrequency || '') : '',
    club_social_link: data.organizationType === 'club' ? (data.socialLink || '') : '',
    club_parent_org: data.organizationType === 'club' ? (data.parentOrganization || '') : '',
    club_description: data.organizationType === 'club' ? (data.clubDescription || '') : '',
    club_document: data.organizationType === 'club' ? (data.clubDocument || '') : '',
    club_role: data.organizationType === 'club' ? (data.leaderRole || '') : '',
  };

  return payload;
};

// NEW: Generate password for organization
export const generateOrganizationPassword = async (organizationId: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/organizations/organization-password-generated/${organizationId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to generate password');
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    console.error('Error generating password:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate password',
    };
  }
};

export const createOrganization = async (data: OrganizationData) => {
  try {
    const payload = formatOrganizationDataForAPI(data);
    
    // Convert any file URIs to base64 if they exist
    if (data.organizationType === 'school' && data.schoolDocument) {
      await convertFileToBase64IfNeeded(payload, data.schoolDocument, 'school_document');
    }
    if (data.organizationType === 'club' && data.clubDocument) {
      await convertFileToBase64IfNeeded(payload, data.clubDocument, 'club_document');
    }
    if (data.organizationType === 'church' && data.churchLogo) {
      await convertFileToBase64IfNeeded(payload, data.churchLogo, 'church_logo');
    }
    
    console.log('Submitting organization data (without large base64):', JSON.stringify({
      ...payload,
      school: payload.school ? { 
        ...payload.school, 
        school_document: payload.school?.school_document ? '[BASE64_DATA]' : '' 
      } : payload.school,
      club: payload.club ? { 
        ...payload.club, 
        club_document: payload.club?.club_document ? '[BASE64_DATA]' : '' 
      } : payload.club,
      church: payload.church ? { 
        ...payload.church, 
        church_logo: payload.church?.church_logo ? '[BASE64_DATA]' : '' 
      } : payload.church,
    }, null, 2));

    const response = await fetch(`${API_CONFIG.BASE_URL}/organizations/auth/create-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }

    if (!response.ok) {
      console.error('API Error Response:', responseData);
      throw new Error(responseData.message || `HTTP ${response.status}: Failed to create organization`);
    }

    // FIXED: Extract organization ID from the correct location
    const organizationId = responseData.data?.id || 
                          responseData.organizationId || 
                          responseData.id || 
                          responseData._id;
    
    console.log('Extracted organization ID:', organizationId);
    console.log('Full response data:', responseData);
    
    if (!organizationId) {
      console.warn('No organization ID returned, skipping password generation', responseData);
      return {
        success: true,
        data: responseData,
      };
    }

    // Generate password
    const passwordResult = await generateOrganizationPassword(organizationId);
    
    if (!passwordResult.success) {
      console.error('Failed to generate password:', passwordResult.error);
      // Still return success for organization creation, but flag password issue
      return {
        success: true,
        data: responseData,
        passwordError: passwordResult.error,
      };
    }

    // Return both organization data and generated password
    return {
      success: true,
      data: {
        ...responseData,
        generatedPassword: passwordResult.data.generatedPassword,
      },
    };
  } catch (error: any) {
    console.error('Error creating organization:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

// Helper function to convert file URI to base64
const convertFileToBase64IfNeeded = async (payload: any, fileUri: string, fieldName: string) => {
  try {
    // Check if it's a file:// URI
    if (fileUri.startsWith('file://')) {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Update the payload
      if (payload.school && fieldName === 'school_document') {
        payload.school.school_document = base64;
      } else if (payload.club && fieldName === 'club_document') {
        payload.club.club_document = base64;
      } else if (payload.church && fieldName === 'church_logo') {
        payload.church.church_logo = base64;
      }
    } else if (fileUri.startsWith('data:')) {
      // Already base64, just use it
      if (payload.school && fieldName === 'school_document') {
        payload.school.school_document = fileUri;
      } else if (payload.club && fieldName === 'club_document') {
        payload.club.club_document = fileUri;
      } else if (payload.church && fieldName === 'church_logo') {
        payload.church.church_logo = fileUri;
      }
    }
    // Otherwise, it might already be a URL or other format
  } catch (error) {
    console.error(`Error converting ${fieldName} to base64:`, error);
    // Keep the original URI if conversion fails
  }
};