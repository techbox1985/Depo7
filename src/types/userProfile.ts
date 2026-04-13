export interface UserProfile {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'vendedor' | 'oficina' | 'cajero' | 'chofer';
  active: boolean;
  full_name: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
