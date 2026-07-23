import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setStaffProfile(null);
      return;
    }
    supabase
      .from('students')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));

    supabase
      .from('admins')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setStaffProfile(data));
  }, [session?.user?.id]);

  const value = {
    session,
    profile,
    staffProfile,
    loading,
    isLoggedIn: !!session,
    isStaff: !!staffProfile,
    isAdmin: staffProfile?.role === 'admin',
    refreshProfile: async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(data);
    },
    refreshStaffProfile: async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setStaffProfile(data);
    },
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
