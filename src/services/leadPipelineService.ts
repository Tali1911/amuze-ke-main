import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export type PipelineStage = 'new' | 'contacted' | 'quoted' | 'booked' | 'lost';
export const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'new',       label: 'New',       color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'quoted',    label: 'Quoted',    color: 'bg-purple-100 text-purple-800' },
  { value: 'booked',    label: 'Booked',    color: 'bg-green-100 text-green-800' },
  { value: 'lost',      label: 'Lost',      color: 'bg-gray-100 text-gray-800' },
];

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any> | null;
  occurred_at: string;
  created_by: string | null;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_at: string;
}

export const leadPipelineService = {
  async updateLeadFields(leadId: string, fields: Partial<{
    pipeline_stage: PipelineStage;
    tags: string[];
    owner_id: string | null;
    next_followup_at: string | null;
    notes: string;
  }>) {
    const { data, error } = await sb
      .from('leads')
      .update(fields)
      .eq('id', leadId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listActivities(leadId: string): Promise<LeadActivity[]> {
    const { data, error } = await sb
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('occurred_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error('listActivities', error);
      return [];
    }
    return (data ?? []) as LeadActivity[];
  },

  async addNote(leadId: string, title: string, description?: string) {
    const { error } = await sb.from('lead_activities').insert({
      lead_id: leadId,
      activity_type: 'note',
      title,
      description: description ?? null,
    });
    if (error) throw error;
  },

  async listTasks(leadId: string): Promise<LeadTask[]> {
    const { data, error } = await sb
      .from('lead_tasks')
      .select('*')
      .eq('lead_id', leadId)
      .order('completed_at', { ascending: true, nullsFirst: true })
      .order('due_at', { ascending: true });
    if (error) {
      console.error('listTasks', error);
      return [];
    }
    return (data ?? []) as LeadTask[];
  },

  async createTask(input: { lead_id: string; title: string; due_at?: string | null; notes?: string }) {
    const { data, error } = await sb.from('lead_tasks').insert({
      lead_id: input.lead_id,
      title: input.title,
      due_at: input.due_at ?? null,
      notes: input.notes ?? null,
    }).select().single();
    if (error) throw error;
    return data as LeadTask;
  },

  async toggleTaskComplete(taskId: string, completed: boolean) {
    const { error } = await sb
      .from('lead_tasks')
      .update({ completed_at: completed ? new Date().toISOString() : null })
      .eq('id', taskId);
    if (error) throw error;
  },

  async deleteTask(taskId: string) {
    const { error } = await sb.from('lead_tasks').delete().eq('id', taskId);
    if (error) throw error;
  },
};
