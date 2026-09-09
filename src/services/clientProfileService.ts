import { supabase } from '@/integrations/supabase/client';

export interface ClientProfile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  children: any[];
  created_at: string;
  updated_at: string;
}

export const clientProfileService = {
  async getProfile(authUserId: string): Promise<ClientProfile | null> {
    const { data, error } = await (supabase as any)
      .from('client_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
    return data;
  },

  async upsertProfile(authUserId: string, updates: Partial<Omit<ClientProfile, 'id' | 'auth_user_id' | 'created_at'>>): Promise<ClientProfile | null> {
    const { data, error } = await (supabase as any)
      .from('client_profiles')
      .upsert(
        { auth_user_id: authUserId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'auth_user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting client profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(authUserId: string, updates: Partial<Omit<ClientProfile, 'id' | 'auth_user_id' | 'created_at'>>): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('client_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('auth_user_id', authUserId);

    if (error) {
      console.error('Error updating client profile:', error);
      return false;
    }
    return true;
  },
};
