import React, { useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { receiptService } from '@/services/receiptService';
import { financialService } from '@/services/financialService';
import { parseReceiptUrls, joinReceiptUrls } from '@/utils/receipts';
import { toast } from '@/hooks/use-toast';

interface Props {
  expenseId: string;
  receiptUrl?: string | null;
  onChanged: () => void | Promise<void>;
}

const ExpenseReceiptsCell: React.FC<Props> = ({ expenseId, receiptUrl, onChanged }) => {
  const [uploading, setUploading] = useState(false);
  const urls = parseReceiptUrls(receiptUrl);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files)) {
        const { url } = await receiptService.uploadFile(f);
        added.push(url);
      }
      await financialService.updateExpense(expenseId, { receipt_url: joinReceiptUrls([...urls, ...added]) });
      await onChanged();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {urls.map((u, i) => (
        <a key={u} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <Paperclip className="h-3 w-3" /> {urls.length > 1 ? `Receipt ${i + 1}` : 'Receipt'}
        </a>
      ))}
      <label className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
        <Upload className="h-3 w-3" /> {uploading ? 'Uploading…' : urls.length ? 'Add' : 'Attach'}
        <input
          type="file"
          multiple
          className="hidden"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={uploading}
          onChange={async (e) => { await handleFiles(e.target.files); e.target.value = ''; }}
        />
      </label>
    </div>
  );
};

export default ExpenseReceiptsCell;
