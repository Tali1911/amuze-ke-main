import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Users, Loader2, Plus, X, Search, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailManagementService, EmailSegment } from "@/services/emailManagementService";
import RichTextEditor from "@/components/content/RichTextEditor";

interface CampaignRow {
  id: string;
  name: string;
  subject: string | null;
  status: string;
  recipient_count: number | null;
  sent_count: number | null;
  failed_count: number | null;
  sent_at: string | null;
  created_at: string;
}

interface Recipient {
  email: string;
  lead_id?: string;
  source: "segment" | "manual";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailCampaignsTab: React.FC = () => {
  const { toast } = useToast();
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  // Compose form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [fromName, setFromName] = useState("Amuse Kenya");
  const [segmentId, setSegmentId] = useState<string>("");
  const [resolving, setResolving] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientFilter, setRecipientFilter] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [composeTab, setComposeTab] = useState<"edit" | "preview">("edit");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [segs, camps] = await Promise.all([
      emailManagementService.getEmailSegments(),
      emailManagementService.getCampaigns(),
    ]);
    setSegments(segs);
    setCampaigns(camps as CampaignRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Resolve recipients whenever segment changes
  useEffect(() => {
    if (!segmentId) {
      setRecipients([]);
      return;
    }
    setResolving(true);
    emailManagementService
      .resolveSegmentRecipients(segmentId)
      .then((list) => {
        const mapped: Recipient[] = list.map((r) => ({
          email: r.email,
          lead_id: r.lead_id,
          source: "segment",
        }));
        setRecipients(mapped);
      })
      .finally(() => setResolving(false));
  }, [segmentId]);

  const resetCompose = () => {
    setName("");
    setSubject("");
    setBodyHtml("");
    setFromName("Amuse Kenya");
    setSegmentId("");
    setRecipients([]);
    setRecipientFilter("");
    setNewEmail("");
    setTestEmail("");
    setComposeTab("edit");
  };

  const filteredRecipients = useMemo(() => {
    const q = recipientFilter.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.email.includes(q));
  }, [recipients, recipientFilter]);

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const addManualRecipient = () => {
    const e = newEmail.trim().toLowerCase();
    if (!e) return;
    if (!EMAIL_REGEX.test(e)) {
      toast({ title: "Invalid email", description: e, variant: "destructive" });
      return;
    }
    if (recipients.some((r) => r.email === e)) {
      toast({ title: "Already in list", description: e });
      setNewEmail("");
      return;
    }
    setRecipients((prev) => [...prev, { email: e, source: "manual" }]);
    setNewEmail("");
  };

  const restoreFromSegment = async () => {
    if (!segmentId) return;
    setResolving(true);
    const list = await emailManagementService.resolveSegmentRecipients(segmentId);
    setRecipients(list.map((r) => ({ email: r.email, lead_id: r.lead_id, source: "segment" })));
    setResolving(false);
  };

  const validate = (forTest = false): string | null => {
    if (!subject.trim()) return "Subject is required";
    if (!bodyHtml.trim() || bodyHtml === "<p><br></p>") return "Email body is required";
    if (forTest) return null;
    if (!name.trim()) return "Campaign name is required";
    if (recipients.length === 0) return "Add at least one recipient";
    return null;
  };

  const handleSendTest = async () => {
    const err = validate(true);
    if (err) {
      toast({ title: "Missing info", description: err, variant: "destructive" });
      return;
    }
    const e = testEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(e)) {
      toast({ title: "Test email required", description: "Enter a valid email address", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const result = await emailManagementService.sendTestCampaign({
        subject,
        body_html: bodyHtml,
        from_name: fromName,
        testEmail: e,
      });
      if (!result.success) throw new Error(result.error || "Send failed");
      toast({ title: "Test sent", description: `Test email sent to ${e}` });
    } catch (e: any) {
      toast({ title: "Test failed", description: e?.message || "Could not send test", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleSendBlast = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Missing info", description: err, variant: "destructive" });
      return;
    }
    if (!confirm(`Send "${subject}" to ${recipients.length} recipients?`)) return;
    setSending(true);
    try {
      const created = await emailManagementService.createCampaign({
        name,
        subject,
        body_html: bodyHtml,
        from_name: fromName,
        segment_id: segmentId,
        recipient_count: recipients.length,
      });
      if (!created) throw new Error("Could not create campaign");
      const result = await emailManagementService.sendCampaign(created.id, {
        recipients: recipients.map((r) => r.email),
      });
      if (!result.success) throw new Error(result.error || "Send failed");
      const warning = result.warning ? ` (${result.warning})` : "";
      toast({ title: "Blast sent", description: `Sent ${result.sent} • Failed ${result.failed}${warning}` });
      setComposeOpen(false);
      resetCompose();
      loadAll();
    } catch (e: any) {
      toast({ title: "Send failed", description: e?.message || "Could not send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      completed: "default",
      active: "default",
      planning: "secondary",
      paused: "outline",
    };
    return <Badge variant={map[s] || "outline"}>{s}</Badge>;
  };

  const handleDeleteCampaign = async (c: CampaignRow) => {
    if (c.status === "active") {
      toast({
        title: "Cannot delete",
        description: "Campaign is currently sending. Wait until it finishes.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Delete campaign "${c.name}"? Delivery history will be kept.`)) return;
    setDeletingId(c.id);
    // optimistic remove
    const prev = campaigns;
    setCampaigns((cs) => cs.filter((x) => x.id !== c.id));
    const result = await emailManagementService.deleteCampaign(c.id);
    setDeletingId(null);
    if (!result.success) {
      setCampaigns(prev);
      toast({
        title: "Delete failed",
        description: result.error || "Could not delete campaign",
        variant: "destructive",
      });
    } else {
      toast({ title: "Campaign deleted", description: c.name });
    }
  };

  const handleResendFailed = async (c: CampaignRow) => {
    setResendingId(c.id);
    try {
      const failedEmails = await emailManagementService.getFailedRecipients(c.id);
      if (failedEmails.length === 0) {
        toast({ title: "Nothing to retry", description: "No failed recipients found for this campaign." });
        return;
      }
      if (!confirm(`Resend "${c.subject || c.name}" to ${failedEmails.length} failed recipient(s)?`)) return;
      const result = await emailManagementService.sendCampaign(c.id, {
        recipients: failedEmails,
        retry: true,
      });
      if (!result.success) throw new Error(result.error || "Resend failed");
      const warning = result.warning ? ` (${result.warning})` : "";
      toast({ title: "Retry complete", description: `Sent ${result.sent} • Failed ${result.failed}${warning}` });
      loadAll();
    } catch (e: any) {
      toast({ title: "Retry failed", description: e?.message || "Could not resend", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const previewHtml = useMemo(() => {
    return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#fff;">
      ${bodyHtml || '<p style="color:#aaa">Your email body will appear here…</p>'}
      <hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
      <p style="font-size:12px;color:#888;text-align:center;">
        You received this because you registered with Amuse Kenya.<br/>
        <a href="#" style="color:#888;">Unsubscribe</a>
      </p>
    </div>`;
  }, [bodyHtml]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Campaigns</h2>
          <p className="text-muted-foreground">Compose and send marketing email blasts to saved segments</p>
        </div>
        <Dialog
          open={composeOpen}
          onOpenChange={(o) => {
            setComposeOpen(o);
            if (!o) resetCompose();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compose Email Blast</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cname">Campaign Name *</Label>
                  <Input
                    id="cname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Easter Camp 2026 Launch"
                  />
                </div>
                <div>
                  <Label htmlFor="from">From Name</Label>
                  <Input id="from" value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="subj">Subject *</Label>
                <Input
                  id="subj"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Easter Camp registration is open!"
                />
              </div>

              <div>
                <Label htmlFor="seg">Audience Segment</Label>
                <Select value={segmentId} onValueChange={setSegmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a segment to load recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    {segments.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        No segments yet — create one in the Email Segments tab
                      </div>
                    )}
                    {segments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient curation */}
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{recipients.length}</strong> recipients
                    </span>
                    {resolving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    {segmentId && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={restoreFromSegment}
                        disabled={resolving}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore from segment
                      </Button>
                    )}
                    {recipients.length > 0 && (
                      <Button type="button" size="sm" variant="outline" onClick={() => setRecipients([])}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-7 h-9"
                      placeholder="Search recipients…"
                      value={recipientFilter}
                      onChange={(e) => setRecipientFilter(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Input
                      className="h-9"
                      placeholder="Add another email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addManualRecipient();
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={addManualRecipient}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {recipients.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No recipients yet. Pick a segment or add emails manually.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1">
                    {filteredRecipients.map((r) => (
                      <Badge
                        key={r.email}
                        variant={r.source === "manual" ? "default" : "secondary"}
                        className="gap-1 font-normal"
                      >
                        {r.email}
                        <button
                          type="button"
                          onClick={() => removeRecipient(r.email)}
                          className="hover:bg-background/20 rounded-full p-0.5"
                          aria-label={`Remove ${r.email}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {filteredRecipients.length === 0 && (
                      <p className="text-xs text-muted-foreground">No matches for "{recipientFilter}"</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Suppressed/unsubscribed emails are filtered automatically before sending.
                </p>
              </div>

              {/* Editor + Preview */}
              <div>
                <Label>Email Body *</Label>
                <Tabs value={composeTab} onValueChange={(v) => setComposeTab(v as "edit" | "preview")} className="mt-1">
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-2">
                    <RichTextEditor
                      value={bodyHtml}
                      onChange={setBodyHtml}
                      height={260}
                      placeholder="Write your message here…"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatting (bold, headings, lists, links, images) is supported. An unsubscribe footer is added
                      automatically.
                    </p>
                  </TabsContent>
                  <TabsContent value="preview" className="mt-2">
                    <div className="border rounded-lg bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Test send */}
              <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                <Label className="text-sm">Send a test first</Label>
                <p className="text-xs text-muted-foreground">
                  A test send goes only to the address below. It does not affect the campaign or its counters.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                  <Button variant="outline" onClick={handleSendTest} disabled={testing}>
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Test"}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendBlast} disabled={sending || recipients.length === 0}>
                  {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send to {recipients.length}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading…</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No campaigns sent yet</p>
            <p className="text-sm text-muted-foreground">Create your first email blast above</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(c.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteCampaign(c)}
                      disabled={deletingId === c.id || c.status === "active"}
                      aria-label={`Delete campaign ${c.name}`}
                      title={c.status === "active" ? "Cannot delete while sending" : "Delete campaign"}
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {c.subject && <p className="text-sm text-muted-foreground">{c.subject}</p>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold">{c.recipient_count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{c.sent_count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">{c.failed_count ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {c.sent_at
                    ? `Sent ${new Date(c.sent_at).toLocaleString()}`
                    : `Created ${new Date(c.created_at).toLocaleString()}`}
                </p>
                {(c.failed_count ?? 0) > 0 && c.status !== "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => handleResendFailed(c)}
                    disabled={resendingId === c.id}
                  >
                    {resendingId === c.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Resending…
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3 mr-2" />
                        Resend {c.failed_count} failed
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailCampaignsTab;
