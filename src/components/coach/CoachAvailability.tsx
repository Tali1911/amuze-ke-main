import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { coachAvailabilityService, CoachAvailability as AvailabilityType } from '@/services/coachAvailabilityService';
import { toast } from 'sonner';

const CoachAvailabilityComponent: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AvailabilityType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
    if (!user?.id) return;
    const data = await coachAvailabilityService.getAvailability(user.id);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!selectedDate || !remark.trim() || !user?.id) {
      toast.error('Please select a date and provide a reason');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Check for duplicate
    if (entries.some(e => e.unavailable_date === dateStr)) {
      toast.error('You already marked this date as unavailable');
      return;
    }

    setSubmitting(true);
    const success = await coachAvailabilityService.addUnavailability(user.id, dateStr, remark.trim());
    
    if (success) {
      // Send notification email to admin
      await coachAvailabilityService.notifyAdmin(
        user.full_name || user.username || user.email,
        dateStr,
        remark.trim()
      );
      toast.success('Unavailability recorded and admin notified');
      setSelectedDate(undefined);
      setRemark('');
      fetchEntries();
    } else {
      toast.error('Failed to save unavailability');
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    const success = await coachAvailabilityService.removeUnavailability(id);
    if (success) {
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Availability entry removed');
    } else {
      toast.error('Failed to remove entry');
    }
  };

  // Dates that are already marked unavailable
  const unavailableDates = entries.map(e => new Date(e.unavailable_date + 'T00:00:00'));

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mark Unavailability</CardTitle>
          <CardDescription>Select a date you won't be available and explain why. Admin will be notified immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                  modifiers={{ unavailable: unavailableDates }}
                  modifiersStyles={{ unavailable: { backgroundColor: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' } }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="Reason for unavailability (e.g., personal leave, medical appointment...)"
              className="min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{remark.length}/500</p>
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !selectedDate || !remark.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit & Notify Admin
          </Button>
        </CardContent>
      </Card>

      {/* Existing unavailability entries */}
      <Card>
        <CardHeader>
          <CardTitle>Your Unavailability Schedule</CardTitle>
          <CardDescription>{entries.length} date(s) marked</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No unavailability dates marked yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => {
                const entryDate = new Date(entry.unavailable_date + 'T00:00:00');
                const isPast = entryDate < new Date();
                return (
                  <div key={entry.id} className={cn("flex items-start justify-between p-3 border rounded-lg", isPast && "opacity-60")}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{format(entryDate, 'EEEE, MMMM d, yyyy')}</span>
                        {isPast && <Badge variant="secondary" className="text-xs">Past</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{entry.remark}</p>
                    </div>
                    {!isPast && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachAvailabilityComponent;
