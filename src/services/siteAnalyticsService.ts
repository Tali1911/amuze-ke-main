import { supabase } from '@/integrations/supabase/client';

export interface PageView {
  id: string;
  page_path: string;
  page_title: string | null;
  visitor_id: string;
  user_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface PageClick {
  id: string;
  page_view_id: string | null;
  page_path: string;
  element_type: string;
  element_text: string | null;
  element_href: string | null;
  visitor_id: string;
  created_at: string;
}

export interface PageAnalytics {
  page_path: string;
  page_title: string;
  views: number;
  unique_visitors: number;
  clicks: number;
  ctr: number;
}

export interface UserAnalytics {
  visitor_id: string;
  total_views: number;
  total_clicks: number;
  pages_visited: number;
  sessions: number;
  ctr: number;
  first_visit: string;
  last_visit: string;
}

export interface CTRTrend {
  date: string;
  views: number;
  clicks: number;
  ctr: number;
}

// Generate or retrieve visitor ID
export function getVisitorId(): string {
  const key = 'amuse_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

// Generate or retrieve session ID
export function getSessionId(): string {
  const key = 'amuse_session_id';
  const sessionKey = 'amuse_session_timestamp';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const lastTimestamp = sessionStorage.getItem(sessionKey);
  const now = Date.now();

  if (lastTimestamp && now - parseInt(lastTimestamp) < SESSION_TIMEOUT) {
    sessionStorage.setItem(sessionKey, now.toString());
    return sessionStorage.getItem(key) || crypto.randomUUID();
  }

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(key, sessionId);
  sessionStorage.setItem(sessionKey, now.toString());
  return sessionId;
}

let currentPageViewId: string | null = null;

export async function trackPageView(path: string, title: string): Promise<string | null> {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { data: session } = await supabase.auth.getSession();

    const { data, error } = await (supabase as any)
      .from('page_views')
      .insert({
        page_path: path,
        page_title: title,
        visitor_id: visitorId,
        user_id: session?.session?.user?.id || null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: sessionId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error tracking page view:', error);
      return null;
    }

    currentPageViewId = data?.id || null;
    return currentPageViewId;
  } catch (err) {
    console.error('Error tracking page view:', err);
    return null;
  }
}

export async function trackClick(
  elementType: string,
  elementText: string,
  href?: string,
  pagePath?: string
): Promise<void> {
  try {
    const visitorId = getVisitorId();

    await (supabase as any).from('page_clicks').insert({
      page_view_id: currentPageViewId,
      page_path: pagePath || window.location.pathname,
      element_type: elementType,
      element_text: elementText,
      element_href: href || null,
      visitor_id: visitorId
    });
  } catch (err) {
    console.error('Error tracking click:', err);
  }
}

export async function getPageAnalytics(
  startDate: Date,
  endDate: Date
): Promise<PageAnalytics[]> {
  try {
    // Get page views
    const { data: views, error: viewsError } = await (supabase as any)
      .from('page_views')
      .select('page_path, page_title, visitor_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (viewsError) throw viewsError;

    // Get clicks
    const { data: clicks, error: clicksError } = await (supabase as any)
      .from('page_clicks')
      .select('page_path')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (clicksError) throw clicksError;

    // Aggregate by page
    const pageMap = new Map<string, {
      page_title: string;
      views: number;
      visitors: Set<string>;
      clicks: number;
    }>();

    (views || []).forEach((v: any) => {
      const existing = pageMap.get(v.page_path) || {
        page_title: v.page_title || v.page_path,
        views: 0,
        visitors: new Set<string>(),
        clicks: 0
      };
      existing.views++;
      existing.visitors.add(v.visitor_id);
      pageMap.set(v.page_path, existing);
    });

    (clicks || []).forEach((c: any) => {
      const existing = pageMap.get(c.page_path);
      if (existing) {
        existing.clicks++;
      }
    });

    return Array.from(pageMap.entries()).map(([path, data]) => ({
      page_path: path,
      page_title: data.page_title,
      views: data.views,
      unique_visitors: data.visitors.size,
      clicks: data.clicks,
      ctr: data.views > 0 ? Math.round((data.clicks / data.views) * 100 * 10) / 10 : 0
    }));
  } catch (err) {
    console.error('Error fetching page analytics:', err);
    return [];
  }
}

export async function getUserAnalytics(
  startDate: Date,
  endDate: Date
): Promise<UserAnalytics[]> {
  try {
    // Get page views
    const { data: views, error: viewsError } = await (supabase as any)
      .from('page_views')
      .select('visitor_id, page_path, session_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (viewsError) throw viewsError;

    // Get clicks
    const { data: clicks, error: clicksError } = await (supabase as any)
      .from('page_clicks')
      .select('visitor_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (clicksError) throw clicksError;

    // Aggregate by visitor
    const visitorMap = new Map<string, {
      views: number;
      clicks: number;
      pages: Set<string>;
      sessions: Set<string>;
      first_visit: string;
      last_visit: string;
    }>();

    (views || []).forEach((v: any) => {
      const existing = visitorMap.get(v.visitor_id) || {
        views: 0,
        clicks: 0,
        pages: new Set<string>(),
        sessions: new Set<string>(),
        first_visit: v.created_at,
        last_visit: v.created_at
      };
      existing.views++;
      existing.pages.add(v.page_path);
      if (v.session_id) existing.sessions.add(v.session_id);
      if (v.created_at < existing.first_visit) existing.first_visit = v.created_at;
      if (v.created_at > existing.last_visit) existing.last_visit = v.created_at;
      visitorMap.set(v.visitor_id, existing);
    });

    (clicks || []).forEach((c: any) => {
      const existing = visitorMap.get(c.visitor_id);
      if (existing) {
        existing.clicks++;
      }
    });

    return Array.from(visitorMap.entries()).map(([visitorId, data]) => ({
      visitor_id: visitorId,
      total_views: data.views,
      total_clicks: data.clicks,
      pages_visited: data.pages.size,
      sessions: data.sessions.size,
      ctr: data.views > 0 ? Math.round((data.clicks / data.views) * 100 * 10) / 10 : 0,
      first_visit: data.first_visit,
      last_visit: data.last_visit
    }));
  } catch (err) {
    console.error('Error fetching user analytics:', err);
    return [];
  }
}

export async function getCTRTrend(
  startDate: Date,
  endDate: Date,
  granularity: 'daily' | 'weekly' = 'daily'
): Promise<CTRTrend[]> {
  try {
    // Get page views
    const { data: views, error: viewsError } = await (supabase as any)
      .from('page_views')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (viewsError) throw viewsError;

    // Get clicks
    const { data: clicks, error: clicksError } = await (supabase as any)
      .from('page_clicks')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (clicksError) throw clicksError;

    // Aggregate by date
    const dateMap = new Map<string, { views: number; clicks: number }>();

    const getDateKey = (dateStr: string) => {
      const date = new Date(dateStr);
      if (granularity === 'weekly') {
        const day = date.getDay();
        const diff = date.getDate() - day;
        date.setDate(diff);
      }
      return date.toISOString().split('T')[0];
    };

    (views || []).forEach((v: any) => {
      const key = getDateKey(v.created_at);
      const existing = dateMap.get(key) || { views: 0, clicks: 0 };
      existing.views++;
      dateMap.set(key, existing);
    });

    (clicks || []).forEach((c: any) => {
      const key = getDateKey(c.created_at);
      const existing = dateMap.get(key) || { views: 0, clicks: 0 };
      existing.clicks++;
      dateMap.set(key, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        clicks: data.clicks,
        ctr: data.views > 0 ? Math.round((data.clicks / data.views) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('Error fetching CTR trend:', err);
    return [];
  }
}

export async function getSummaryStats(startDate: Date, endDate: Date) {
  try {
    const { data: views, error: viewsError } = await (supabase as any)
      .from('page_views')
      .select('visitor_id, session_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (viewsError) throw viewsError;

    const { count: clickCount, error: clicksError } = await (supabase as any)
      .from('page_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (clicksError) throw clicksError;

    const totalViews = views?.length || 0;
    const uniqueVisitors = new Set(views?.map((v: any) => v.visitor_id)).size;
    const totalClicks = clickCount || 0;
    const overallCTR = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100 * 10) / 10 : 0;

    return {
      totalViews,
      uniqueVisitors,
      totalClicks,
      overallCTR
    };
  } catch (err) {
    console.error('Error fetching summary stats:', err);
    return { totalViews: 0, uniqueVisitors: 0, totalClicks: 0, overallCTR: 0 };
  }
}
