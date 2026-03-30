import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchUserData = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!isMounted.current) return;

      setProfile(profileData);

      if (profileData?.clinic_id) {
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', profileData.clinic_id)
          .single();

        if (clinicError) throw clinicError;
        if (!isMounted.current) return;

        setClinic(clinicData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (!isMounted.current) return;

      setProfile(null);
      setClinic(null);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // 🔥 1. تحميل الجلسة مباشرة عند بداية التطبيق
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
        }

        const currentUser = data?.session?.user ?? null;

        if (!isMounted.current) return;

        setUser(currentUser);

        if (currentUser) {
          await fetchUserData(currentUser.id);
        } else {
          setProfile(null);
          setClinic(null);
        }
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        // 🔥 يمنع التعليق مهما حدث
        if (isMounted.current) setLoading(false);
      }
    };

    initAuth();

    // 🔥 2. الاستماع لتغيرات auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserData(currentUser.id);
        } else {
          setProfile(null);
          setClinic(null);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
    setClinic(null);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    setProfile(data);
    return data;
  };

  const updateClinic = async (updates) => {
    if (!clinic) throw new Error('No clinic associated with user');

    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinic.id)
      .select()
      .single();

    if (error) throw error;

    setClinic(data);
    return data;
  };

  const value = {
    user,
    profile,
    clinic,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateClinic,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;