import { supabase } from '@/integrations/supabase/client';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  username: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  severity: AuditSeverity;
  created_at: string;
}

export interface LogAuditEventParams {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
}

class AuditLogService {
  /**
   * Log an audit event
   */
  async logEvent({
    action,
    entityType,
    entityId,
    details,
    metadata = {},
    severity = 'info'
  }: LogAuditEventParams): Promise<string | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Get user profile
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, id')
        .eq('id', userData?.user?.id)
        .single();

      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .insert({
          user_id: userData?.user?.id,
          username: profile?.full_name || userData?.user?.email?.split('@')[0] || 'unknown',
          user_email: userData?.user?.email || 'unknown',
          action,
          entity_type: entityType || null,
          entity_id: entityId || null,
          details: details || null,
          metadata,
          severity
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging audit event:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      return null;
    }
  }

  /**
   * Log user login
   */
  async logLogin(username: string): Promise<void> {
    await this.logEvent({
      action: 'user_login',
      entityType: 'auth',
      details: `User ${username} logged in`,
      severity: 'info'
    });
  }

  /**
   * Log user logout
   */
  async logLogout(username: string): Promise<void> {
    await this.logEvent({
      action: 'user_logout',
      entityType: 'auth',
      details: `User ${username} logged out`,
      severity: 'info'
    });
  }

  /**
   * Log page view
   */
  async logPageView(pageName: string, path: string): Promise<void> {
    await this.logEvent({
      action: 'page_view',
      entityType: 'navigation',
      details: `Viewed ${pageName}`,
      metadata: { path, pageName }
    });
  }

  /**
   * Log content creation
   */
  async logContentCreated(contentType: string, contentId: string, title: string): Promise<void> {
    await this.logEvent({
      action: 'content_created',
      entityType: contentType,
      entityId: contentId,
      details: `Created ${contentType}: ${title}`,
      severity: 'info'
    });
  }

  /**
   * Log content update
   */
  async logContentUpdated(contentType: string, contentId: string, title: string): Promise<void> {
    await this.logEvent({
      action: 'content_updated',
      entityType: contentType,
      entityId: contentId,
      details: `Updated ${contentType}: ${title}`,
      severity: 'info'
    });
  }

  /**
   * Log content deletion
   */
  async logContentDeleted(contentType: string, contentId: string, title: string): Promise<void> {
    await this.logEvent({
      action: 'content_deleted',
      entityType: contentType,
      entityId: contentId,
      details: `Deleted ${contentType}: ${title}`,
      severity: 'warning'
    });
  }

  /**
   * Log registration submission
   */
  async logRegistration(programName: string, registrationId: string): Promise<void> {
    await this.logEvent({
      action: 'registration_submitted',
      entityType: 'registration',
      entityId: registrationId,
      details: `Registration submitted for ${programName}`,
      metadata: { programName }
    });
  }

  /**
   * Log data export
   */
  async logExport(exportType: string, recordCount: number): Promise<void> {
    await this.logEvent({
      action: 'data_exported',
      entityType: 'export',
      details: `Exported ${recordCount} ${exportType} records`,
      metadata: { exportType, recordCount },
      severity: 'warning'
    });
  }

  /**
   * Get all audit logs with pagination
   */
  async getAuditLogs(page = 1, limit = 50, filters?: {
    action?: string;
    username?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: AuditLogEntry[]; count: number; error: any }> {
    try {
      let query = supabase
        .from('audit_logs' as any)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.username) {
        query = query.ilike('username', `%${filters.username}%`);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      return { data: (data as any) || [], count: count || 0, error };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0, error };
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(days = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('action, entity_type, severity, created_at, user_id')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const logs = data as any[] || [];

      // Calculate statistics
      const stats = {
        totalEvents: logs.length || 0,
        byAction: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        byEntityType: {} as Record<string, number>,
        uniqueUsers: new Set(logs.map((log: any) => log.user_id)).size
      };

      logs.forEach((log: any) => {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
        if (log.entity_type) {
          stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      return null;
    }
  }
}

export const auditLogService = new AuditLogService();
