import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export type AutomationTrigger =
  | 'lead_created'
  | 'registration_created'
  | 'attendance_marked'
  | 'time_based'
  | 'manual';

export type AutomationStep =
  | { type: 'send_email'; template_id?: string; subject?: string; body_html?: string; from_name?: string }
  | { type: 'wait'; days?: number; hours?: number; minutes?: number }
  | { type: 'add_tag'; tag: string };

export interface MarketingAutomation {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: AutomationTrigger;
  trigger_config: Record<string, any>;
  steps: AutomationStep[];
  created_at: string;
  updated_at: string;
}

export interface AutomationEnrollment {
  id: string;
  automation_id: string;
  lead_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  current_step: number;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  next_run_at: string;
  started_at: string;
  completed_at: string | null;
  last_error: string | null;
}

export const marketingAutomationService = {
  async list(): Promise<MarketingAutomation[]> {
    const { data, error } = await sb
      .from('marketing_automations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('list automations', error);
      return [];
    }
    return (data ?? []) as MarketingAutomation[];
  },

  async save(input: Partial<MarketingAutomation> & { name: string; trigger_type: AutomationTrigger }) {
    const payload: any = {
      name: input.name,
      description: input.description ?? null,
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config ?? {},
      steps: input.steps ?? [],
      status: input.status ?? 'draft',
    };
    if (input.id) {
      payload.updated_at = new Date().toISOString();
      const { data, error } = await sb
        .from('marketing_automations')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as MarketingAutomation;
    }
    const { data, error } = await sb
      .from('marketing_automations')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as MarketingAutomation;
  },

  async setStatus(id: string, status: MarketingAutomation['status']) {
    const { error } = await sb
      .from('marketing_automations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await sb.from('marketing_automations').delete().eq('id', id);
    if (error) throw error;
  },

  async listEnrollments(automationId: string): Promise<AutomationEnrollment[]> {
    const { data, error } = await sb
      .from('marketing_automation_enrollments')
      .select('*')
      .eq('automation_id', automationId)
      .order('started_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('list enrollments', error);
      return [];
    }
    return (data ?? []) as AutomationEnrollment[];
  },

  async stats(automationId: string) {
    const { data } = await sb
      .from('marketing_automation_enrollments')
      .select('status')
      .eq('automation_id', automationId);
    const counts = { active: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const r of data ?? []) counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] ?? 0) + 1;
    return counts;
  },

  async runNow(): Promise<{ processed: number; errors: number } | null> {
    const { data, error } = await sb.functions.invoke('process-marketing-automations', { body: {} });
    if (error) {
      console.error('runNow', error);
      return null;
    }
    return data ?? null;
  },
};
