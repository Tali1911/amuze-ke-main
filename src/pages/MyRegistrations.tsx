import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';
import { myRegistrationsService, MyRegistrationRow } from '@/services/myRegistrationsService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  CreditCard,
  Hash,
  Phone,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import PayWithPaystackButton from '@/components/payments/PayWithPaystackButton';

const CAMP_TYPE_LABELS: Record<string, string> = {
  easter: 'Easter Camp',
  summer: 'Summer Camp',
  'end-year': 'End of Year Camp',
  'mid-term-1': 'Mid-Term 1',
  'mid-term-2': 'Mid-Term 2',
  'mid-term-3': 'Mid-Term 3',
  'mid-term-october': 'October Mid-Term',
  'mid-term-feb-march': 'Feb/March Mid-Term',
  'day-camps': 'Day Camp',
  'little-forest': 'Little Forest',
};

const formatCampType = (raw: string) => {
  if (!raw) return 'Camp';
  if (CAMP_TYPE_LABELS[raw]) return CAMP_TYPE_LABELS[raw];
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatMoney = (n: number) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;

const PaymentBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || 'unpaid').toLowerCase();
  if (s === 'paid') {
    return (
      <Badge className="bg-forest-600 hover:bg-forest-700 text-white">Paid</Badge>
    );
  }
  if (s === 'partial') {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Partial
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">Unpaid</Badge>
  );
};

const DocTypeBadge: React.FC<{ row: MyRegistrationRow }> = ({ row }) => {
  const t = row.billing_doc_type || (row.payment_status === 'paid' ? 'paid' : 'quotation');
  if (t === 'paid') return null;
  if (t === 'invoice') {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
        Invoice {row.invoice_number ? `· ${row.invoice_number}` : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px]">
      Quotation {row.quote_number ? `· ${row.quote_number}` : ''}
    </Badge>
  );
};

const MyRegistrations: React.FC = () => {
  const { isSignedIn, isLoading: authLoading, user, profile } = useClientAuth();
  const [rows, setRows] = useState<MyRegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const lookupEmail = useMemo(
    () => (profile?.email || user?.email || '').trim(),
    [profile?.email, user?.email]
  );

  useEffect(() => {
    if (!isSignedIn || !lookupEmail) return;
    let cancelled = false;
    setLoading(true);
    myRegistrationsService
      .listByEmail(lookupEmail)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, lookupEmail, refreshKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <SEOHead
          title="My Registrations | Amuse Kenya"
          description="View your past camp registrations and payment status"
        />
        <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
          <Navbar />
          <div className="pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-md text-center space-y-6">
              <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/40" />
              <h1 className="text-2xl font-bold text-foreground">
                Sign in to view your registrations
              </h1>
              <p className="text-muted-foreground">
                Once signed in you can see every camp you've registered for and the current
                payment status.
              </p>
              <GoogleSignInButton />
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const totalPaid = rows.reduce(
    (sum, r) => sum + Number(r.amount_paid ?? 0),
    0
  );
  const totalOutstanding = rows.reduce(
    (sum, r) => sum + Number(r.amount_remaining ?? r.total_amount ?? 0),
    0
  );

  return (
    <>
      <SEOHead
        title="My Registrations | Amuse Kenya"
        description="Your past camp registrations and payment status"
      />
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link
                to="/my-profile"
                className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 font-medium"
              >
                <ArrowLeft size={20} />
                Back to Profile
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  My Registrations
                </CardTitle>
                <CardDescription>
                  Showing registrations linked to <strong>{lookupEmail}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Total registrations</p>
                    <p className="text-2xl font-bold text-foreground">{rows.length}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Total paid</p>
                    <p className="text-2xl font-bold text-forest-700">
                      {formatMoney(totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatMoney(totalOutstanding)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading && rows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Loading your registrations...
                </CardContent>
              </Card>
            ) : rows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-foreground">
                    No registrations yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    When you register for a camp using <strong>{lookupEmail}</strong> it will
                    show up here automatically.
                  </p>
                  <Button asChild className="mt-2">
                    <Link to="/">Browse Camps</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rows.map((r) => {
                  const childCount = Array.isArray(r.children) ? r.children.length : 0;
                  return (
                    <Card key={r.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-foreground truncate">
                              {formatCampType(r.camp_type)}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Hash className="w-3 h-3" />
                              {r.registration_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <DocTypeBadge row={r} />
                            <PaymentBadge status={r.payment_status} />
                            <span className="text-base font-semibold text-foreground">
                              {formatMoney(r.total_amount)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{formatDate(r.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {childCount} {childCount === 1 ? 'child' : 'children'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate capitalize">
                              {r.payment_method?.replace(/_/g, ' ') || 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{r.parent_name}</span>
                          </div>
                        </div>

                        {childCount > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">
                              Children:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(r.children as any[]).map((c, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {c?.childName || c?.name || `Child ${i + 1}`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {(r.payment_status || '').toLowerCase() !== 'paid' && (
                          <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              {Number(r.amount_paid || 0) > 0 ? (
                                <>
                                  Paid{' '}
                                  <span className="font-semibold text-forest-700">
                                    {formatMoney(Number(r.amount_paid || 0))}
                                  </span>{' '}
                                  · Remaining{' '}
                                  <span className="font-semibold text-destructive">
                                    {formatMoney(
                                      Number(r.amount_remaining ?? r.total_amount) || 0
                                    )}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {(r.billing_doc_type === 'invoice') ? 'Invoice due ' : 'Quotation total '}
                                  <span className="font-semibold text-destructive">
                                    {formatMoney(Number(r.total_amount) || 0)}
                                  </span>
                                </>
                              )}
                            </div>
                            <PayWithPaystackButton
                              registrationId={r.id}
                              registrationNumber={r.registration_number}
                              email={r.email}
                              parentName={r.parent_name}
                              programName={formatCampType(r.camp_type)}
                              amountKES={
                                Number(r.amount_remaining ?? r.total_amount) || 0
                              }
                              size="sm"
                              label={
                                (r.payment_status || '').toLowerCase() === 'partial'
                                  ? `Pay Remaining (${formatMoney(
                                      Number(r.amount_remaining ?? r.total_amount) || 0
                                    )})`
                                  : 'Pay Now'
                              }
                              onPaid={() => setRefreshKey((k) => k + 1)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MyRegistrations;
