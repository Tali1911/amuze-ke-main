
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import EventCalendar from '@/components/calendar/EventCalendar';
import EventManagement from '@/components/calendar/EventManagement';
import { Event, saveEvent, loadEvents, deleteEvent } from '@/services/calendarService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CalendarDays, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState("calendar");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      const loadedEvents = await loadEvents();
      if (loadedEvents.length > 0) {
        // Ensure all events have proper Date objects
        const formattedEvents = loadedEvents.map(event => ({
          ...event,
          start: event.start instanceof Date ? event.start : new Date(event.start),
          end: event.end instanceof Date ? event.end : new Date(event.end)
        }));
        setEvents(formattedEvents);
        console.log('AdminCalendar loaded events:', formattedEvents.length);
      } else {
        console.log('AdminCalendar: No events found');
      }
    };
    fetchEvents();
  }, []);
  
  const handleAddEvent = (newEvent: Event) => {
    setEvents([...events, newEvent]);
    toast({
      title: "Event Added",
      description: `"${newEvent.title}" has been added to the calendar.`,
      duration: 3000,
    });
    setActiveTab("calendar");
    console.log('Event added and saved:', newEvent.title);
  };

  const handleEventEdited = (updatedEvent: Event) => {
    setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditingEvent(null);
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" has been updated successfully.`,
      duration: 3000,
    });
    setActiveTab("calendar");
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setActiveTab("add");
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "The event has been removed from the calendar.",
        duration: 3000,
      });
      console.log('Event deleted:', eventId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Calendar Management</h2>
          <p className="text-gray-500">
            Add, edit, and manage program events that appear on the calendar
          </p>
        </div>
        <Button onClick={() => setActiveTab("add")} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Event
        </Button>
      </div>
      
      <Tabs 
        defaultValue="calendar" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="add">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Event
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <EventCalendar 
                isAdmin={true}
                events={events}
                onDeleteEvent={handleDeleteEvent} 
              />
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  List of all scheduled program events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events
                      .sort((a, b) => {
                        const dateA = a.start instanceof Date ? a.start : new Date(a.start);
                        const dateB = b.start instanceof Date ? b.start : new Date(b.start);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((event) => {
                        const isMultiDate = event.eventDates && Array.isArray(event.eventDates) && event.eventDates.length > 0;
                        
                        let dateDisplay: string;
                        if (isMultiDate) {
                          try {
                            const firstDate = new Date(event.eventDates![0]);
                            const lastDate = new Date(event.eventDates![event.eventDates!.length - 1]);
                            
                            if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
                              throw new Error('Invalid date');
                            }
                            
                            dateDisplay = event.eventDates!.length === 1
                              ? format(firstDate, 'MMM d, yyyy')
                              : `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d, yyyy')} (${event.eventDates!.length} days)`;
                          } catch (error) {
                            console.error('Invalid date in eventDates:', event.eventDates, error);
                            dateDisplay = 'Invalid dates';
                          }
                        } else {
                          const startDate = event.start instanceof Date ? event.start : new Date(event.start);
                          dateDisplay = isNaN(startDate.getTime()) 
                            ? 'Invalid date' 
                            : format(startDate, 'MMM d, yyyy');
                        }
                        
                        return (
                          <Card key={event.id} className="overflow-hidden">
                            <div className={`h-1 ${event.color}`} />
                            <CardContent className="p-4 flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{event.title}</h4>
                                  {isMultiDate && (
                                    <Badge variant="secondary" className="text-xs">
                                      Multi-Date
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {dateDisplay}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditClick(event)}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No events have been added yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <EventManagement 
            onAddEvent={handleAddEvent}
            onEditComplete={handleEventEdited}
            editingEvent={editingEvent}
          />
          {editingEvent && (
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className="w-full mt-4"
            >
              Cancel Editing
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCalendar;
