import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Calendar, Users, FileText, BarChart3, Tent, X, MapPin, Clock } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { coachAccessService } from '@/services/coachAccessService';
import { loadEvents, Event } from '@/services/calendarService';
import { format, startOfWeek, endOfMonth } from 'date-fns';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hasRecordAccess, setHasRecordAccess] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user?.id) {
      coachAccessService.checkAccess(user.id).then(setHasRecordAccess);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEvents().then(events => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthEnd = endOfMonth(now);
      const upcoming = events
        .filter(e => {
          const start = e.start instanceof Date ? e.start : new Date(e.start);
          const end = e.end instanceof Date ? e.end : new Date(e.end);
          // Include any event that overlaps with [weekStart, monthEnd]
          return end >= weekStart && start <= monthEnd;
        })
        .sort((a, b) => {
          const aStart = a.start instanceof Date ? a.start : new Date(a.start);
          const bStart = b.start instanceof Date ? b.start : new Date(b.start);
          return aStart.getTime() - bStart.getTime();
        });
      setUpcomingEvents(upcoming);
    });
  }, []);

  return (
    <div className="space-y-6">
      {hasRecordAccess && showBanner && (
        <Alert className="border-primary/30 bg-primary/5 relative">
          <Tent className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-semibold">Record Portal Access Granted</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            You have been granted access to the Record Portal. Use the "Record Portal" tab in the sidebar to manage camp registrations, attendance, and check-ins.
          </AlertDescription>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setShowBanner(false)}>
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Coach Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">6 sessions per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">Program completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events from Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Events
          </CardTitle>
          <CardDescription>This week through end of month</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No events for the rest of this month.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const start = event.start instanceof Date ? event.start : new Date(event.start);
                const end = event.end instanceof Date ? event.end : new Date(event.end);
                return (
                  <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(start, 'EEE, MMM d')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {event.eventType && (
                      <Badge variant="outline" className="capitalize">{event.eventType}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common coaching tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Create Program
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add Student
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachDashboard;
