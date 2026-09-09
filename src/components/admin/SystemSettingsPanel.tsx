import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, Bell, Users, Wrench } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { auditLogService } from '@/services/auditLogService';
import { invalidateSystemSettings } from '@/hooks/useSystemSettings';

interface SettingValues {
  session_timeout_minutes: string;
  max_login_attempts: string;
  notify_on_registration: string;
  notify_on_payment: string;
  send_weekly_digest: string;
  admin_notification_email: string;
  accept_registrations: string;
  require_consent: string;
  default_camp_capacity: string;
  maintenance_mode: string;
  maintenance_message: string;
}

const DEFAULT_SETTINGS: SettingValues = {
  session_timeout_minutes: '60',
  max_login_attempts: '5',
  notify_on_registration: 'true',
  notify_on_payment: 'true',
  send_weekly_digest: 'false',
  admin_notification_email: '',
  accept_registrations: 'true',
  require_consent: 'true',
  default_camp_capacity: '20',
  maintenance_mode: 'false',
  maintenance_message: 'We are currently performing scheduled maintenance. Please check back soon.',
};

const SystemSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingValues>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('system_settings')
          .select('key, value');

        if (error) throw error;

        if (data && data.length > 0) {
          const loaded: Partial<SettingValues> = {};
          (data as { key: string; value: string }[]).forEach(row => {
            if (row.key in DEFAULT_SETTINGS) {
              (loaded as any)[row.key] = row.value ?? DEFAULT_SETTINGS[row.key as keyof SettingValues];
            }
          });
          setSettings({ ...DEFAULT_SETTINGS, ...loaded });
        }
      } catch (e) {
        console.error('Failed to load system settings:', e);
        toast({ title: 'Error', description: 'Could not load system settings.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const set = (key: keyof SettingValues, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggle = (key: keyof SettingValues) => {
    setSettings(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Save each setting individually to handle both insert and update
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await (supabase as any)
          .from('system_settings')
          .upsert(
            { key, value, updated_by: userId, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );

        if (error) {
          console.error(`Failed to save setting "${key}":`, error);
          throw error;
        }
      }

      await auditLogService.logEvent({
        action: 'system_settings_updated',
        entityType: 'system',
        details: 'System settings updated',
        severity: 'warning',
      });

      invalidateSystemSettings();
      toast({ title: 'Settings Saved', description: 'System settings have been updated successfully.' });
    } catch (e: any) {
      console.error('Failed to save settings:', e);
      toast({ title: 'Error', description: e?.message || 'Failed to save settings. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide system behaviour</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      {/* Session & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Session & Security
          </CardTitle>
          <CardDescription>Control session behaviour and login security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Auto-Logout After Inactivity</Label>
              <Select
                value={
                  ['5','10','15','30','60','120','240','480'].includes(settings.session_timeout_minutes)
                    ? settings.session_timeout_minutes
                    : 'custom'
                }
                onValueChange={v => {
                  if (v === 'custom') return;
                  set('session_timeout_minutes', v);
                }}
              >
                <SelectTrigger id="session_timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                max="1440"
                value={settings.session_timeout_minutes}
                onChange={e => set('session_timeout_minutes', e.target.value)}
                placeholder="Minutes"
              />
              <p className="text-xs text-muted-foreground">
                Admin and portal users are automatically signed out after this many minutes of inactivity.
                A 30-second warning is shown beforehand. Takes effect on next page load.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_logins">Max Login Attempts</Label>
              <Input
                id="max_logins"
                type="number"
                min="1"
                max="20"
                value={settings.max_login_attempts}
                onChange={e => set('max_login_attempts', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Number of failed attempts before rate limiting kicks in</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email & Notifications
          </CardTitle>
          <CardDescription>Manage automated email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">New Registration Notification</p>
              <p className="text-xs text-muted-foreground">Send admin email when a new registration is submitted</p>
            </div>
            <Switch checked={settings.notify_on_registration === 'true'} onCheckedChange={() => toggle('notify_on_registration')} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Payment Received Notification</p>
              <p className="text-xs text-muted-foreground">Send admin email when a payment is recorded</p>
            </div>
            <Switch checked={settings.notify_on_payment === 'true'} onCheckedChange={() => toggle('notify_on_payment')} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Weekly Digest Email</p>
              <p className="text-xs text-muted-foreground">Send a weekly summary of registrations, payments, and activity</p>
            </div>
            <Switch checked={settings.send_weekly_digest === 'true'} onCheckedChange={() => toggle('send_weekly_digest')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_email">Admin Notification Email</Label>
            <Input
              id="admin_email"
              type="email"
              placeholder="admin@amusekenya.co.ke"
              value={settings.admin_notification_email}
              onChange={e => set('admin_notification_email', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">All system notifications will be sent to this address</p>
          </div>
        </CardContent>
      </Card>

      {/* Registration & Booking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registration & Booking
          </CardTitle>
          <CardDescription>Control registration behaviour across all programs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Accept New Registrations</p>
              <p className="text-xs text-muted-foreground">When disabled, all registration forms will be closed</p>
            </div>
            <Switch checked={settings.accept_registrations === 'true'} onCheckedChange={() => toggle('accept_registrations')} />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Require Consent Checkbox</p>
              <p className="text-xs text-muted-foreground">All forms must include and require a consent acknowledgement</p>
            </div>
            <Switch checked={settings.require_consent === 'true'} onCheckedChange={() => toggle('require_consent')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camp_capacity">Default Camp Capacity</Label>
            <Input
              id="camp_capacity"
              type="number"
              min="1"
              max="500"
              value={settings.default_camp_capacity}
              onChange={e => set('default_camp_capacity', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default maximum number of participants per camp</p>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Show a maintenance banner on the public site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Enable Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Displays a maintenance notice to public visitors</p>
            </div>
            <Switch checked={settings.maintenance_mode === 'true'} onCheckedChange={() => toggle('maintenance_mode')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance_msg">Maintenance Message</Label>
            <Textarea
              id="maintenance_msg"
              rows={3}
              value={settings.maintenance_message}
              onChange={e => set('maintenance_message', e.target.value)}
              placeholder="We are currently performing maintenance..."
            />
            <p className="text-xs text-muted-foreground">This message is displayed to visitors when maintenance mode is active</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default SystemSettingsPanel;
