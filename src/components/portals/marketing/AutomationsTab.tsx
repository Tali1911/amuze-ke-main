import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Play, Pause, Trash2, RefreshCw, ArrowDown, Mail, Clock, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  marketingAutomationService,
  type MarketingAutomation,
  type AutomationStep,
  type AutomationTrigger,
} from '@/services/marketingAutomationService';
import { emailManagementService, type EmailTemplate } from '@/services/emailManagementService';

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  lead_created: 'New lead created',
  registration_created: 'Registration created',
  attendance_marked: 'Attendance marked',
  time_based: 'Time-based (cron)',
  manual: 'Manual enrolment',
};

const STATUS_COLORS: Record<MarketingAutomation['status'], string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-zinc-100 text-zinc-600',
};

interface EditorState {
  open: boolean;
  automation: Partial<MarketingAutomation> | null;
}

const emptyAutomation: Partial<MarketingAutomation> = {
  name: '',
  description: '',
  status: 'draft',
  trigger_type: 'lead_created',
  trigger_config: {},
  steps: [
    { type: 'send_email', subject: '', body_html: '' },
  ],
};

const AutomationsTab: React.FC = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<MarketingAutomation[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsMap, setStatsMap] = useState<Record<string, { active: number; completed: number; failed: number; cancelled: number }>>({});
  const [editor, setEditor] = useState<EditorState>({ open: false, automation: null });

  const load = async () => {
    setLoading(true);
    const [a, t] = await Promise.all([
      marketingAutomationService.list(),
      emailManagementService.getEmailTemplates?.() ?? Promise.resolve([] as EmailTemplate[]),
    ]);
    setAutomations(a);
    setTemplates(t || []);
    const stats: typeof statsMap = {};
    await Promise.all(a.map(async (au) => {
      stats[au.id] = await marketingAutomationService.stats(au.id);
    }));
    setStatsMap(stats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditor({ open: true, automation: { ...emptyAutomation } });
  const openEdit = (a: MarketingAutomation) => setEditor({ open: true, automation: { ...a } });

  const handleSave = async () => {
    const a = editor.automation;
    if (!a?.name || !a.trigger_type) {
      toast({ title: 'Missing fields', description: 'Name and trigger are required.', variant: 'destructive' });
      return;
    }
    try {
      await marketingAutomationService.save(a as any);
      toast({ title: 'Saved', description: `Automation "${a.name}" saved.` });
      setEditor({ open: false, automation: null });
      load();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const toggleStatus = async (a: MarketingAutomation) => {
    const next = a.status === 'active' ? 'paused' : 'active';
    try {
      await marketingAutomationService.setStatus(a.id, next);
      toast({ title: next === 'active' ? 'Activated' : 'Paused' });
      load();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (a: MarketingAutomation) => {
    if (!confirm(`Delete automation "${a.name}"? Enrollments will be removed.`)) return;
    await marketingAutomationService.remove(a.id);
    toast({ title: 'Deleted' });
    load();
  };

  const runNow = async () => {
    const res = await marketingAutomationService.runNow();
    if (res) toast({ title: 'Worker run', description: `Processed: ${res.processed}, errors: ${res.errors}` });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold">Marketing Automations</h2>
          <p className="text-gray-600">Trigger-based email sequences (drip campaigns, follow-ups, re-engagement).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runNow}>
            <RefreshCw className="h-4 w-4 mr-2" /> Run worker now
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> New Automation
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No automations yet. Create your first drip sequence or welcome series.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map(a => {
            const s = statsMap[a.id] ?? { active: 0, completed: 0, failed: 0, cancelled: 0 };
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Trigger: {TRIGGER_LABELS[a.trigger_type]} · {a.steps.length} step{a.steps.length === 1 ? '' : 's'}
                      </CardDescription>
                    </div>
                    <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a.description && (
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  )}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-blue-50">
                      <div className="font-semibold text-blue-700">{s.active}</div>
                      <div className="text-muted-foreground">Active</div>
                    </div>
                    <div className="p-2 rounded bg-green-50">
                      <div className="font-semibold text-green-700">{s.completed}</div>
                      <div className="text-muted-foreground">Done</div>
                    </div>
                    <div className="p-2 rounded bg-red-50">
                      <div className="font-semibold text-red-700">{s.failed}</div>
                      <div className="text-muted-foreground">Failed</div>
                    </div>
                    <div className="p-2 rounded bg-gray-50">
                      <div className="font-semibold text-gray-700">{s.cancelled}</div>
                      <div className="text-muted-foreground">Cancelled</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(a)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(a)}>
                      {a.status === 'active'
                        ? (<><Pause className="h-3 w-3 mr-1" />Pause</>)
                        : (<><Play className="h-3 w-3 mr-1" />Activate</>)}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(a)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AutomationEditor
        state={editor}
        templates={templates}
        onChange={(automation) => setEditor({ ...editor, automation })}
        onClose={() => setEditor({ open: false, automation: null })}
        onSave={handleSave}
      />
    </div>
  );
};

interface EditorProps {
  state: EditorState;
  templates: EmailTemplate[];
  onChange: (a: Partial<MarketingAutomation>) => void;
  onClose: () => void;
  onSave: () => void;
}

const AutomationEditor: React.FC<EditorProps> = ({ state, templates, onChange, onClose, onSave }) => {
  const a = state.automation;
  if (!state.open || !a) return null;

  const steps = (a.steps ?? []) as AutomationStep[];

  const updateStep = (i: number, patch: Partial<AutomationStep>) => {
    const next = steps.slice();
    next[i] = { ...next[i], ...patch } as AutomationStep;
    onChange({ ...a, steps: next });
  };
  const removeStep = (i: number) => {
    const next = steps.slice();
    next.splice(i, 1);
    onChange({ ...a, steps: next });
  };
  const addStep = (type: AutomationStep['type']) => {
    const newStep: AutomationStep =
      type === 'send_email' ? { type: 'send_email', subject: '', body_html: '' }
      : type === 'wait' ? { type: 'wait', days: 1 }
      : { type: 'add_tag', tag: '' };
    onChange({ ...a, steps: [...steps, newStep] });
  };

  const trigCfg = a.trigger_config ?? {};

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{a.id ? 'Edit Automation' : 'New Automation'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={a.name ?? ''} onChange={e => onChange({ ...a, name: e.target.value })} placeholder="Welcome series" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={a.status ?? 'draft'} onValueChange={(v) => onChange({ ...a, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={a.description ?? ''}
              onChange={e => onChange({ ...a, description: e.target.value })}
              placeholder="Internal notes about this automation"
              rows={2}
            />
          </div>

          <div>
            <Label>Trigger</Label>
            <Select value={a.trigger_type ?? 'lead_created'} onValueChange={(v) => onChange({ ...a, trigger_type: v as AutomationTrigger, trigger_config: {} })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {a.trigger_type === 'time_based' && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label>Days since last activity (re-engagement)</Label>
                  <Input
                    type="number" min={0}
                    value={trigCfg.days_since_last_booking ?? ''}
                    onChange={e => onChange({ ...a, trigger_config: { ...trigCfg, days_since_last_booking: e.target.value ? Number(e.target.value) : undefined } })}
                    placeholder="e.g. 180"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bday"
                    checked={!!trigCfg.birthday_today}
                    onChange={e => onChange({ ...a, trigger_config: { ...trigCfg, birthday_today: e.target.checked } })}
                  />
                  <Label htmlFor="bday" className="cursor-pointer">Run on contact's birthday</Label>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Steps</Label>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => addStep('send_email')}><Mail className="h-3 w-3 mr-1" />Email</Button>
                <Button size="sm" variant="outline" onClick={() => addStep('wait')}><Clock className="h-3 w-3 mr-1" />Wait</Button>
                <Button size="sm" variant="outline" onClick={() => addStep('add_tag')}><Tag className="h-3 w-3 mr-1" />Tag</Button>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>}
                  <Card>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">Step {i + 1} · {step.type}</Badge>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeStep(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {step.type === 'send_email' && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Use template (optional)</Label>
                            <Select
                              value={(step as any).template_id ?? 'none'}
                              onValueChange={(v) => {
                                if (v === 'none') return updateStep(i, { template_id: undefined } as any);
                                const tpl = templates.find(t => t.id === v);
                                updateStep(i, {
                                  template_id: v,
                                  subject: tpl?.subject ?? (step as any).subject,
                                  body_html: tpl?.body_html ?? (step as any).body_html,
                                  from_name: tpl?.from_name ?? (step as any).from_name,
                                } as any);
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— None —</SelectItem>
                                {templates.map(t => <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            placeholder="Subject (supports {{name}})"
                            value={(step as any).subject ?? ''}
                            onChange={e => updateStep(i, { subject: e.target.value } as any)}
                          />
                          <Textarea
                            rows={4}
                            placeholder="HTML body (supports {{name}})"
                            value={(step as any).body_html ?? ''}
                            onChange={e => updateStep(i, { body_html: e.target.value } as any)}
                          />
                        </div>
                      )}

                      {step.type === 'wait' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Days</Label>
                            <Input type="number" min={0} value={(step as any).days ?? 0}
                              onChange={e => updateStep(i, { days: Number(e.target.value) } as any)} />
                          </div>
                          <div>
                            <Label className="text-xs">Hours</Label>
                            <Input type="number" min={0} value={(step as any).hours ?? 0}
                              onChange={e => updateStep(i, { hours: Number(e.target.value) } as any)} />
                          </div>
                          <div>
                            <Label className="text-xs">Minutes</Label>
                            <Input type="number" min={0} value={(step as any).minutes ?? 0}
                              onChange={e => updateStep(i, { minutes: Number(e.target.value) } as any)} />
                          </div>
                        </div>
                      )}

                      {step.type === 'add_tag' && (
                        <Input
                          placeholder="Tag to apply (e.g. welcomed, re-engaged)"
                          value={(step as any).tag ?? ''}
                          onChange={e => updateStep(i, { tag: e.target.value } as any)}
                        />
                      )}
                    </CardContent>
                  </Card>
                </React.Fragment>
              ))}
              {steps.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No steps yet — add an Email, Wait or Tag step.</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Automation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationsTab;
