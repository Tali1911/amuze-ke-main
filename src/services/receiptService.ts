import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'expense-receipts';
const tbl = () => (supabase as any).from('receipt_uploads');

export interface ReceiptUpload {
  id: string;
  file_url: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  vendor_hint?: string;
  amount_hint?: number;
  receipt_date?: string;
  notes?: string;
  expense_id?: string | null;
  status: 'unmatched' | 'matched' | 'archived';
  uploaded_by?: string;
  uploaded_at: string;
  matched_by?: string;
  matched_at?: string;
}

export const receiptService = {
  /** Upload a file to the expense-receipts bucket and return the public URL. */
  async uploadFile(file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'bin';
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  },

  async createUpload(record: Partial<ReceiptUpload>): Promise<ReceiptUpload> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await tbl()
      .insert({ ...record, uploaded_by: user?.id, status: record.status || 'unmatched' })
      .select()
      .single();
    if (error) throw error;
    return data as ReceiptUpload;
  },

  async listUploads(status?: ReceiptUpload['status']): Promise<ReceiptUpload[]> {
    let q = tbl().select('*').order('uploaded_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as ReceiptUpload[];
  },

  async matchToExpense(uploadId: string, expenseId: string, fileUrl: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e1 } = await (supabase as any)
      .from('expenses')
      .update({ receipt_url: fileUrl })
      .eq('id', expenseId);
    if (e1) throw e1;
    const { error: e2 } = await tbl()
      .update({
        expense_id: expenseId,
        status: 'matched',
        matched_at: new Date().toISOString(),
        matched_by: user?.id,
      })
      .eq('id', uploadId);
    if (e2) throw e2;
  },

  async unmatch(uploadId: string): Promise<void> {
    const { error } = await tbl()
      .update({ expense_id: null, status: 'unmatched', matched_at: null, matched_by: null })
      .eq('id', uploadId);
    if (error) throw error;
  },

  async archive(uploadId: string): Promise<void> {
    const { error } = await tbl().update({ status: 'archived' }).eq('id', uploadId);
    if (error) throw error;
  },

  async deleteUpload(uploadId: string): Promise<void> {
    const { error } = await tbl().delete().eq('id', uploadId);
    if (error) throw error;
  },
};
