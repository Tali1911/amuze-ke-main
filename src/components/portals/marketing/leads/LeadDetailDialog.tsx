import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, X, Plus, CalendarClock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from '@/services/leadsService';
import { leadsService } from '@/services/leadsService';
import {
  leadPipelineService,
  PIPELINE_STAGES,
  type LeadActivity,
  type LeadTask,
  type PipelineStage,
} from '@/services/leadPipelineService';

interface Props {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onChanged: () => void;
  renderFormData: (data: any) => React.ReactNode;
}

const ACTIVITY_ICONS: Record<string, string> = {
  email_sent: '📤',
  email_opened: '👀',
  email_clicked: '🔗',
  email_bounced: '⚠️',
  email_unsubscribed: '🚫',
  page_visit: '🌐',
  registration: '📝',
  note: '🗒️',
  stage_change: '🔄',
  tag_added: '🏷️',
  task: '✅',
  automation: '🤖',
};

const LeadDetailDialog: React.FC<Props> = ({ open, lead, onClose, onChanged, renderFormData }) => {
  const { toast } = useToast();
  const [local, setLocal] = useState<Lead | null>(lead);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  useEffect(() => {
    setLocal(lead);
    if (lead?.id && open) {
      leadPipelineService.listActivities(lead.id).then(setActivities);
      leadPipelineService.listTasks(lead.id).then(setTasks);
    }
  }, [lead, open]);

  if (!local) return null;

  const stage: PipelineStage = (local.pipeline_stage ?? 'new') as PipelineStage;
  const tags: string[] = Array.isArray(local.tags) ? local.tags : [];

  const persistFields = async (patch: Partial<Lead>) => {
    try {
      await leadPipelineService.updateLeadFields(local.id, patch as any);
      setLocal({ ...local, ...patch });
      onChanged();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleStageChange = async (next: PipelineStage) => {
    await persistFields({ pipeline_stage: next });
    // Refresh timeline to show stage_change row added by trigger
    if (local.id) leadPipelineService.listActivities(local.id).then(setActivities);
  };

  const addTag = async () => {
    const t = newTag.trim();
    if (!t || tags.includes(t)) { setNewTag(''); return; }
    await persistFields({ tags: [...tags, t] });
    setNewTag('');
  };
  const removeTag = async (t: string) => {
    await persistFields({ tags: tags.filter(x => x !== t) });
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    await leadPipelineService.addNote(local.id, newNote.trim());
    setNewNote('');
    const fresh = await leadPipelineService.listActivities(local.id);
    setActivities(fresh);
    toast({ title: 'Note added' });
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await leadPipelineService.createTask({
      lead_id: local.id,
      title: newTaskTitle.trim(),
      due_at: newTaskDue ? new Date(newTaskDue).toISOString() : null,
    });
    setNewTaskTitle('');
    setNewTaskDue('');
    setTasks(await leadPipelineService.listTasks(local.id));
  };

  const toggleTask = async (t: LeadTask) => {
    await leadPipelineService.toggleTaskComplete(t.id, !t.completed_at);
    setTasks(await leadPipelineService.listTasks(local.id));
  };

  const deleteTask = async (t: LeadTask) => {
    await leadPipelineService.deleteTask(t.id);
    setTasks(await leadPipelineService.listTasks(local.id));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{local.full_name}</DialogTitle>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-4 mt-1">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{local.email}</span>
            {local.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{local.phone}</span>}
            <span>{local.program_type}{local.program_name ? ` — ${local.program_name}` : ''}</span>
          </div>
        </DialogHeader>

        {/* Pipeline + tags row */}
        <div className="space-y-3 border-b pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Pipeline stage</Label>
              <Select value={stage} onValueChange={(v) => handleStageChange(v as PipelineStage)}>
                <SelectTrigger className="w-40 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Next follow-up</Label>
              <Input
                type="datetime-local"
                className="w-56 mt-1"
                value={local.next_followup_at ? new Date(local.next_followup_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => persistFields({ next_followup_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Tags</Label>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {tags.map(t => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="ml-1 hover:text-red-600"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              <Input
                className="w-36 h-7"
                placeholder="Add tag"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline ({activities.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.filter(t => !t.completed_at).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><Label>Created</Label><p>{new Date(local.created_at).toLocaleString()}</p></div>
              <div><Label>Last activity</Label><p>{local.last_activity_at ? new Date(local.last_activity_at).toLocaleString() : '—'}</p></div>
            </div>
            {local.form_data && (
              <div>
                <Label>Registration Details</Label>
                <div className="mt-2 p-3 bg-muted rounded text-sm space-y-3 max-h-60 overflow-auto">
                  {renderFormData(local.form_data)}
                </div>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                defaultValue={local.notes ?? ''}
                onBlur={async (e) => {
                  if (e.target.value !== (local.notes ?? '')) {
                    const updated = await leadsService.updateLead(local.id, { notes: e.target.value });
                    if (updated) { setLocal({ ...local, notes: e.target.value }); onChanged(); }
                  }
                }}
                rows={3}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Quick note…" value={newNote} onChange={e => setNewNote(e.target.value)} />
              <Button onClick={saveNote}><Plus className="h-4 w-4 mr-1" />Note</Button>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {activities.map(a => (
                  <div key={a.id} className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1">
                    <span>{ACTIVITY_ICONS[a.activity_type] ?? '•'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{a.title}</div>
                      {a.description && <div className="text-muted-foreground text-xs">{a.description}</div>}
                      <div className="text-xs text-muted-foreground">{new Date(a.occurred_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline" className="text-xs h-fit">{a.activity_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Task title" className="flex-1 min-w-[180px]" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
              <Input type="datetime-local" className="w-56" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} />
              <Button onClick={addTask}><Plus className="h-4 w-4 mr-1" />Add Task</Button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-start gap-2 border rounded p-2">
                    <Checkbox checked={!!t.completed_at} onCheckedChange={() => toggleTask(t)} className="mt-1" />
                    <div className="flex-1">
                      <div className={`${t.completed_at ? 'line-through text-muted-foreground' : 'font-medium'}`}>{t.title}</div>
                      {t.due_at && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CalendarClock className="h-3 w-3" />Due {new Date(t.due_at).toLocaleString()}
                        </div>
                      )}
                      {t.completed_at && (
                        <div className="text-xs text-green-700 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" />Completed {new Date(t.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteTask(t)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
