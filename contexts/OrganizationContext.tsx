// File: contexts/OrganizationContext.tsx

import React, { createContext, useContext, useState } from 'react';

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [organizationData, setOrganizationData] = useState({
    // Organization Info
    organizationType: '',
    organizationName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    yearEstablished: '',
    description: '',

    // User Profile Fields
    userFirstName: '',
    userLastName: '',
    userEmail: '',
    userPhone: '',
    userCountry: '',
    userState: '',
    userRole: 'admin',
    userFormType: 'organization',
    
    // Church Info
    ministryName: '',
    leadPastor: '',
    leadershipRole: '',
    weeklyService: '',
    churchWebsite: '',
    churchAddress: '',
    churchLogo: null,
    
    // School Info
    schoolName: '',
    schoolType: '',
    schoolAddress: '',
    adminName: '',
    adminRole: '',
    school_email: '',        // Changed from emailDomain to school_email
    schoolWebsite: '',
    accreditationNumber: '',
    officialDocument: null,
    
    // Club Info
    clubName: '',
    clubType: '',
    leaderName: '',
    leaderRole: '',
    meetingFrequency: '',
    parentOrganization: '',
    socialLink: '',
    clubDescription: '',
    clubDocument: null,
  });

  const updateOrganizationData = (updates) => {
    setOrganizationData(prev => ({ ...prev, ...updates }));
  };

  return (
    <OrganizationContext.Provider value={{ organizationData, updateOrganizationData }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => useContext(OrganizationContext);