import { supabase } from '@/integrations/supabase/client';

export const CAMP_TABS = [
  { id: 'daily', label: 'Daily Ops' },
  { id: 'all', label: 'All Registrations' },
  { id: 'ground', label: 'Ground Registration' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'history', label: 'History' },
  { id: 'reports', label: 'Reports' },
  { id: 'payments', label: 'Payment History' },
] as const;

export type CampTabId = typeof CAMP_TABS[number]['id'];

export const ALL_TAB_IDS: CampTabId[] = CAMP_TABS.map(t => t.id);

export interface CoachAccessInfo {
  hasAccess: boolean;
  visibleTabs: CampTabId[];
}

export const coachAccessService = {
  async checkAccess(userId: string): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('has_record_portal_access', {
      _user_id: userId
    });
    if (error) {
      console.error('Error checking coach access:', error);
      return false;
    }
    return !!data;
  },

  async getAccessInfo(userId: string): Promise<CoachAccessInfo> {
    const { data, error } = await (supabase as any)
      .from('coach_record_access')
      .select('revoked_at, visible_tabs')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data || data.revoked_at !== null) {
      return { hasAccess: false, visibleTabs: [] };
    }
    return {
      hasAccess: true,
      visibleTabs: data.visible_tabs || ALL_TAB_IDS
    };
  },

  async grantAccess(userId: string, grantedBy: string, visibleTabs?: CampTabId[]): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('coach_record_access')
      .upsert(
        {
          user_id: userId,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          visible_tabs: visibleTabs || ALL_TAB_IDS
        },
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('Error granting access:', error);
      return false;
    }
    return true;
  },

  async updateVisibleTabs(userId: string, visibleTabs: CampTabId[]): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('coach_record_access')
      .update({ visible_tabs: visibleTabs })
      .eq('user_id', userId);
    if (error) {
      console.error('Error updating visible tabs:', error);
      return false;
    }
    return true;
  },

  async revokeAccess(userId: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from('coach_record_access')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      console.error('Error revoking access:', error);
      return false;
    }
    return true;
  },

  async listCoachAccess(): Promise<Record<string, { granted: boolean; visibleTabs: CampTabId[] }>> {
    const { data, error } = await (supabase as any)
      .from('coach_record_access')
      .select('user_id, revoked_at, visible_tabs');
    if (error) {
      console.error('Error listing coach access:', error);
      return {};
    }
    const map: Record<string, { granted: boolean; visibleTabs: CampTabId[] }> = {};
    (data || []).forEach((row: any) => {
      map[row.user_id] = {
        granted: row.revoked_at === null,
        visibleTabs: row.visible_tabs || ALL_TAB_IDS
      };
    });
    return map;
  }
};
