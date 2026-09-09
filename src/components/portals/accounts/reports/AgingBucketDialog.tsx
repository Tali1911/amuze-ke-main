import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Mail, Phone, User, Activity as ActivityIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ARAgingItem, financialReportService } from '@/services/financialReportService';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bucketLabel: string;
  items: ARAgingItem[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(value);

const AgingBucketDialog: React.FC<Props> = ({ open, onOpenChange, bucketLabel, items }) => {
  const total = items.reduce((s, i) => s + i.balanceDue, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>{bucketLabel}</span>
            <Badge variant="outline" className="text-sm">
              {items.length} item{items.length === 1 ? '' : 's'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Total outstanding: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={items.length === 0}
            onClick={() => financialReportService.exportAgingBucketToCSV(items, bucketLabel)}
          >
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={items.length === 0}
            onClick={() => financialReportService.exportAgingBucketToPDF(items, bucketLabel)}
          >
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No items in this bucket for the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={`${item.source}-${item.invoiceId}`} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{item.customerName}</span>
                        <Badge variant={item.source === 'invoice' ? 'secondary' : 'outline'} className="text-[10px]">
                          {item.source === 'invoice' ? 'Invoice' : 'Collection'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.invoiceNumber}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.childName && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.childName}</span>
                        )}
                        {item.activityName && (
                          <span className="flex items-center gap-1"><ActivityIcon className="h-3 w-3" />{item.activityName}</span>
                        )}
                        {item.customerPhone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.customerPhone}</span>
                        )}
                        {item.customerEmail && (
                          <span className="flex items-center gap-1 truncate max-w-[220px]"><Mail className="h-3 w-3" />{item.customerEmail}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.source === 'invoice' ? 'Due' : 'Created'}: {item.dueDate ? format(parseISO(item.dueDate), 'dd MMM yyyy') : '—'}
                        {item.daysOverdue > 0 && ` • ${item.daysOverdue} days overdue`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground">{formatCurrency(item.balanceDue)}</p>
                      <p className="text-xs text-muted-foreground">of {formatCurrency(item.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AgingBucketDialog;
