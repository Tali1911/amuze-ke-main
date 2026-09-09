import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Users, Eye, MousePointerClick, Globe, Clock, Zap } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInSeconds } from 'date-fns';

interface LiveVisitor {
  visitor_id: string;
  page_path: string;
  page_title: string;
  last_seen: Date;
  session_id: string;
}

interface RecentActivity {
  id: string;
  type: 'view' | 'click';
  page_path: string;
  page_title?: string;
  element_text?: string;
  visitor_id: string;
  created_at: string;
}

const RealTimeAnalytics: React.FC = () => {
  const [liveVisitors, setLiveVisitors] = useState<Map<string, LiveVisitor>>(new Map());
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activePages, setActivePages] = useState<Map<string, number>>(new Map());
  const [todayStats, setTodayStats] = useState({
    views: 0,
    clicks: 0,
    visitors: new Set<string>()
  });
  const [isConnected, setIsConnected] = useState(false);

  // Clean up stale visitors (inactive for more than 5 minutes)
  const cleanupStaleVisitors = useCallback(() => {
    const now = new Date();
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    setLiveVisitors(prev => {
      const updated = new Map(prev);
      for (const [visitorId, visitor] of updated) {
        if (now.getTime() - visitor.last_seen.getTime() > STALE_THRESHOLD) {
          updated.delete(visitorId);
        }
      }
      return updated;
    });

    // Update active pages based on remaining visitors
    setActivePages(prev => {
      const pageCounts = new Map<string, number>();
      for (const visitor of liveVisitors.values()) {
        const count = pageCounts.get(visitor.page_path) || 0;
        pageCounts.set(visitor.page_path, count + 1);
      }
      return pageCounts;
    });
  }, [liveVisitors]);

  // Fetch today's stats
  const fetchTodayStats = useCallback(async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      const { data: views } = await (supabase as any)
        .from('page_views')
        .select('visitor_id')
        .gte('created_at', startOfDay.toISOString());

      const { count: clickCount } = await (supabase as any)
        .from('page_clicks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());

      const visitors = new Set<string>((views || []).map((v: any) => v.visitor_id));

      setTodayStats({
        views: views?.length || 0,
        clicks: clickCount || 0,
        visitors
      });
    } catch (err) {
      console.error('Error fetching today stats:', err);
    }
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      const { data: recentViews } = await (supabase as any)
        .from('page_views')
        .select('id, page_path, page_title, visitor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentClicks } = await (supabase as any)
        .from('page_clicks')
        .select('id, page_path, element_text, visitor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const combined: RecentActivity[] = [
        ...(recentViews || []).map((v: any) => ({
          id: v.id,
          type: 'view' as const,
          page_path: v.page_path,
          page_title: v.page_title,
          visitor_id: v.visitor_id,
          created_at: v.created_at
        })),
        ...(recentClicks || []).map((c: any) => ({
          id: c.id,
          type: 'click' as const,
          page_path: c.page_path,
          element_text: c.element_text,
          visitor_id: c.visitor_id,
          created_at: c.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);

      setRecentActivity(combined);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchTodayStats();
    fetchRecentActivity();

    // Set up real-time subscriptions
    const pageViewsChannel = supabase
      .channel('realtime-page-views')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views'
        },
        (payload: any) => {
          const newView = payload.new;
          
          // Update live visitors
          setLiveVisitors(prev => {
            const updated = new Map(prev);
            updated.set(newView.visitor_id, {
              visitor_id: newView.visitor_id,
              page_path: newView.page_path,
              page_title: newView.page_title || newView.page_path,
              last_seen: new Date(),
              session_id: newView.session_id
            });
            return updated;
          });

          // Update active pages
          setActivePages(prev => {
            const updated = new Map(prev);
            const count = updated.get(newView.page_path) || 0;
            updated.set(newView.page_path, count + 1);
            return updated;
          });

          // Update today's stats
          setTodayStats(prev => ({
            views: prev.views + 1,
            clicks: prev.clicks,
            visitors: new Set([...prev.visitors, newView.visitor_id])
          }));

          // Add to recent activity
          setRecentActivity(prev => [{
            id: newView.id,
            type: 'view' as const,
            page_path: newView.page_path,
            page_title: newView.page_title,
            visitor_id: newView.visitor_id,
            created_at: newView.created_at
          }, ...prev].slice(0, 15));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const pageClicksChannel = supabase
      .channel('realtime-page-clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_clicks'
        },
        (payload: any) => {
          const newClick = payload.new;

          // Update today's stats
          setTodayStats(prev => ({
            ...prev,
            clicks: prev.clicks + 1
          }));

          // Add to recent activity
          setRecentActivity(prev => [{
            id: newClick.id,
            type: 'click' as const,
            page_path: newClick.page_path,
            element_text: newClick.element_text,
            visitor_id: newClick.visitor_id,
            created_at: newClick.created_at
          }, ...prev].slice(0, 15));
        }
      )
      .subscribe();

    // Cleanup stale visitors every minute
    const cleanupInterval = setInterval(cleanupStaleVisitors, 60000);

    return () => {
      supabase.removeChannel(pageViewsChannel);
      supabase.removeChannel(pageClicksChannel);
      clearInterval(cleanupInterval);
    };
  }, [fetchTodayStats, fetchRecentActivity, cleanupStaleVisitors]);

  const getTimeAgo = (dateStr: string) => {
    const seconds = differenceInSeconds(new Date(), new Date(dateStr));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return format(new Date(dateStr), 'HH:mm');
  };

  const activeVisitorCount = liveVisitors.size;
  const topPages = Array.from(activePages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Real-Time Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Live visitor activity on your website
          </p>
        </div>
        <Badge 
          variant={isConnected ? "default" : "secondary"}
          className={isConnected ? "bg-green-100 text-green-800" : ""}
        >
          <Zap className="h-3 w-3 mr-1" />
          {isConnected ? 'Live' : 'Connecting...'}
        </Badge>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg animate-pulse">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-3xl font-bold text-green-600">{activeVisitorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views Today</p>
                <p className="text-2xl font-bold">{todayStats.views.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clicks Today</p>
                <p className="text-2xl font-bold">{todayStats.clicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visitors Today</p>
                <p className="text-2xl font-bold">{todayStats.visitors.size.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Active Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active visitors right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPages.map(([path, count]) => (
                  <div key={path} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-medium text-sm truncate max-w-[200px]">{path}</span>
                    </div>
                    <Badge variant="secondary">{count} visitor{count !== 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-1.5 rounded-full mt-0.5 ${
                        activity.type === 'view' 
                          ? 'bg-primary/10' 
                          : 'bg-secondary/10'
                      }`}>
                        {activity.type === 'view' ? (
                          <Eye className="h-3 w-3 text-primary" />
                        ) : (
                          <MousePointerClick className="h-3 w-3 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.type === 'view' ? 'Page View' : 'Click'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.type === 'view' 
                            ? (activity.page_title || activity.page_path)
                            : `"${activity.element_text}" on ${activity.page_path}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <code className="bg-muted px-1 rounded">{activity.visitor_id.slice(0, 8)}</code>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Active Sessions ({activeVisitorCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveVisitors.size === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active sessions</p>
              <p className="text-xs mt-1">Sessions appear when visitors browse the site</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(liveVisitors.values()).map((visitor) => (
                <div
                  key={visitor.visitor_id}
                  className="p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                      {visitor.visitor_id.slice(0, 8)}
                    </code>
                  </div>
                  <p className="text-sm font-medium truncate">{visitor.page_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{visitor.page_path}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalytics;
