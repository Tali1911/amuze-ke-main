import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, Eye, MousePointer, AlertTriangle, Ban, TrendingUp, TrendingDown } from "lucide-react";
import { emailManagementService, EmailHealthStats } from '@/services/emailManagementService';

const EmailHealthDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmailHealthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await emailManagementService.getEmailHealthStats();
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading email health stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">Failed to load stats</div>;
  }

  const MetricCard = ({ 
    title, 
    value, 
    percentage, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: number; 
    percentage?: number; 
    icon: any; 
    trend?: 'up' | 'down' 
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            {percentage !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {percentage.toFixed(1)}%
                {trend && (
                  trend === 'up' ? 
                    <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" /> : 
                    <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
                )}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Health Dashboard</h2>
        <p className="text-muted-foreground">Monitor your email delivery performance and engagement</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Emails Sent"
          value={stats.totalSent}
          icon={Mail}
        />
        <MetricCard
          title="Successfully Delivered"
          value={stats.delivered}
          percentage={stats.deliveryRate}
          icon={CheckCircle}
          trend="up"
        />
        <MetricCard
          title="Emails Opened"
          value={stats.opened}
          percentage={stats.openRate}
          icon={Eye}
          trend="up"
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Clicks"
          value={stats.clicked}
          percentage={stats.clickRate}
          icon={MousePointer}
          trend="up"
        />
        <MetricCard
          title="Bounces"
          value={stats.bounced}
          percentage={stats.bounceRate}
          icon={AlertTriangle}
          trend="down"
        />
        <MetricCard
          title="Spam Reports"
          value={stats.spam}
          icon={Ban}
          trend="down"
        />
      </div>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Delivery Rate</span>
                <span className="text-sm font-bold">{stats.deliveryRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.deliveryRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.deliveryRate >= 95 ? '✓ Excellent' : stats.deliveryRate >= 90 ? '⚠ Good' : '✗ Needs Attention'}
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Open Rate</span>
                <span className="text-sm font-bold">{stats.openRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.openRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.openRate >= 20 ? '✓ Excellent' : stats.openRate >= 15 ? '⚠ Average' : '✗ Below Average'}
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm font-bold">{stats.bounceRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.bounceRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.bounceRate <= 2 ? '✓ Excellent' : stats.bounceRate <= 5 ? '⚠ Acceptable' : '✗ High - Action Required'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppression Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">Email Suppressions</p>
              <p className="text-sm text-orange-700">
                {stats.suppressedCount} email{stats.suppressedCount !== 1 ? 's' : ''} currently suppressed (bounced, unsubscribed, or spam)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailHealthDashboard;
