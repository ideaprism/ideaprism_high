'use client';

import React, { createContext, useContext, useState } from 'react';

interface Organization {
  id: string;
  name: string;
  orgType: string;
  region: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  organization: Organization | null;
  partnerName: string | null;
  accessCode: string | null;
  login: (code: string, org: Organization) => void;
  logout: () => Promise<void> | void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'ideaprism_auth_session';

function readSession(): { code: string | null; org: Organization | null } {
  if (typeof window === 'undefined') {
    return { code: null, org: null };
  }

  const savedSession = window.sessionStorage.getItem(SESSION_KEY);
  if (!savedSession) {
    return { code: null, org: null };
  }

  try {
    const parsed = JSON.parse(savedSession) as { code?: string; org?: Organization };
    return {
      code: parsed.code ?? null,
      org: parsed.org ?? null,
    };
  } catch (e) {
    console.error('Failed to parse saved session', e);
    window.sessionStorage.removeItem(SESSION_KEY);
    return { code: null, org: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = readSession();
  const [organization, setOrganization] = useState<Organization | null>(initial.org);
  const [accessCode, setAccessCode] = useState<string | null>(initial.code);

  const login = (code: string, org: Organization) => {
    setAccessCode(code);
    setOrganization(org);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code, org }));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Failed to clear auth cookie', e);
    }
    setAccessCode(null);
    setOrganization(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!accessCode,
        organization,
        partnerName: organization?.name || null,
        accessCode,
        login,
        logout,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

