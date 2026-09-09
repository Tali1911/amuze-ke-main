import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, User, Mail, Phone, Calendar } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { CampRegistration } from '@/types/campRegistration';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RegistrationScan = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [registration, setRegistration] = useState<CampRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRegistration = async () => {
      if (!qrCode) {
        setError('Invalid QR code');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Parse QR code data
        const qrData = qrCodeService.parseQRCodeData(decodeURIComponent(qrCode));
        
        if (!qrData || qrData.type !== 'camp_registration') {
          setError('Invalid QR code format');
          return;
        }

        // Fetch registration by ID
        const data = await campRegistrationService.getRegistrationById(qrData.id);
        setRegistration(data);
      } catch (err) {
        console.error('Error loading registration:', err);
        setError('Registration not found');
      } finally {
        setLoading(false);
      }
    };

    loadRegistration();
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading registration...</span>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="ml-2">
                  {error || 'Registration not found'}
                </AlertDescription>
              </Alert>
              <div className="text-center mt-6">
                <Link to="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Registration Verified
              </CardTitle>
              <Badge variant={registration.payment_status === 'paid' ? 'default' : 'secondary'}>
                {registration.payment_status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Registration Number */}
            <div className="bg-primary/5 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Registration Number</p>
              <p className="text-2xl font-bold text-primary font-mono">
                {registration.registration_number}
              </p>
            </div>

            {/* Camp Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Camp Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Camp Type</p>
                  <p className="font-medium capitalize">{registration.camp_type.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{registration.status}</Badge>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Parent/Guardian Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{registration.parent_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{registration.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{registration.phone}</p>
                </div>
              </div>
            </div>

            {/* Children Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Registered Children</h3>
              <div className="space-y-3">
                {registration.children.map((child, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-lg">{child.childName}</h4>
                      <Badge variant="secondary">{child.ageRange}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Days: </span>
                        <span>{child.selectedDays?.length || 0} days</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sessions: </span>
                        <span className="capitalize">
                          {Array.isArray(child.selectedSessions)
                            ? child.selectedSessions.join(', ')
                            : Object.entries(child.selectedSessions as Record<string, 'half' | 'full'>)
                                .map(([date, session]) => `${session}`)
                                .join(', ')
                          }
                        </span>
                      </div>
                    </div>
                    {child.specialNeeds && (
                      <div className="bg-accent/50 p-2 rounded text-sm">
                        <span className="font-medium">Special Needs: </span>
                        {child.specialNeeds}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Payment Information</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    KES {registration.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant={registration.payment_status === 'paid' ? 'default' : 'destructive'}>
                    {registration.payment_status.toUpperCase()}
                  </Badge>
                </div>
                {registration.payment_method !== 'pending' && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="capitalize">{registration.payment_method.replace('_', ' ')}</span>
                  </div>
                )}
                {registration.payment_reference && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-sm">{registration.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Registered on {new Date(registration.created_at!).toLocaleString()}</span>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <Link to="/">
                <Button variant="outline">Return to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default RegistrationScan;
