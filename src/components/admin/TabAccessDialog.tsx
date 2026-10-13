import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getTabsForRole, PORTAL_ROLES } from '@/components/PortalSidebar';
import { getRoleDisplayName } from '@/services/roleService';
import { tabAccessService, tabKey, TabAccessScope } from '@/services/tabAccessService';

const ALWAYS = new Set(['my-profile', 'communication', 'dashboard']);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TabAccessScope;
  /** user uuid for 'user', role for 'role' */
  scopeId: string;
  /** the department/role whose defaults apply */
  role: string;
  title: string;
}

const TabAccessDialog: React.FC<Props> = ({ open, onOpenChange, scope, scopeId, role, title }) => {
  const ownRole = role.toUpperCase();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasRule, setHasRule] = useState(false);
  const [inherited, setInherited] = useState<'department' | 'default'>('default');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const defaults = useMemo(
    () => getTabsForRole(ownRole, true).filter(t => !ALWAYS.has(t.id)).map(t => tabKey(ownRole, t.id)),
    [ownRole]
  );

  const groups = useMemo(() => {
    const ordered = [ownRole, ...PORTAL_ROLES.filter(p => p !== ownRole)];
    return ordered.map(portal => ({
      portal,
      tabs: getTabsForRole(portal, true).filter(t => !ALWAYS.has(t.id)),
    }));
  }, [ownRole]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    tabAccessService.getRulesFor(scope === 'user' ? scopeId : '00000000-0000-0000-0000-000000000000', ownRole)
      .then(r => {
        const own = scope === 'user' ? r.user : r.role;
        const fallback = scope === 'user' ? r.role : undefined;
        setHasRule(!!own);
        setInherited(fallback ? 'department' : 'default');
        setSelected(new Set(own ?? fallback ?? defaults));
      })
      .finally(() => setLoading(false));
  }, [open, scope, scopeId, ownRole, defaults]);

  const toggle = (key: string, on: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await tabAccessService.saveRule(scope, scopeId, Array.from(selected));
      toast({ title: 'Access saved', description: `${title} now sees ${selected.size} tab(s) plus Dashboard, Profile and Messages.` });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Could not save access',
        description: e?.message?.includes('staff_tab_access')
          ? 'The access settings table has not been set up yet. Run the tab access SQL script first.'
          : e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      await tabAccessService.resetRule(scope, scopeId);
      toast({ title: 'Access reset', description: scope === 'user' ? 'This staff member now follows their department settings.' : 'This department now uses the standard tabs.' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Could not reset access', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tab access — {title}</DialogTitle>
          <DialogDescription>
            Tick the tabs this {scope === 'user' ? 'staff member' : 'department'} can open. Dashboard, My Profile and Messages are always available.
            {!hasRule && !loading && (
              <span className="block mt-1">
                Currently using {inherited === 'department' ? 'the department settings' : 'the standard tabs for this role'}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Search tabs…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            groups.map(({ portal, tabs }) => {
              const visible = tabs.filter(t => !q || t.label.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
              if (!visible.length) return null;
              const keys = visible.map(t => tabKey(portal, t.id));
              const allOn = keys.every(k => selected.has(k));
              return (
                <div key={portal} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {getRoleDisplayName(portal)} {portal === ownRole && <Badge variant="outline" className="ml-1">Own department</Badge>}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(prev => {
                        const next = new Set(prev);
                        keys.forEach(k => (allOn ? next.delete(k) : next.add(k)));
                        return next;
                      })}
                    >
                      {allOn ? 'Clear all' : 'Select all'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visible.map(t => {
                      const key = tabKey(portal, t.id);
                      return (
                        <label key={key} className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-2">
                          <Checkbox checked={selected.has(key)} onCheckedChange={c => toggle(key, !!c)} className="mt-0.5" />
                          <span>
                            <span className="font-medium">{t.label}</span>
                            {t.description && <span className="block text-xs text-muted-foreground">{t.description}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter className="gap-2">
          {hasRule && (
            <Button variant="outline" onClick={reset} disabled={saving}>
              {scope === 'user' ? 'Use department settings' : 'Restore standard tabs'}
            </Button>
          )}
          <Button onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : 'Save access'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TabAccessDialog;
