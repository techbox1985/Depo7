// src/hooks/useCurrentUserProfile.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchProfile() {
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
      if (!ignore) {
        setProfile(data || null);
        setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      ignore = true;
    };
  }, []);

  return { profile, loading };
}
