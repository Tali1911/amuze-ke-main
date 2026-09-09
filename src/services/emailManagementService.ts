import { supabase } from "@/integrations/supabase/client";

export interface EmailDelivery {
  id: string;
  email: string;
  message_id: string | null;
  recipient_type: "lead" | "customer" | "registration" | null;
  recipient_id: string | null;
  email_type: "confirmation" | "marketing" | "transactional" | "notification";
  subject: string | null;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "spam";
  postmark_data: any;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  created_at: string;
}

export interface UserEngagementStats {
  email: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  lastActivity: string | null;
}

export interface EmailSuppression {
  id: string;
  email: string;
  suppression_type: "bounce_hard" | "bounce_soft" | "spam_complaint" | "unsubscribe" | "manual";
  reason: string | null;
  bounce_date: string | null;
  created_at: string;
}

export interface EmailSegment {
  id: string;
  name: string;
  description: string | null;
  filters: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailHealthStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spam: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  suppressedCount: number;
}

class EmailManagementService {
  async getEmailDeliveries(filters?: {
    status?: string;
    email_type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<EmailDelivery[]> {
    try {
      const supabaseClient = supabase as any;
      let query = supabaseClient.from("email_deliveries").select("*").order("sent_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.email_type) {
        query = query.eq("email_type", filters.email_type);
      }
      if (filters?.dateFrom) {
        query = query.gte("sent_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("sent_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as EmailDelivery[];
    } catch (error) {
      console.error("Error fetching email deliveries:", error);
      return [];
    }
  }

  async getEmailHealthStats(dateFrom?: string, dateTo?: string): Promise<EmailHealthStats> {
    try {
      const supabaseClient = supabase as any;
      let query = supabaseClient.from("email_deliveries").select("status");

      if (dateFrom) {
        query = query.gte("sent_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("sent_at", dateTo);
      }

      const { data: deliveries } = await query;
      const { data: suppressions } = await supabaseClient.from("email_suppressions").select("id");

      const deliveryData = (deliveries || []) as any[];
      const totalSent = deliveryData.length;

      // Email statuses are cumulative - an "opened" email was also "delivered"
      // So we count all emails that reached at least that stage
      const deliveredStatuses = ["delivered", "opened", "clicked"];
      const openedStatuses = ["opened", "clicked"];

      const delivered = deliveryData.filter((d: any) => deliveredStatuses.includes(d.status)).length;
      const opened = deliveryData.filter((d: any) => openedStatuses.includes(d.status)).length;
      const clicked = deliveryData.filter((d: any) => d.status === "clicked").length;
      const bounced = deliveryData.filter((d: any) => d.status === "bounced").length;
      const spam = deliveryData.filter((d: any) => d.status === "spam").length;

      return {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        spam,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        suppressedCount: suppressions?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching email health stats:", error);
      return {
        totalSent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spam: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        suppressedCount: 0,
      };
    }
  }

  async getEmailSuppressions(): Promise<EmailSuppression[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from("email_suppressions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EmailSuppression[];
    } catch (error) {
      console.error("Error fetching email suppressions:", error);
      return [];
    }
  }

  async addEmailSuppression(
    email: string,
    type: EmailSuppression["suppression_type"],
    reason?: string,
  ): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("email_suppressions").insert({
        email,
        suppression_type: type,
        reason: reason || null,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error adding email suppression:", error);
      return false;
    }
  }

  async removeEmailSuppression(id: string): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("email_suppressions").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error removing email suppression:", error);
      return false;
    }
  }

  async getEmailSegments(): Promise<EmailSegment[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from("email_segments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EmailSegment[];
    } catch (error) {
      console.error("Error fetching email segments:", error);
      return [];
    }
  }

  async createEmailSegment(name: string, description: string, filters: any): Promise<EmailSegment | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const supabaseClient = supabase as any;

      const { data, error } = await supabaseClient
        .from("email_segments")
        .insert({
          name,
          description,
          filters,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailSegment;
    } catch (error) {
      console.error("Error creating email segment:", error);
      return null;
    }
  }

  async updateEmailSegment(id: string, name: string, description: string, filters: any): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from("email_segments")
        .update({
          name,
          description,
          filters,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating email segment:", error);
      return false;
    }
  }

  async deleteEmailSegment(id: string): Promise<boolean> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("email_segments").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting email segment:", error);
      return false;
    }
  }

  async getUserEngagementStats(): Promise<UserEngagementStats[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from("email_deliveries")
        .select("email, status, sent_at, delivered_at, opened_at, clicked_at");

      if (error) throw error;

      const deliveries = (data || []) as any[];

      // Group by email
      const userMap = new Map<
        string,
        {
          sent: number;
          delivered: number;
          opened: number;
          clicked: number;
          lastActivity: string | null;
        }
      >();

      const deliveredStatuses = ["delivered", "opened", "clicked"];
      const openedStatuses = ["opened", "clicked"];

      for (const d of deliveries) {
        const email = d.email;
        if (!email) continue;

        const existing = userMap.get(email) || {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          lastActivity: null,
        };

        existing.sent++;
        if (deliveredStatuses.includes(d.status)) existing.delivered++;
        if (openedStatuses.includes(d.status)) existing.opened++;
        if (d.status === "clicked") existing.clicked++;

        // Track most recent activity
        const activityDate = d.clicked_at || d.opened_at || d.delivered_at || d.sent_at;
        if (activityDate && (!existing.lastActivity || activityDate > existing.lastActivity)) {
          existing.lastActivity = activityDate;
        }

        userMap.set(email, existing);
      }

      // Convert to array with calculated rates
      const result: UserEngagementStats[] = [];
      for (const [email, stats] of userMap) {
        result.push({
          email,
          totalSent: stats.sent,
          totalDelivered: stats.delivered,
          totalOpened: stats.opened,
          totalClicked: stats.clicked,
          openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
          clickRate: stats.delivered > 0 ? (stats.clicked / stats.delivered) * 100 : 0,
          clickToOpenRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
          lastActivity: stats.lastActivity,
        });
      }

      return result;
    } catch (error) {
      console.error("Error fetching user engagement stats:", error);
      return [];
    }
  }

  /**
   * Resolve a saved segment into a deduplicated list of opt-in lead recipients.
   * Excludes any address present in email_suppressions or with email_subscribed=false.
   */
  async resolveSegmentRecipients(
    segmentId: string,
  ): Promise<{ email: string; full_name: string | null; lead_id: string }[]> {
    try {
      const supabaseClient = supabase as any;
      const { data: segment, error: segError } = await supabaseClient
        .from("email_segments")
        .select("filters")
        .eq("id", segmentId)
        .single();
      if (segError || !segment) return [];

      const f = segment.filters || {};
      let q = supabaseClient
        .from("leads")
        .select("id, email, full_name, email_subscribed, program_type, status")
        .not("email", "is", null);

      if (f.program_type) q = q.eq("program_type", f.program_type);
      if (f.status) q = q.eq("status", f.status);

      const { data: leads, error: leadsError } = await q;
      if (leadsError) throw leadsError;

      const { data: suppressions } = await supabaseClient.from("email_suppressions").select("email");
      const suppressedSet = new Set((suppressions || []).map((s: any) => (s.email || "").toLowerCase()));

      const seen = new Set<string>();
      const recipients: { email: string; full_name: string | null; lead_id: string }[] = [];
      for (const l of (leads || []) as any[]) {
        const email = (l.email || "").trim().toLowerCase();
        if (!email) continue;
        if (l.email_subscribed === false) continue;
        if (suppressedSet.has(email)) continue;
        if (seen.has(email)) continue;
        seen.add(email);
        recipients.push({ email, full_name: l.full_name || null, lead_id: l.id });
      }
      return recipients;
    } catch (error) {
      console.error("Error resolving segment recipients:", error);
      return [];
    }
  }

  /** Distinct values for segment filter dropdowns */
  async getSegmentFilterOptions(): Promise<{ programTypes: string[]; statuses: string[] }> {
    try {
      const supabaseClient = supabase as any;
      const { data } = await supabaseClient.from("leads").select("program_type, status");
      const programTypes = new Set<string>();
      const statuses = new Set<string>();
      for (const r of (data || []) as any[]) {
        if (r.program_type) programTypes.add(r.program_type);
        if (r.status) statuses.add(r.status);
      }
      return {
        programTypes: Array.from(programTypes).sort(),
        statuses: Array.from(statuses).sort(),
      };
    } catch {
      return { programTypes: [], statuses: [] };
    }
  }

  // ---------- Campaign management ----------

  async getCampaigns(): Promise<any[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from("campaigns")
        .select("*")
        .eq("campaign_type", "email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching campaigns:", e);
      return [];
    }
  }

  async createCampaign(payload: {
    name: string;
    subject: string;
    body_html: string;
    from_name?: string;
    segment_id: string;
    recipient_count: number;
    // Optional scheduling fields
    scheduled_for?: string | null;
    send_window_start_hour?: number | null;
    send_window_end_hour?: number | null;
    recipients_snapshot?: string[] | null;
  }): Promise<any | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const supabaseClient = supabase as any;
      const isScheduled = !!payload.scheduled_for;
      const { data, error } = await supabaseClient
        .from("campaigns")
        .insert({
          name: payload.name,
          subject: payload.subject,
          body_html: payload.body_html,
          from_name: payload.from_name || "Amuse Kenya",
          segment_id: payload.segment_id,
          recipient_count: payload.recipient_count,
          campaign_type: "email",
          status: isScheduled ? "scheduled" : "planning",
          created_by: user?.id,
          scheduled_for: payload.scheduled_for || null,
          send_window_start_hour: payload.send_window_start_hour ?? null,
          send_window_end_hour: payload.send_window_end_hour ?? null,
          recipients_snapshot: isScheduled ? payload.recipients_snapshot || null : null,
          scheduled_by: isScheduled ? user?.id : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error creating campaign:", e);
      return null;
    }
  }

  async cancelScheduledCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from("campaigns")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("status", "scheduled");
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Cancel failed" };
    }
  }

  async deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error("Error deleting campaign:", e);
      return { success: false, error: e?.message || "Delete failed" };
    }
  }

  /** Extract a useful error message out of Edge Function errors. */
  private async parseFunctionError(error: any): Promise<string> {
    try {
      // FunctionsHttpError exposes the raw Response on .context
      const ctx = error?.context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) return body.error;
      } else if (ctx && typeof ctx.text === "function") {
        const text = await ctx.text();
        if (text) return text;
      }
    } catch (_) {
      /* ignore */
    }
    return error?.message || "Send failed";
  }

  /**
   * Call Edge Functions with fetch instead of supabase.functions.invoke.
   * invoke can overwrite the Authorization header with the anon key in some
   * sessions, so we explicitly forward the current access token.
   */
  private async callMarketingFunction<T>(payload: Record<string, any>): Promise<T> {
    const token = await this.getAccessToken();
    const supabaseClient = supabase as any;
    const functionsBaseUrl = (
      supabaseClient.functionsUrl?.href || `${supabaseClient.supabaseUrl}/functions/v1`
    ).replace(/\/$/, "");
    const response = await fetch(`${functionsBaseUrl}/send-marketing-campaign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: supabaseClient.supabaseKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (_) {
      body = { error: text };
    }

    if (!response.ok || body?.success === false) {
      throw new Error(body?.error || body?.message || `Function failed with status ${response.status}`);
    }

    return (body || { success: true }) as T;
  }

  /** Get the current user's access token, or throw if not signed in. */
  private async getAccessToken(): Promise<string> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("You are not signed in. Please log in again and retry.");
    }
    return token;
  }

  async sendCampaign(
    campaignId: string,
    options?: { recipients?: string[]; retry?: boolean },
  ): Promise<{ success: boolean; sent?: number; failed?: number; error?: string; warning?: string }> {
    try {
      return await this.callMarketingFunction({
        campaignId,
        recipients: options?.recipients,
        retry: options?.retry,
      });
    } catch (e: any) {
      console.error("Error sending campaign:", e);
      return { success: false, error: e?.message || "Send failed" };
    }
  }

  /** Return the deduplicated list of email addresses that bounced/failed for a campaign. */
  async getFailedRecipients(campaignId: string): Promise<string[]> {
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from("email_deliveries")
        .select("email, status")
        .eq("campaign_id", campaignId)
        .in("status", ["bounced", "spam"]);
      if (error) throw error;
      // Exclude any address that ALSO has a successful send for this campaign
      // (e.g. retried later) to avoid resending to people who eventually got it.
      const { data: sentRows } = await supabaseClient
        .from("email_deliveries")
        .select("email")
        .eq("campaign_id", campaignId)
        .in("status", ["sent", "delivered", "opened", "clicked"]);
      const sentSet = new Set(((sentRows || []) as any[]).map((r) => (r.email || "").toLowerCase()));
      const seen = new Set<string>();
      const result: string[] = [];
      for (const r of (data || []) as any[]) {
        const e = (r.email || "").trim().toLowerCase();
        if (!e || sentSet.has(e) || seen.has(e)) continue;
        seen.add(e);
        result.push(e);
      }
      return result;
    } catch (e) {
      console.error("Error fetching failed recipients:", e);
      return [];
    }
  }
  async sendTestCampaign(payload: {
    subject: string;
    body_html: string;
    from_name?: string;
    testEmail: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.callMarketingFunction({
        test: true,
        testEmail: payload.testEmail,
        subject: payload.subject,
        body_html: payload.body_html,
        from_name: payload.from_name,
      });
    } catch (e: any) {
      console.error("Error sending test campaign:", e);
      return { success: false, error: e?.message || "Send failed" };
    }
  }

  async getCampaignStats(
    campaignId: string,
  ): Promise<{ sent: number; delivered: number; opened: number; clicked: number; bounced: number }> {
    try {
      const supabaseClient = supabase as any;
      const { data } = await supabaseClient.from("email_deliveries").select("status").eq("campaign_id", campaignId);
      const rows = (data || []) as any[];
      const deliveredStatuses = ["delivered", "opened", "clicked"];
      const openedStatuses = ["opened", "clicked"];
      return {
        sent: rows.length,
        delivered: rows.filter((r) => deliveredStatuses.includes(r.status)).length,
        opened: rows.filter((r) => openedStatuses.includes(r.status)).length,
        clicked: rows.filter((r) => r.status === "clicked").length,
        bounced: rows.filter((r) => r.status === "bounced").length,
      };
    } catch {
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }
  }

  // ---------- Email Templates (reusable layouts) ----------

  async getEmailTemplates(includeArchived = false): Promise<EmailTemplate[]> {
    try {
      const supabaseClient = supabase as any;
      let query = supabaseClient
        .from("email_templates")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!includeArchived) query = query.eq("is_archived", false);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmailTemplate[];
    } catch (e) {
      console.error("Error fetching email templates:", e);
      return [];
    }
  }

  async saveEmailTemplate(payload: {
    id?: string;
    name: string;
    description?: string | null;
    category?: string | null;
    subject: string;
    body_html: string;
    from_name?: string | null;
  }): Promise<{ success: boolean; template?: EmailTemplate; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const supabaseClient = supabase as any;
      const row: any = {
        name: payload.name.trim(),
        description: payload.description ?? null,
        category: payload.category || "general",
        subject: payload.subject,
        body_html: payload.body_html,
        from_name: payload.from_name || "Amuse Kenya",
        updated_by: user?.id ?? null,
      };
      let data: any, error: any;
      if (payload.id) {
        ({ data, error } = await supabaseClient
          .from("email_templates")
          .update(row)
          .eq("id", payload.id)
          .select()
          .single());
      } else {
        row.created_by = user?.id ?? null;
        ({ data, error } = await supabaseClient
          .from("email_templates")
          .insert(row)
          .select()
          .single());
      }
      if (error) throw error;
      return { success: true, template: data as EmailTemplate };
    } catch (e: any) {
      return { success: false, error: e?.message || "Save failed" };
    }
  }

  async deleteEmailTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("email_templates").delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Delete failed" };
    }
  }
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  body_html: string;
  from_name: string | null;
  is_archived: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const emailManagementService = new EmailManagementService();
