import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { navigationService, NavigationSetting } from '@/services/navigationService';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { auditLogService } from '@/services/auditLogService';

const NavigationManager: React.FC = () => {
  const [settings, setSettings] = useState<NavigationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await navigationService.getNavigationSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleToggleVisibility = async (navKey: string, currentValue: boolean) => {
    setUpdating(navKey);
    const newValue = !currentValue;
    
    const success = await navigationService.updateNavigationVisibility(navKey, newValue);
    
    if (success) {
      // Reload settings from database to ensure sync
      const reloadedData = await navigationService.getNavigationSettings();
      setSettings(reloadedData);
      
      // Use the actual value from the reloaded settings
      const updatedSetting = reloadedData.find(s => s.nav_key === navKey);
      const actualValue = updatedSetting?.is_visible ?? newValue;
      
      await auditLogService.logEvent({
        action: 'navigation_visibility_changed',
        entityType: 'navigation',
        entityId: navKey,
        details: `Changed ${updatedSetting?.label} visibility to ${actualValue ? 'visible' : 'hidden'}`,
        metadata: {
          nav_key: navKey,
          label: updatedSetting?.label,
          previous_value: currentValue,
          new_value: actualValue
        },
        severity: 'info'
      });
      
      toast({
        title: 'Navigation Updated',
        description: `${updatedSetting?.label} is now ${actualValue ? 'visible' : 'hidden'}.`,
      });
    } else {
      toast({
        title: 'Update Failed',
        description: 'Could not update navigation visibility. Please check your permissions.',
        variant: 'destructive',
      });
    }
    
    setUpdating(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation Visibility</CardTitle>
        <CardDescription>
          Control which navigation items are visible to the public
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.nav_key}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {setting.is_visible ? (
                  <Eye className="h-5 w-5 text-primary" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label
                    htmlFor={`nav-${setting.nav_key}`}
                    className={`font-medium ${
                      setting.is_visible ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {setting.is_visible ? 'Visible to public' : 'Hidden from public'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {updating === setting.nav_key && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  id={`nav-${setting.nav_key}`}
                  checked={setting.is_visible}
                  onCheckedChange={() =>
                    handleToggleVisibility(setting.nav_key, setting.is_visible)
                  }
                  disabled={updating === setting.nav_key}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationManager;
