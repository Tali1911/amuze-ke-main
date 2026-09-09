
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const CampaignsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Campaign Management</h2>
        <p className="text-gray-600">Create and manage marketing campaigns</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        New Campaign
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Summer Program Launch</CardTitle>
          <CardDescription>Email Marketing Campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Open Rate:</span>
              <span className="text-sm font-medium">72%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Reach:</span>
              <span className="text-sm font-medium">1,247 contacts</span>
            </div>
            <Button className="w-full" variant="outline">View Details</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent Referral Program</CardTitle>
          <CardDescription>Social Media Campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="secondary">Planning</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Start Date:</span>
              <span className="text-sm font-medium">Next Week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Budget:</span>
              <span className="text-sm font-medium">$2,500</span>
            </div>
            <Button className="w-full" variant="outline">Edit Campaign</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const LeadGenerationTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Lead Generation</h2>
      <p className="text-gray-600">Track and manage potential customers</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>New Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">42</div>
          <p className="text-sm text-muted-foreground">This week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualified Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">28</div>
          <p className="text-sm text-muted-foreground">Ready for contact</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">66.7%</div>
          <p className="text-sm text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const ReportsTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Marketing Reports</h2>
      <p className="text-gray-600">Generate and view marketing reports</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Available Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Monthly Performance Report</h4>
              <p className="text-sm text-muted-foreground">Campaign performance and ROI analysis</p>
            </div>
            <Button variant="outline">Generate</Button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Customer Acquisition Report</h4>
              <p className="text-sm text-muted-foreground">Lead sources and conversion metrics</p>
            </div>
            <Button variant="outline">Generate</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
