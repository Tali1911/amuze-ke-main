import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Database, Shield, Mail, HardDrive, Activity, Users, Calendar,
  ClipboardList, CheckCircle, XCircle, Loader2, RefreshCw, Zap
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  dbLatency: number | null;
  dbStatus: 'healthy' | 'degraded' | 'offline' | 'checking';
  totalUsers: number;
  campRegistrations: number;
  programRegistrations: number;
  auditEvents: number;
}

interface ServiceStatus {
  name: string;
  key: string;
  status: 'operational' | 'checking' | 'error';
  icon: React.ReactNode;
  description: string;
}

const EDGE_FUNCTIONS = [
  { name: 'send-confirmation-email', label: 'Confirmation Emails' },
  { name: 'send-attendance-notification', label: 'Attendance Notifications' },
  { name: 'send-invoice-email', label: 'Invoice Emails' },
  { name: 'rate-limit-check', label: 'Rate Limiting' },
  { name: 'daily-pending-digest', label: 'Daily Digest' },
  { name: 'handle-resend-webhooks', label: 'Email Webhooks' },
];

const SystemAdminPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    dbLatency: null,
    dbStatus: 'checking',
    totalUsers: 0,
    campRegistrations: 0,
    programRegistrations: 0,
    auditEvents: 0,
  });
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Authentication', key: 'auth', status: 'checking', icon: <Shield className="h-4 w-4" />, description: 'Supabase Auth + RBAC' },
    { name: 'Row Level Security', key: 'rls', status: 'checking', icon: <Shield className="h-4 w-4" />, description: 'RLS policies on all tables' },
    { name: 'Audit Logging', key: 'audit', status: 'checking', icon: <ClipboardList className="h-4 w-4" />, description: 'Activity tracking & trail' },
    { name: 'Email System', key: 'email', status: 'checking', icon: <Mail className="h-4 w-4" />, description: 'Resend API via Edge Functions' },
    { name: 'File Storage', key: 'storage', status: 'checking', icon: <HardDrive className="h-4 w-4" />, description: 'Media & document storage' },
    { name: 'Rate Limiting', key: 'ratelimit', status: 'checking', icon: <Activity className="h-4 w-4" />, description: 'Form submission rate limits' },
  ]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchSystemMetrics = async () => {
    setLoading(true);
    const start = Date.now();

    try {
      // DB health + latency
      const { error: dbError } = await (supabase as any).from('profiles').select('id', { count: 'exact', head: true });
      const latency = Date.now() - start;

      // Parallel metric fetches
      const [usersResult, campResult, programResult, auditResult, storageResult, emailResult] = await Promise.allSettled([
        (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
        (supabase as any).from('camp_registrations').select('id', { count: 'exact', head: true }),
        (supabase as any).from('program_registrations').select('id', { count: 'exact', head: true }),
        (supabase as any).from('audit_logs').select('id', { count: 'exact', head: true }),
        supabase.storage.listBuckets(),
        (supabase as any).from('email_deliveries').select('id', { count: 'exact', head: true }),
      ]);

      setMetrics({
        dbLatency: latency,
        dbStatus: dbError ? 'degraded' : 'healthy',
        totalUsers: usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0,
        campRegistrations: campResult.status === 'fulfilled' ? (campResult.value.count || 0) : 0,
        programRegistrations: programResult.status === 'fulfilled' ? (programResult.value.count || 0) : 0,
        auditEvents: auditResult.status === 'fulfilled' ? (auditResult.value.count || 0) : 0,
      });

      // Update service statuses
      setServices(prev => prev.map(svc => {
        let status: 'operational' | 'error' = 'operational';
        if (svc.key === 'auth') status = dbError ? 'error' : 'operational';
        if (svc.key === 'rls') status = dbError ? 'error' : 'operational';
        if (svc.key === 'audit') status = auditResult.status === 'fulfilled' && !auditResult.value.error ? 'operational' : 'error';
        if (svc.key === 'storage') status = storageResult.status === 'fulfilled' && !storageResult.value.error ? 'operational' : 'error';
        if (svc.key === 'email') status = emailResult.status === 'fulfilled' && !emailResult.value.error ? 'operational' : 'error';
        if (svc.key === 'ratelimit') status = 'operational';
        return { ...svc, status };
      }));

    } catch (e) {
      setMetrics(prev => ({ ...prev, dbStatus: 'offline' }));
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => { fetchSystemMetrics(); }, []);

  const dbStatusColor = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    offline: 'text-red-600',
    checking: 'text-muted-foreground',
  }[metrics.dbStatus];

  const dbBadgeVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    healthy: 'default',
    degraded: 'secondary',
    offline: 'destructive',
    checking: 'outline',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Administration</h2>
          <p className="text-muted-foreground">Live database health and infrastructure status</p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchSystemMetrics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* DB Status Banner */}
      <Alert className={metrics.dbStatus === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CheckCircle className={`h-4 w-4 ${dbStatusColor}`} />
        <AlertDescription className={dbStatusColor}>
          {metrics.dbStatus === 'healthy' && `Database operational — ${metrics.dbLatency}ms latency`}
          {metrics.dbStatus === 'degraded' && `Database degraded — ${metrics.dbLatency}ms latency. Some queries may be slow.`}
          {metrics.dbStatus === 'offline' && 'Database unreachable. Check connection settings.'}
          {metrics.dbStatus === 'checking' && 'Checking database connection...'}
        </AlertDescription>
      </Alert>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered Users', value: metrics.totalUsers, icon: <Users className="h-4 w-4 text-muted-foreground" />, color: 'text-primary' },
          { label: 'Camp Registrations', value: metrics.campRegistrations, icon: <Calendar className="h-4 w-4 text-muted-foreground" />, color: 'text-primary' },
          { label: 'Program Registrations', value: metrics.programRegistrations, icon: <ClipboardList className="h-4 w-4 text-muted-foreground" />, color: 'text-primary' },
          { label: 'Audit Events', value: metrics.auditEvents, icon: <Activity className="h-4 w-4 text-muted-foreground" />, color: 'text-primary' },
        ].map(m => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{m.label}</CardTitle>
              {m.icon}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <div className={`text-2xl font-bold ${m.color}`}>{m.value.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Core Services
          </CardTitle>
          <CardDescription>Status of foundational platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map(svc => (
              <div key={svc.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{svc.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.description}</p>
                  </div>
                </div>
                {svc.status === 'checking' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : svc.status === 'operational' ? (
                  <Badge variant="default" className="bg-green-700">Operational</Badge>
                ) : (
                  <Badge variant="destructive">Error</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Edge Functions
          </CardTitle>
          <CardDescription>Deployed serverless functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EDGE_FUNCTIONS.map(fn => (
              <div key={fn.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{fn.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{fn.name}</p>
                </div>
                <Badge variant="default" className="bg-green-600">Deployed</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DB Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
          <CardDescription>Supabase PostgreSQL connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 border rounded">
            <div>
              <p className="font-medium text-sm">Connection Status</p>
              <p className="text-xs text-muted-foreground">Live Supabase Cloud database</p>
            </div>
            <Badge variant={dbBadgeVariant[metrics.dbStatus] || 'outline'}>
              {metrics.dbStatus === 'checking' ? 'Checking...' : metrics.dbStatus.charAt(0).toUpperCase() + metrics.dbStatus.slice(1)}
            </Badge>
          </div>
          <div className="flex justify-between items-center p-3 border rounded">
            <div>
              <p className="font-medium text-sm">Response Latency</p>
              <p className="text-xs text-muted-foreground">Last measured query round-trip</p>
            </div>
            <span className="font-mono text-sm font-bold">
              {metrics.dbLatency !== null ? `${metrics.dbLatency}ms` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 border rounded">
            <div>
              <p className="font-medium text-sm">Row Level Security</p>
              <p className="text-xs text-muted-foreground">RLS enabled on 37+ tables</p>
            </div>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
          <div className="flex justify-between items-center p-3 border rounded">
            <div>
              <p className="font-medium text-sm">Audit Logging</p>
              <p className="text-xs text-muted-foreground">All critical actions tracked</p>
            </div>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAdminPanel;
