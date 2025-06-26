// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';
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
  // DEMO MODE: Hardcoded demo user and profile
  const demoUser = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'demo@demo.com',
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: null
    }
  };
  const demoProfile = {
    id: '00000000-0000-0000-0000-000000000000',
    username: 'demouser',
    full_name: 'Demo User',
    avatar_url: null,
    role: 'user'
  };

  const [user, setUser] = useState(demoUser);
  const [session, setSession] = useState({
    user: demoUser,
    access_token: 'demo-token'
  });
  const [profile, setProfile] = useState(demoProfile);
  const [loading, setLoading] = useState(false);

  // Demo mode: Auth functions are no-ops
  const signIn = async () => ({ success: true, data: { user: demoUser } });
  const signUp = async () => ({ success: true, data: { user: demoUser } });
  const signOut = async () => {
    setUser(demoUser);
    setSession({ user: demoUser, access_token: 'demo-token' });
    setProfile(demoProfile);
    toast.success('Signed out (demo mode)');
    return { success: true };
  };
  const updateProfile = async (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    toast.success('Profile updated (demo mode)');
    return { success: true, data: { ...profile, ...updates } };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getAuthHeaders: () => ({ Authorization: 'Bearer demo-token' })
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
