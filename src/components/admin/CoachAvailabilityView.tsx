import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { coachAvailabilityService, CoachAvailability } from '@/services/coachAvailabilityService';
import { supabase } from '@/integrations/supabase/client';
import { formatLocalDate } from '@/utils/dateUtils';
import { isBefore, startOfToday } from 'date-fns';

interface CoachProfile {
  id: string;
  full_name: string;
}

const CoachAvailabilityView: React.FC = () => {
  const [entries, setEntries] = useState<(CoachAvailability & { coach_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const availability = await coachAvailabilityService.getAllAvailability();

      // Fetch coach names
      const coachIds = [...new Set(availability.map(a => a.coach_id))];
      let coachMap: Record<string, string> = {};

      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', coachIds);

        if (profiles) {
          coachMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name || 'Unknown']));
        }
      }

      const enriched = availability.map(a => ({
        ...a,
        coach_name: coachMap[a.coach_id] || 'Unknown Coach',
      }));

      setEntries(enriched);
    } catch (err) {
      console.error('Error loading coach availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = startOfToday();
  const upcoming = entries.filter(e => !isBefore(new Date(e.unavailable_date + 'T00:00:00'), today));
  const past = entries.filter(e => isBefore(new Date(e.unavailable_date + 'T00:00:00'), today));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coach Availability</h2>
          <p className="text-muted-foreground">View all coach unavailability entries for staffing planning</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Upcoming Unavailability ({upcoming.length})
          </CardTitle>
          <CardDescription>Dates coaches have marked as unavailable (today and future)</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No upcoming unavailability entries.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Notified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.coach_name}</TableCell>
                    <TableCell>{formatLocalDate(entry.unavailable_date, 'EEE, MMM d, yyyy')}</TableCell>
                    <TableCell>{entry.remark}</TableCell>
                    <TableCell>
                      <Badge variant={entry.notified_admin ? "default" : "secondary"}>
                        {entry.notified_admin ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Entries ({past.length})</CardTitle>
            <CardDescription>Historical unavailability records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.coach_name}</TableCell>
                    <TableCell>{formatLocalDate(entry.unavailable_date, 'EEE, MMM d, yyyy')}</TableCell>
                    <TableCell>{entry.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachAvailabilityView;
