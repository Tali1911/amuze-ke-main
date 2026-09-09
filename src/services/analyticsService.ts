
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface AnalyticsMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'revenue' | 'customers' | 'employees' | 'performance' | 'efficiency';
  department: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  widget_type: 'chart' | 'metric' | 'table' | 'progress';
  data_source: string;
  configuration: any;
  department: string;
  order_index: number;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  report_type: 'financial' | 'hr' | 'marketing' | 'operations' | 'cross_departmental';
  generated_by: string;
  data: any;
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // STUB: Tables not created yet - returning mock data
  async getMetrics(department?: string, period?: { start: string; end: string }): Promise<AnalyticsMetric[]> {
    console.warn('analytics_metrics table not created yet');
    return [];
  }

  async recordMetric(metric: Omit<AnalyticsMetric, 'id' | 'created_at'>): Promise<AnalyticsMetric> {
    console.warn('analytics_metrics table not created yet');
    return { ...metric, id: 'mock-id', created_at: new Date().toISOString() } as AnalyticsMetric;
  }

  async getCrossDepartmentalSummary(): Promise<any> {
    return {
      revenue: { total: 0, average: 0, latest: 0, count: 0, trend: 0 },
      employees: { total: 0, average: 0, latest: 0, count: 0, trend: 0 },
      customers: { total: 0, average: 0, latest: 0, count: 0, trend: 0 },
      performance: await this.getRecentPerformanceData()
    };
  }

  async getRecentPerformanceData(): Promise<any> {
    return {
      systemHealth: 98.5,
      activeUsers: 0,
      apiResponseTime: 145,
      errorRate: 0.02,
      lastUpdated: new Date().toISOString()
    };
  }

  async getDashboardWidgets(department: string): Promise<DashboardWidget[]> {
    console.warn('dashboard_widgets table not created yet');
    return [];
  }

  async createWidget(widget: Omit<DashboardWidget, 'id' | 'created_at'>): Promise<DashboardWidget> {
    console.warn('dashboard_widgets table not created yet');
    return { ...widget, id: 'mock-id', created_at: new Date().toISOString() } as DashboardWidget;
  }

  async generateReport(reportConfig: {
    title: string;
    description: string;
    type: Report['report_type'];
    period: { start: string; end: string };
    departments: string[];
    generatedBy: string;
  }): Promise<Report> {
    console.warn('reports table not created yet');
    const report: Report = {
      id: 'mock-id',
      title: reportConfig.title,
      description: reportConfig.description,
      report_type: reportConfig.type,
      generated_by: reportConfig.generatedBy,
      data: {},
      period_start: reportConfig.period.start,
      period_end: reportConfig.period.end,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    return report;
  }

  async getReports(department?: string): Promise<Report[]> {
    console.warn('reports table not created yet');
    return [];
  }
}

export const analyticsService = AnalyticsService.getInstance();
