
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const ProgramsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Program Management</h2>
        <p className="text-gray-600">Create and manage coaching programs</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Program
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Basketball Fundamentals</CardTitle>
          <CardDescription>Ages 8-12</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Enrolled:</span>
              <span className="text-sm font-medium">24/30</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Duration:</span>
              <span className="text-sm font-medium">8 weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="default">Active</Badge>
            </div>
            <Button className="w-full" variant="outline">Manage</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Soccer Skills Development</CardTitle>
          <CardDescription>Ages 6-10</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Enrolled:</span>
              <span className="text-sm font-medium">18/25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Duration:</span>
              <span className="text-sm font-medium">6 weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="default">Active</Badge>
            </div>
            <Button className="w-full" variant="outline">Manage</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const ScheduleTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Schedule Management</h2>
      <p className="text-gray-600">Manage your coaching schedule and sessions</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>This Week's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">24</div>
          <p className="text-sm text-muted-foreground">6 sessions per day</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">8</div>
          <p className="text-sm text-muted-foreground">Open slots this week</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const StudentsTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Student Management</h2>
      <p className="text-gray-600">Track student progress and attendance</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">156</div>
          <p className="text-sm text-muted-foreground">Across all programs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">94.2%</div>
          <p className="text-sm text-green-600">Above target</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">4.7/5</div>
          <p className="text-sm text-muted-foreground">Average improvement</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const ResourcesTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Training Resources</h2>
      <p className="text-gray-600">Manage training materials and resources</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Resource Library</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Basketball Drill Videos</h4>
              <p className="text-sm text-muted-foreground">15 training videos</p>
            </div>
            <Button variant="outline">View</Button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Soccer Training Plans</h4>
              <p className="text-sm text-muted-foreground">8 session plans</p>
            </div>
            <Button variant="outline">View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const ReportsTab: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Performance Reports</h2>
      <p className="text-gray-600">Generate student and program reports</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Available Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Student Progress Report</h4>
              <p className="text-sm text-muted-foreground">Individual student performance</p>
            </div>
            <Button variant="outline">Generate</Button>
          </div>
          <div className="flex justify-between items-center p-4 border rounded">
            <div>
              <h4 className="font-medium">Program Attendance Report</h4>
              <p className="text-sm text-muted-foreground">Attendance statistics by program</p>
            </div>
            <Button variant="outline">Generate</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
