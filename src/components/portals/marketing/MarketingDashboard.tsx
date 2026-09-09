
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, TrendingUp, Target } from "lucide-react";
import { leadsService } from '@/services/leadsService';
import { emailManagementService } from '@/services/emailManagementService';
import { supabase } from '@/integrations/supabase/client';

const MarketingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    conversionRate: 0,
    activeCampaigns: 0,
    emailOpenRate: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const leads = await leadsService.getAllLeads();
      const safeLeads = Array.isArray(leads) ? leads : [];
      const convertedLeads = safeLeads.filter(l => l.status === 'converted');
      const conversionRate = safeLeads.length > 0 ? (convertedLeads.length / safeLeads.length) * 100 : 0;

      // Active campaigns from DB
      const client = supabase as any;
      const { data: activeCamps } = await client
        .from('campaigns')
        .select('id')
        .in('status', ['active', 'planning']);

      // Recent email campaigns (last 5)
      const allCamps = await emailManagementService.getCampaigns();
      setRecentCampaigns(allCamps.slice(0, 5));

      // Email open rate from email_deliveries (marketing only)
      const { data: deliveries } = await client
        .from('email_deliveries')
        .select('status')
        .eq('email_type', 'marketing');
      const dRows = (deliveries || []) as any[];
      const delivered = dRows.filter(d => ['delivered', 'opened', 'clicked'].includes(d.status)).length;
      const opened = dRows.filter(d => ['opened', 'clicked'].includes(d.status)).length;
      const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;

      setMetrics({
        totalLeads: safeLeads.length,
        conversionRate: Math.round(conversionRate),
        activeCampaigns: activeCamps?.length || 0,
        emailOpenRate: openRate,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : metrics.totalLeads}
            </div>
            <p className="text-xs text-muted-foreground">
              From website forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${metrics.conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : metrics.activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${metrics.emailOpenRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 21%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Email Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Campaigns</CardTitle>
          <CardDescription>Last campaigns sent from the Campaigns tab</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No campaigns sent yet. Use the Campaigns tab to create one.
              </p>
            ) : recentCampaigns.map(c => (
              <div key={c.id} className="border rounded-lg p-3">
                <h4 className="font-medium">{c.name}</h4>
                <p className="text-sm text-muted-foreground">{c.subject}</p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant={c.status === 'completed' ? 'default' : 'secondary'}>{c.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {c.sent_count ?? 0} / {c.recipient_count ?? 0} sent
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;
