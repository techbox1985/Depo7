// src/hooks/useCurrentUserProfile.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, refetchProfile: fetchProfile };
}
