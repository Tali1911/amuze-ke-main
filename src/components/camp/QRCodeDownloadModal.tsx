import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Mail, CheckCircle } from 'lucide-react';
import { CampRegistration } from '@/types/campRegistration';
import { qrCodeService } from '@/services/qrCodeService';
import { toast } from 'sonner';

interface QRCodeDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: CampRegistration;
  qrCodeDataUrl: string;
  registrationType: 'online_only' | 'online_paid';
}

export const QRCodeDownloadModal: React.FC<QRCodeDownloadModalProps> = ({
  open,
  onOpenChange,
  registration,
  qrCodeDataUrl,
  registrationType,
}) => {
  const [downloading, setDownloading] = useState(false);

  // Guard clause: Don't render if registration is null
  if (!registration) {
    return null;
  }

  const handleDownloadQR = async () => {
    try {
      setDownloading(true);
      const pdfType = registrationType === 'online_paid' ? 'receipt' : 'invoice';
      const blob = await qrCodeService.generateRegistrationPDF(
        registration,
        qrCodeDataUrl,
        pdfType
      );
      
      const filename = `amuse-${registration.registration_number}-${pdfType}.pdf`;
      qrCodeService.downloadPDF(blob, filename);
      
      toast.success(`${pdfType === 'receipt' ? 'Receipt' : 'Invoice'} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Registration Successful!
          </DialogTitle>
          <DialogDescription>
            Your registration has been confirmed. A confirmation email has been sent to {registration?.email || 'your email address'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto px-1 flex-1">{/* Added overflow-y-auto and px-1 for scrollbar spacing */}
          {/* Registration Number */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Registration Number</p>
            <p className="text-2xl font-bold text-primary">{registration.registration_number}</p>
          </div>

           {/* QR Code Display */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-lg border-2 border-primary/20">
              <img 
                src={qrCodeDataUrl} 
                alt="Registration QR Code" 
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Save this QR code for quick check-in at the camp
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleDownloadQR}
              disabled={downloading}
              className="w-full"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Downloading...' : `Download ${registrationType === 'online_paid' ? 'Receipt' : 'Invoice'} PDF`}
            </Button>
          </div>

          {/* Email Confirmation */}
          <div className="bg-accent/50 p-3 rounded-lg flex items-start gap-2">
            <Mail className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Email Sent</p>
              <p className="text-muted-foreground">
                A confirmation email with your registration details and QR code has been sent to your email address.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Camp Type:</span>
              <span className="font-medium capitalize">{registration.camp_type.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Children:</span>
              <span className="font-medium">{Array.isArray(registration.children) ? registration.children.length : 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">KES {registration.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Status:</span>
              <span className={`font-medium capitalize ${
                (registrationType === 'online_paid' || registration.payment_status === 'paid') ? 'text-green-600' : 'text-orange-600'
              }`}>
                {registrationType === 'online_paid' ? 'paid' : registration.payment_status}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full mt-2"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
