import { useEffect, useState, useCallback } from 'react';
import { fetchUserProfiles, updateUserProfile } from '../services/userProfilesService';
import { UserProfile } from '../types';

export function useUserProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfiles();
      setProfiles(data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const saveProfile = async (id: string, updates: Partial<UserProfile>) => {
    await updateUserProfile(id, updates);
    await loadProfiles();
  };

  return { profiles, loading, error, reload: loadProfiles, saveProfile };
}
