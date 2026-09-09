import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { navigationService, NavigationSetting } from '@/services/navigationService';
import { Eye, EyeOff, Loader2, ArrowUp, ArrowDown, Check, X, Pencil } from 'lucide-react';
import { auditLogService } from '@/services/auditLogService';

const NavigationManager: React.FC = () => {
  const [settings, setSettings] = useState<NavigationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

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
      const reloadedData = await navigationService.getNavigationSettings();
      setSettings(reloadedData);
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
          new_value: actualValue,
        },
        severity: 'info',
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

  const startEditing = (setting: NavigationSetting) => {
    setEditingKey(setting.nav_key);
    setEditingValue(setting.label);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const saveLabel = async (setting: NavigationSetting) => {
    const newLabel = editingValue.trim();
    if (!newLabel) {
      toast({ title: 'Label cannot be empty', variant: 'destructive' });
      return;
    }
    if (newLabel === setting.label) {
      cancelEditing();
      return;
    }

    setUpdating(setting.nav_key);
    const success = await navigationService.updateNavigationLabel(setting.nav_key, newLabel);
    if (success) {
      const reloaded = await navigationService.getNavigationSettings();
      setSettings(reloaded);
      await auditLogService.logEvent({
        action: 'navigation_label_changed',
        entityType: 'navigation',
        entityId: setting.nav_key,
        details: `Renamed navigation "${setting.label}" to "${newLabel}"`,
        metadata: {
          nav_key: setting.nav_key,
          previous_label: setting.label,
          new_label: newLabel,
        },
        severity: 'info',
      });
      toast({ title: 'Label Updated', description: `Renamed to "${newLabel}".` });
      cancelEditing();
    } else {
      toast({
        title: 'Update Failed',
        description: 'Could not rename navigation item. Please check your permissions.',
        variant: 'destructive',
      });
    }
    setUpdating(null);
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= settings.length) return;

    const a = settings[index];
    const b = settings[swapIndex];

    // Optimistic reorder
    const next = [...settings];
    next[index] = { ...b, display_order: a.display_order };
    next[swapIndex] = { ...a, display_order: b.display_order };
    setSettings(next);
    setUpdating(a.nav_key);

    const success = await navigationService.updateNavigationOrder([
      { nav_key: a.nav_key, display_order: b.display_order },
      { nav_key: b.nav_key, display_order: a.display_order },
    ]);

    if (success) {
      const reloaded = await navigationService.getNavigationSettings();
      setSettings(reloaded);
      await auditLogService.logEvent({
        action: 'navigation_order_changed',
        entityType: 'navigation',
        entityId: a.nav_key,
        details: `Moved "${a.label}" ${direction}`,
        metadata: {
          nav_key: a.nav_key,
          swapped_with: b.nav_key,
          direction,
        },
        severity: 'info',
      });
    } else {
      // Rollback
      setSettings(settings);
      toast({
        title: 'Reorder Failed',
        description: 'Could not update navigation order. Please check your permissions.',
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
        <CardTitle>Navigation Menu</CardTitle>
        <CardDescription>
          Rename tabs, change their order, and control visibility. The pages each tab links to
          remain unchanged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {settings.map((setting, index) => {
            const isEditing = editingKey === setting.nav_key;
            const isBusy = updating === setting.nav_key;
            return (
              <div
                key={setting.nav_key}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Order controls */}
                <div className="flex sm:flex-col gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0 || isBusy}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === settings.length - 1 || isBusy}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Icon + label / editor */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {setting.is_visible ? (
                    <Eye className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveLabel(setting);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                          className="h-9"
                        />
                        <Button
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => saveLabel(setting)}
                          disabled={isBusy}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          onClick={cancelEditing}
                          disabled={isBusy}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <Label
                            className={`font-medium block truncate ${
                              setting.is_visible ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {setting.label}
                          </Label>
                          <p className="text-xs text-muted-foreground truncate">
                            Key: <code>{setting.nav_key}</code>
                            {' · '}
                            {setting.is_visible ? 'Visible to public' : 'Hidden from public'}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditing(setting)}
                          disabled={isBusy}
                          aria-label="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility switch */}
                <div className="flex items-center gap-2 sm:ml-auto">
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Switch
                    id={`nav-${setting.nav_key}`}
                    checked={setting.is_visible}
                    onCheckedChange={() =>
                      handleToggleVisibility(setting.nav_key, setting.is_visible)
                    }
                    disabled={isBusy || isEditing}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationManager;
