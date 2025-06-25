// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@services/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        await createUserProfile(userId);
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Create user profile
  const createUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: user?.user_metadata?.full_name || '',
          username: user?.email?.split('@')[0] || '',
          avatar_url: user?.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  // Sign in with email
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Welcome back!');
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success('Check your email to confirm your account!');
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGitHub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('GitHub sign in error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      toast.success('Signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) return { success: false, error: 'No user logged in' };

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('Failed to update profile');
        return { success: false, error };
      }

      setProfile(data);
      toast.success('Profile updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('An unexpected error occurred');
      return { success: false, error };
    }
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    if (!session?.access_token) {
      return {};
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
    updateProfile,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};