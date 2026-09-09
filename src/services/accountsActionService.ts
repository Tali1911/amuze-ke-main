import { supabase } from '@/integrations/supabase/client';

export interface AccountsActionItem {
  id: string;
  registration_id: string;
  registration_type: string;
  child_name: string;
  parent_name: string;
  email?: string;
  phone?: string;
  action_type: 'invoice_needed' | 'receipt_needed' | 'payment_followup';
  amount_due: number;
  amount_paid: number;
  camp_type?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completed_by?: string;
  // Invoice tracking
  invoice_id?: string;
  invoice_sent?: boolean;
  invoice_sent_at?: string;
}

// Helper to work with untyped table (table not in generated types yet)
const fromTable = (tableName: string) => supabase.from(tableName as any);

// Send email notification to accountants
const notifyAccountants = async (data: {
  childName: string;
  parentName: string;
  email: string;
  phone: string;
  amountDue: number;
  campType: string;
  registrationId: string;
}) => {
  try {
    const { error } = await supabase.functions.invoke('notify-accounts-pending', {
      body: data,
    });
    if (error) {
      console.error('Failed to send accountant notification:', error);
    } else {
      console.log('Accountant notification sent successfully');
    }
  } catch (err) {
    console.error('Error invoking notify-accounts-pending:', err);
  }
};

export const accountsActionService = {
  async createActionItem(data: Omit<AccountsActionItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data: item, error } = await fromTable('accounts_action_items')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return item as unknown as AccountsActionItem;
  },

  async getActionItems(filters?: {
    status?: string;
    actionType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let query = fromTable('accounts_action_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AccountsActionItem[];
  },

  async getPendingItems() {
    return this.getActionItems({ status: 'pending' });
  },

  async updateActionItem(id: string, updates: Partial<AccountsActionItem>) {
    const { data, error } = await fromTable('accounts_action_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AccountsActionItem;
  },

  async markCompleted(id: string, userId: string, notes?: string) {
    return this.updateActionItem(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: userId,
      notes: notes || undefined,
    });
  },

  async markCompletedByRegistration(registrationId: string, userId: string, notes?: string) {
    // Find all pending items for this registration
    const { data: items, error } = await fromTable('accounts_action_items')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('status', 'pending');

    if (error) throw error;

    // Mark each as completed
    for (const item of (items || []) as unknown as AccountsActionItem[]) {
      await this.markCompleted(item.id, userId, notes);
    }

    return (items || []).length;
  },

  async checkExistingItem(registrationId: string, childName: string) {
    const { data, error } = await fromTable('accounts_action_items')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('child_name', childName)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    return data as unknown as AccountsActionItem | null;
  },

  async createUnpaidCheckInItem(
    registrationId: string,
    childName: string,
    parentName: string,
    email: string,
    phone: string,
    amountDue: number,
    amountPaid: number,
    campType: string,
    location?: string
  ) {
    // Check if item already exists (may have been created by DB trigger)
    const existing = await this.checkExistingItem(registrationId, childName);
    if (existing) {
      // Update existing item if we have a non-zero amountPaid or a different amountDue
      const needsUpdate =
        (amountPaid > 0 && existing.amount_paid !== amountPaid) ||
        (amountDue > 0 && existing.amount_due !== amountDue) ||
        (location && !(existing as any).location);

      if (needsUpdate) {
        const updates: any = {
          amount_paid: amountPaid,
          amount_due: amountDue,
        };
        if (location) updates.location = location;
        return this.updateActionItem(existing.id, updates);
      }
      return existing;
    }

    const insertData: any = {
      registration_id: registrationId,
      registration_type: 'camp',
      child_name: childName,
      parent_name: parentName,
      email,
      phone,
      action_type: 'invoice_needed',
      amount_due: amountDue,
      amount_paid: amountPaid,
      camp_type: campType,
      status: 'pending',
    };
    if (location) insertData.location = location;

    const item = await this.createActionItem(insertData);

    // Send email notification to accountants (don't await to avoid blocking)
    notifyAccountants({
      childName,
      parentName,
      email,
      phone,
      amountDue,
      campType,
      registrationId,
    });

    return item;
  },
};
