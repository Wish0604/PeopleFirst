import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { AUTHORITY_ROLES } from '../constants/authorityRoles';
import { auth } from '../firebase';
import {
  loadAuthorityProfile,
  requestPasswordReset,
  signInAuthority,
  signOutAuthority,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError('');

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const authorityProfile = await loadAuthorityProfile(firebaseUser.uid);
        setProfile(authorityProfile);
      } catch (profileError) {
        setProfile(null);
        setError(profileError.message || 'Unable to load authority profile.');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    isAuthority: profile ? AUTHORITY_ROLES.includes(profile.role) : false,
    signIn: signInAuthority,
    signOut: signOutAuthority,
    resetPassword: requestPasswordReset,
  }), [user, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}