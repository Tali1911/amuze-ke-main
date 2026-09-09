import { supabase } from '@/integrations/supabase/client';

export interface CoachAvailability {
  id: string;
  coach_id: string;
  unavailable_date: string;
  remark: string;
  notified_admin: boolean;
  created_at: string;
}

export const coachAvailabilityService = {
  async getAvailability(coachId: string): Promise<CoachAvailability[]> {
    const { data, error } = await (supabase as any)
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .order('unavailable_date', { ascending: true });

    if (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
    return data || [];
  },

  async addUnavailability(coachId: string, date: string, remark: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('coach_availability')
      .insert({ coach_id: coachId, unavailable_date: date, remark });

    if (error) {
      console.error('Error adding unavailability:', error);
      return false;
    }
    return true;
  },

  async removeUnavailability(id: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('coach_availability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing unavailability:', error);
      return false;
    }
    return true;
  },

  async notifyAdmin(coachName: string, date: string, remark: string): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfmyrqzrwamygvyibdbs.supabase.co';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-coach-availability-notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachName, date, remark })
      });

      return response.ok;
    } catch (error) {
      console.error('Error notifying admin:', error);
      return false;
    }
  },

  // Get all coach availability (for admin view)
  async getAllAvailability(): Promise<CoachAvailability[]> {
    const { data, error } = await (supabase as any)
      .from('coach_availability')
      .select('*')
      .order('unavailable_date', { ascending: true });

    if (error) {
      console.error('Error fetching all availability:', error);
      return [];
    }
    return data || [];
  }
};
