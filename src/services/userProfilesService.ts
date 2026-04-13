import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export async function fetchUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');
  if (error) throw error;
  return data as UserProfile[];
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0] as UserProfile;
}
