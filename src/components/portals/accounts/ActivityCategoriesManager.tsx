import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Search, Pencil, Check, X, RefreshCw, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useActivityCategories } from '@/hooks/useActivityCategories';
import {
  activityCategoryService,
  ActivityConfig,
} from '@/services/activityCategoryService';

const normalizeKey = (label: string) =>
  label.toLowerCase().replace(/\s+/g, ' ').trim();

const ActivityCategoriesManager: React.FC = () => {
  const { config, isLoading, refresh, apply } = useActivityCategories();
  const [selected, setSelected] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [unmapped, setUnmapped] = useState<string[] | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [busy, setBusy] = useState(false);

  const sortedCategories = useMemo(
    () => [...config.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [config.categories],
  );

  const selectedKey = selected ? normalizeKey(selected) : null;
  const selectedAliases = selectedKey ? (config.aliases[selectedKey] || []) : [];

  const run = async (fn: () => Promise<ActivityConfig>, successMsg: string) => {
    setBusy(true);
    try {
      const next = await fn();
      apply(next);
      toast({ title: successMsg });
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async () => {
    const v = newCategory.trim();
    if (!v) return;
    await run(
      () => activityCategoryService.addCategory(config, v),
      `Added "${v}"`,
    );
    setNewCategory('');
  };

  const handleSaveEdit = async () => {
    if (!editingLabel) return;
    const v = editValue.trim();
    if (!v || v === editingLabel) {
      setEditingLabel(null);
      return;
    }
    await run(
      () => activityCategoryService.updateCategory(config, editingLabel, { label: v }),
      'Category renamed',
    );
    if (selected === editingLabel) setSelected(v);
    setEditingLabel(null);
  };

  const handleToggleActive = async (label: string, is_active: boolean) => {
    await run(
      () => activityCategoryService.updateCategory(config, label, { is_active }),
      is_active ? 'Category enabled' : 'Category hidden',
    );
  };

  const handleDelete = async (label: string) => {
    await run(
      () => activityCategoryService.deleteCategory(config, label),
      `Removed "${label}"`,
    );
    if (selected === label) setSelected(null);
    setConfirmDelete(null);
  };

  const handleAddAlias = async () => {
    if (!selected) return;
    const v = newAlias.trim();
    if (!v) return;
    await run(
      () => activityCategoryService.addAlias(config, selected, v),
      `Alias "${v}" added`,
    );
    setNewAlias('');
  };

  const handleRemoveAlias = async (alias: string) => {
    if (!selected) return;
    await run(
      () => activityCategoryService.removeAlias(config, selected, alias),
      'Alias removed',
    );
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const found = await activityCategoryService.discoverUnmappedAliases(config);
      setUnmapped(found);
      if (found.length === 0) {
        toast({ title: 'No unmapped values', description: 'Every camp_type in the database is already mapped.' });
      }
    } catch (err: any) {
      toast({ title: 'Scan failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleAssignUnmapped = async (alias: string) => {
    if (!selected) {
      toast({
        title: 'Pick a category first',
        description: 'Select the category on the left, then click an unmapped value to map it there.',
        variant: 'destructive',
      });
      return;
    }
    await run(
      () => activityCategoryService.addAlias(config, selected, alias),
      `Mapped "${alias}" → ${selected}`,
    );
    setUnmapped(prev => prev?.filter(a => a !== alias) || null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Activity Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage the categories used by Budget, Expense and Financial Report filters — and
            the underlying DB values (aliases) each one matches.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDiscover} disabled={discovering}>
            <Search className={`h-4 w-4 mr-2 ${discovering ? 'animate-pulse' : ''}`} />
            Scan unmapped
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>
              Click a category to manage its aliases. Inactive categories won't appear in dropdowns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="New category label (e.g. Mid-Term Camp (April))"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                disabled={busy}
              />
              <Button onClick={handleAddCategory} disabled={busy || !newCategory.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[420px] pr-2">
              <div className="space-y-1">
                {sortedCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No categories yet. Add one above.
                  </p>
                )}
                {sortedCategories.map(c => {
                  const active = c.is_active !== false;
                  const isSelected = selected === c.label;
                  const aliasCount = (config.aliases[normalizeKey(c.label)] || []).length;
                  const isEditing = editingLabel === c.label;
                  return (
                    <div
                      key={c.label}
                      className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      } ${!active ? 'opacity-60' : ''}`}
                    >
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left"
                        onClick={() => !isEditing && setSelected(c.label)}
                      >
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingLabel(null);
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">{c.label}</span>
                            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                              {aliasCount} alias{aliasCount === 1 ? '' : 'es'}
                            </Badge>
                          </div>
                        )}
                      </button>

                      {isEditing ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit} disabled={busy}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingLabel(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Switch
                            checked={active}
                            onCheckedChange={(v) => handleToggleActive(c.label, v)}
                            disabled={busy}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingLabel(c.label);
                              setEditValue(c.label);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDelete(c.label)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Aliases panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Aliases {selected && <span className="text-muted-foreground font-normal">— {selected}</span>}
            </CardTitle>
            <CardDescription>
              Aliases are the raw values stored in DB columns like <code className="text-xs px-1 bg-muted rounded">camp_type</code> or <code className="text-xs px-1 bg-muted rounded">program_name</code> (e.g. <code className="text-xs px-1 bg-muted rounded">mid-term-feb-march</code>). Anything matching one of these aliases will be counted under this category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selected ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Select a category on the left to view and edit its aliases.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="New alias (e.g. mid-term-april)"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAlias()}
                    disabled={busy}
                  />
                  <Button onClick={handleAddAlias} disabled={busy || !newAlias.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedAliases.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No aliases yet. Add one above (e.g. the exact <code className="text-xs px-1 bg-muted rounded">camp_type</code> value used for this activity).
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedAliases.map(a => (
                      <Badge key={a} variant="outline" className="gap-1 pr-1 font-mono text-xs">
                        {a}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(a)}
                          className="ml-1 rounded hover:bg-muted p-0.5"
                          disabled={busy}
                          aria-label={`Remove ${a}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}

            {unmapped !== null && unmapped.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <Label className="text-sm font-medium text-foreground">Unmapped values found in DB</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {selected
                    ? <>Click a chip to map it to <strong>{selected}</strong>.</>
                    : 'Select a category on the left, then click a chip to map it.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {unmapped.map(a => (
                    <Badge
                      key={a}
                      variant="secondary"
                      className="cursor-pointer font-mono text-xs hover:bg-primary/20"
                      onClick={() => handleAssignUnmapped(a)}
                    >
                      + {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "<strong>{confirmDelete}</strong>" and all its aliases. Existing data is not affected, but reports will no longer roll up under this label.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityCategoriesManager;
