import { supabase } from '@/integrations/supabase/client';

// Temporary type bypass until Supabase types regenerate
const supabaseAny = supabase as any;

export interface EmailSuppression {
  id: string;
  email: string;
  suppression_type: 'bounce_hard' | 'bounce_soft' | 'spam_complaint' | 'unsubscribe' | 'manual';
  reason?: string;
  bounce_date?: string;
  created_at: string;
}

export const emailValidationService = {
  /**
   * Check if email is suppressed before sending
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAny
        .from('email_suppressions')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking email suppression:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isEmailSuppressed:', error);
      return false;
    }
  },

  /**
   * Check if email is valid based on bounce history
   */
  async isEmailValid(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAny
        .from('leads')
        .select('email_valid, bounce_count')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking email validity:', error);
        return true; // Default to true if check fails
      }

      if (!data) return true; // Email not in leads table yet

      // Consider invalid if bounced more than 3 times or marked invalid
      return data.email_valid !== false && (data.bounce_count || 0) < 3;
    } catch (error) {
      console.error('Error in isEmailValid:', error);
      return true;
    }
  },

  /**
   * Get suppression reason
   */
  async getSuppressionReason(email: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAny
        .from('email_suppressions')
        .select('suppression_type, reason')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error || !data) return null;

      return data.reason || data.suppression_type;
    } catch (error) {
      console.error('Error getting suppression reason:', error);
      return null;
    }
  },

  /**
   * Add email to suppression list
   */
  async suppressEmail(
    email: string,
    type: 'bounce_hard' | 'bounce_soft' | 'spam_complaint' | 'unsubscribe' | 'manual',
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAny
        .from('email_suppressions')
        .insert({
          email: email.toLowerCase(),
          suppression_type: type,
          reason: reason,
          bounce_date: new Date().toISOString()
        });

      if (error) {
        console.error('Error suppressing email:', error);
      }
    } catch (error) {
      console.error('Error in suppressEmail:', error);
    }
  },

  /**
   * Remove from suppression list (for re-verification)
   */
  async unsuppressEmail(email: string): Promise<void> {
    try {
      const { error } = await supabaseAny
        .from('email_suppressions')
        .delete()
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Error unsuppressing email:', error);
      }
    } catch (error) {
      console.error('Error in unsuppressEmail:', error);
    }
  },

  /**
   * Get all suppressions
   */
  async getAllSuppressions(): Promise<EmailSuppression[]> {
    try {
      const { data, error } = await supabaseAny
        .from('email_suppressions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suppressions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllSuppressions:', error);
      return [];
    }
  },

  /**
   * Track email delivery
   */
  async trackDelivery(params: {
    email: string;
    messageId?: string;
    recipientType: 'lead' | 'customer' | 'registration';
    recipientId?: string;
    emailType: 'confirmation' | 'marketing' | 'transactional' | 'notification';
    subject: string;
    status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam';
    postmarkData?: any;
  }): Promise<void> {
    try {
      const { error } = await supabaseAny
        .from('email_deliveries')
        .insert({
          email: params.email.toLowerCase(),
          message_id: params.messageId,
          recipient_type: params.recipientType,
          recipient_id: params.recipientId,
          email_type: params.emailType,
          subject: params.subject,
          status: params.status || 'sent',
          postmark_data: params.postmarkData
        });

      if (error) {
        console.error('Error tracking email delivery:', error);
      }
    } catch (error) {
      console.error('Error in trackDelivery:', error);
    }
  }
};
