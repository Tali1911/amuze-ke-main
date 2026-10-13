import { supabase } from '@/integrations/supabase/client';

/**
 * Tab access delegation.
 * Tab keys are "<PORTAL_ROLE>:<tabId>" (e.g. "ACCOUNTS:collections").
 * A rule stores the full list of tabs visible to its scope:
 *  - scope 'user' (scope_id = user uuid) wins over
 *  - scope 'role' (scope_id = ROLE, uppercase) which wins over
 *  - the built-in default tabs of the user's role.
 */
export type TabAccessScope = 'role' | 'user';

export interface TabAccessRule {
  scope: TabAccessScope;
  scope_id: string;
  allowed_tabs: string[];
}

export const tabKey = (portal: string, tabId: string) => `${portal.toUpperCase()}:${tabId}`;

export const parseTabKey = (key: string): { portal: string; tabId: string } | null => {
  const i = key.indexOf(':');
  if (i <= 0) return null;
  return { portal: key.slice(0, i), tabId: key.slice(i + 1) };
};

export const tabAccessService = {
  async listRules(): Promise<TabAccessRule[]> {
    const { data, error } = await (supabase as any)
      .from('staff_tab_access')
      .select('scope, scope_id, allowed_tabs');
    if (error) {
      console.warn('[tabAccess] rules unavailable:', error.message);
      return [];
    }
    return (data || []) as TabAccessRule[];
  },

  async getRulesFor(userId: string, role: string): Promise<{ user?: string[]; role?: string[] }> {
    const { data, error } = await (supabase as any)
      .from('staff_tab_access')
      .select('scope, scope_id, allowed_tabs')
      .or(`and(scope.eq.user,scope_id.eq.${userId}),and(scope.eq.role,scope_id.eq.${role.toUpperCase()})`);
    if (error) {
      console.warn('[tabAccess] rules unavailable:', error.message);
      return {};
    }
    const out: { user?: string[]; role?: string[] } = {};
    (data || []).forEach((r: TabAccessRule) => {
      out[r.scope] = r.allowed_tabs || [];
    });
    return out;
  },

  async saveRule(scope: TabAccessScope, scopeId: string, allowedTabs: string[]): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from('staff_tab_access')
      .upsert(
        {
          scope,
          scope_id: scope === 'role' ? scopeId.toUpperCase() : scopeId,
          allowed_tabs: allowedTabs,
          updated_by: auth.user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'scope,scope_id' }
      );
    if (error) throw error;
  },

  async resetRule(scope: TabAccessScope, scopeId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('staff_tab_access')
      .delete()
      .eq('scope', scope)
      .eq('scope_id', scope === 'role' ? scopeId.toUpperCase() : scopeId);
    if (error) throw error;
  },
};
