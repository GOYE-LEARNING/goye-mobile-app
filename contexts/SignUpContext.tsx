import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'student' | 'instructor' | '';
type Level = 'beginner' | 'intermediate' | '';

interface SignUpData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  state: string;
  role: Role;
  level: Level;
  otp?: string;
  otpSessionToken?: string; 
  isGoogleAuth: boolean;
  googleToken: string;
  language: string;        // ✅ ADD THIS
  languageCode: string;    // ✅ ADD THIS
}

const initialState: SignUpData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  country: '',
  state: '',
  role: '',
  level: '',
  otp: undefined,
  otpSessionToken: undefined,
  isGoogleAuth: false,
  googleToken: '',
  language: '',            // ✅ ADD THIS
  languageCode: '',        // ✅ ADD THIS
};

type ContextType = {
  data: SignUpData;
  setField: <K extends keyof SignUpData>(key: K, value: SignUpData[K]) => void;
  reset: () => void;
};

const SignUpContext = createContext<ContextType | undefined>(undefined);

export const SignUpProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState(initialState);

  const setField = <K extends keyof SignUpData>(key: K, value: SignUpData[K]) =>
    setData(prev => ({ ...prev, [key]: value }));

  const reset = () => setData(initialState);

  return (
    <SignUpContext.Provider value={{ data, setField, reset }}>
      {children}
    </SignUpContext.Provider>
  );
};

export const useSignUp = () => {
  const ctx = useContext(SignUpContext);
  if (!ctx) throw new Error('useSignUp must be used inside SignUpProvider');
  return ctx;
};