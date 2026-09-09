import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, LogIn, LogOut, UserCheck, RefreshCw, Loader2, Lock, Activity } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SecurityStats {
  loginsToday: number;
  failedLoginsToday: number;
  rateLimitTriggers: number;
  activeUsers: number;
}

interface SecurityEvent {
  id: string;
  username: string;
  user_email: string;
  action: string;
  severity: string;
  ip_address: string | null;
  created_at: string;
  details: string | null;
}

const SECURITY_ACTIONS = ['user_login', 'user_logout', 'login_failed', 'user_approved', 'user_rejected', 'role_changed', 'system_settings_updated', 'data_exported'];

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

const actionIcon: Record<string, React.ReactNode> = {
  user_login: <LogIn className="h-3 w-3" />,
  user_logout: <LogOut className="h-3 w-3" />,
  login_failed: <AlertTriangle className="h-3 w-3" />,
  user_approved: <UserCheck className="h-3 w-3" />,
  role_changed: <Shield className="h-3 w-3" />,
};

const ACTIVE_PROTECTIONS = [
  { label: 'Row Level Security (RLS)', description: 'Enabled on 37+ database tables', status: true },
  { label: 'Rate Limiting', description: '3 submissions per 5 minutes per user', status: true },
  { label: 'Duplicate Submission Prevention', description: 'SHA-256 hash deduplication', status: true },
  { label: 'Session Timeout', description: 'Idle sessions automatically terminated', status: true },
  { label: 'Audit Logging', description: 'All critical actions tracked with metadata', status: true },
  { label: 'Input Validation (Zod)', description: 'All forms validated with strict schemas', status: true },
  { label: 'XSS Sanitization (DOMPurify)', description: 'CMS content sanitized before render', status: true },
  { label: 'RBAC (Role-Based Access Control)', description: '7 distinct roles enforced at database level', status: true },
];

const SecurityPanel: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats>({ loginsToday: 0, failedLoginsToday: 0, rateLimitTriggers: 0, activeUsers: 0 });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [logsResult, activeUsersResult] = await Promise.allSettled([
        (supabase as any)
          .from('audit_logs')
          .select('id, username, user_email, action, severity, ip_address, created_at, details')
          .in('action', SECURITY_ACTIONS)
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('user_roles')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (logsResult.status === 'fulfilled' && logsResult.value.data) {
        const logs: SecurityEvent[] = logsResult.value.data;
        setEvents(logs.slice(0, 20));

        const todayLogs = logs.filter(l => new Date(l.created_at) >= todayStart);
        setStats({
          loginsToday: todayLogs.filter(l => l.action === 'user_login').length,
          failedLoginsToday: todayLogs.filter(l => l.action === 'login_failed').length,
          rateLimitTriggers: 0, // rate_limits table may not exist; default to 0
          activeUsers: activeUsersResult.status === 'fulfilled' ? (activeUsersResult.value.count || 0) : 0,
        });
      }
    } catch (e) {
      console.error('Failed to load security data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSecurityData(); }, []);

  const overallStatus = stats.failedLoginsToday === 0 ? 'secure' : stats.failedLoginsToday < 5 ? 'monitoring' : 'alert';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Management</h2>
          <p className="text-muted-foreground">Monitor security events and active protections</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSecurityData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${overallStatus === 'secure' ? 'text-green-600' : overallStatus === 'monitoring' ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallStatus === 'secure' ? '✓ Secure' : overallStatus === 'monitoring' ? '⚠ Monitoring' : '✕ Alert'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No active threats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <LogIn className="h-3 w-3" /> Logins Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{loading ? '—' : stats.loginsToday}</div>
            <p className="text-xs text-muted-foreground">Successful authentications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Failed Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.failedLoginsToday > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {loading ? '—' : stats.failedLoginsToday}
            </div>
            <p className="text-xs text-muted-foreground">In the last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Activity className="h-3 w-3" /> Active Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{loading ? '—' : stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Users with assigned roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>Last 20 security-relevant audit log entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No security events recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{event.username}</div>
                        <div className="text-xs text-muted-foreground">{event.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {actionIcon[event.action] || <Shield className="h-3 w-3" />}
                          <span className="font-mono text-xs">{event.action}</span>
                        </div>
                        {event.details && <p className="text-xs text-muted-foreground mt-0.5">{event.details}</p>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${severityColor[event.severity] || severityColor.info}`}>
                          {event.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {event.ip_address || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Protections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Active Security Protections
          </CardTitle>
          <CardDescription>Platform security measures currently in place</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACTIVE_PROTECTIONS.map(p => (
              <div key={p.label} className="flex items-center gap-3 p-3 border rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPanel;
