import { supabase } from '@/integrations/supabase/client';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  is_popular: boolean;
  display_order: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const faqService = {
  async getPublishedFAQs(): Promise<FAQItem[]> {
    const { data, error } = await (supabase as any)
      .from('faq_items')
      .select('*')
      .eq('status', 'published')
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  async getAllFAQs(): Promise<FAQItem[]> {
    const { data, error } = await (supabase as any)
      .from('faq_items')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  },

  async createFAQ(faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<FAQItem> {
    const { data, error } = await (supabase as any)
      .from('faq_items')
      .insert([faq])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFAQ(id: string, faq: Partial<FAQItem>): Promise<FAQItem> {
    const { data, error } = await (supabase as any)
      .from('faq_items')
      .update({ ...faq, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFAQ(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
