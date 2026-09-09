import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailManagementService, EmailTemplate } from "@/services/emailManagementService";
import RichTextEditor from "@/components/content/RichTextEditor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user clicks "Use this template" — composer will load it. */
  onUseTemplate?: (tpl: EmailTemplate) => void;
  /** Optional seed values to prefill a new template (e.g. from current composer state). */
  seed?: { subject?: string; body_html?: string; from_name?: string } | null;
}

const CATEGORIES = ["general", "announcement", "reminder", "newsletter", "transactional", "promotion"];

const EmailTemplatesDialog: React.FC<Props> = ({ open, onOpenChange, onUseTemplate, seed }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // edit form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [fromName, setFromName] = useState("Amuse Kenya");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const list = await emailManagementService.getEmailTemplates();
    setTemplates(list);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      setMode("list");
      reload();
    }
  }, [open]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("general");
    setSubject("");
    setBodyHtml("");
    setFromName("Amuse Kenya");
  };

  const startNew = () => {
    resetForm();
    if (seed) {
      setSubject(seed.subject || "");
      setBodyHtml(seed.body_html || "");
      setFromName(seed.from_name || "Amuse Kenya");
    }
    setMode("edit");
  };

  const startEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description || "");
    setCategory(t.category || "general");
    setSubject(t.subject || "");
    setBodyHtml(t.body_html || "");
    setFromName(t.from_name || "Amuse Kenya");
    setMode("edit");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give this template a name.", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({ title: "Missing content", description: "Subject and body are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await emailManagementService.saveEmailTemplate({
      id: editingId || undefined,
      name,
      description: description || null,
      category,
      subject,
      body_html: bodyHtml,
      from_name: fromName,
    });
    setSaving(false);
    if (!res.success) {
      toast({ title: "Save failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Template updated" : "Template saved" });
    resetForm();
    setMode("list");
    reload();
  };

  const handleDelete = async (t: EmailTemplate) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    setDeletingId(t.id);
    const prev = templates;
    setTemplates((ts) => ts.filter((x) => x.id !== t.id));
    const res = await emailManagementService.deleteEmailTemplate(t.id);
    setDeletingId(null);
    if (!res.success) {
      setTemplates(prev);
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Template deleted" });
    }
  };

  const handleUse = (t: EmailTemplate) => {
    onUseTemplate?.(t);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === "list" ? "Email Templates" : editingId ? "Edit Template" : "New Template"}
          </DialogTitle>
        </DialogHeader>

        {mode === "list" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Reusable layouts you can load into any campaign.
              </p>
              <Button onClick={startNew}>
                <Plus className="h-4 w-4 mr-2" />
                New template
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No templates yet</p>
                <p className="text-xs text-muted-foreground">Create your first to speed up future blasts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.name}</div>
                        {t.subject && (
                          <div className="text-xs text-muted-foreground truncate">Subject: {t.subject}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {t.category || "general"}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {onUseTemplate && (
                        <Button size="sm" onClick={() => handleUse(t)}>
                          Use this
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(t)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to templates
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tname">Template name *</Label>
                <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Camp Launch Announcement" />
              </div>
              <div>
                <Label htmlFor="tcat">Category</Label>
                <select
                  id="tcat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="tdesc">Description</Label>
              <Textarea
                id="tdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When to use this template…"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tfrom">From name</Label>
                <Input id="tfrom" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tsubj">Subject *</Label>
                <Input id="tsubj" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Body *</Label>
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} height={260} placeholder="Write the reusable email body…" />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: use placeholders like {`{{Camp Name}}`} that you tweak when composing each campaign.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMode("list")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Save changes" : "Create template"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplatesDialog;
