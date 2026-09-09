
import React, { useState, useEffect } from 'react';
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  eachDayOfInterval,
  parseISO,
  set,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
  getMonth
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  Users, 
  Grid3X3, 
  LayoutGrid,
  X,
  FileText,
  Calendar as CalendarDateIcon,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { Event, Activity, loadEvents, createProgramDownload, updateEvent, deleteEvent } from '@/services/calendarService';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

interface EventCalendarProps {
  className?: string;
  showControls?: boolean;
  isAdmin?: boolean;
  events?: Event[];
  showAgeGroups?: boolean;
  showPdfDownload?: boolean;
  onDeleteEvent?: (eventId: string) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ 
  className, 
  showControls = true,
  isAdmin = false,
  events: externalEvents,
  showAgeGroups = false,
  showPdfDownload = false,
  onDeleteEvent
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'year'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState<boolean>(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (externalEvents) {
        setEvents(externalEvents);
      } else {
        const loadedEvents = await loadEvents();
        setEvents(loadedEvents);
      }
    };
    fetchEvents();
  }, [externalEvents]);
  
  const getDays = () => {
    if (view === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const startDate = startOfWeek(start);
      const endDate = endOfWeek(end);
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  };
  
  const days = getDays();
  
  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else if (view === 'year') {
      setCurrentDate(subYears(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else if (view === 'year') {
      setCurrentDate(addYears(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  const getEventsByDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
      const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
      
      // If event has specific dates, check if day matches any of them
      if (event.eventDates && event.eventDates.length > 0) {
        const dayStr = format(day, 'yyyy-MM-dd');
        return event.eventDates.includes(dayStr);
      }
      
      // Otherwise, show event on every day within its date range
      return day >= new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()) && 
             day <= new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
    });
  };
  
  const getEventTimeDisplay = (event: Event) => {
    const startTime = format(event.start instanceof Date ? event.start : new Date(event.start), 'h:mm a');
    const endTime = format(event.end instanceof Date ? event.end : new Date(event.end), 'h:mm a');
    return `${startTime} - ${endTime}`;
  };
  
  const downloadProgram = (event: Event) => {
    createProgramDownload(event);
  };
  
  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };
  
  const isCurrentMonth = (day: Date) => {
    return isSameMonth(day, currentDate);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      toast.success('Event deleted successfully');
      setEvents(events.filter(e => e.id !== eventId));
      setIsEventDialogOpen(false);
      if (onDeleteEvent) {
        onDeleteEvent(eventId);
      }
    } else {
      toast.error('Failed to delete event');
    }
  };
  
  const getEventDuration = (event: Event) => {
    // If event has specific dates, count them
    if (event.eventDates && event.eventDates.length > 0) {
      const count = event.eventDates.length;
      if (count === 1) return "1 day";
      if (count >= 5 && count <= 7) return "Week-long";
      return `${count} days`;
    }
    
    // Otherwise, calculate from date range
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return "1 day";
    } else if (daysDiff >= 4 && daysDiff <= 6) {
      return "Week-long";
    } else {
      return `${daysDiff + 1} days`;
    }
  };

  const getEventsByMonth = (monthIndex: number) => {
    return events.filter(event => {
      const monthStart = new Date(currentDate.getFullYear(), monthIndex, 1);
      const monthEnd = new Date(currentDate.getFullYear(), monthIndex + 1, 0);
      
      // If event has specific dates, check if any fall in this month
      if (event.eventDates && event.eventDates.length > 0) {
        return event.eventDates.some(dateStr => {
          const eventDate = new Date(dateStr);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      }
      
      // Otherwise check date range overlap
      const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
      const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
      return eventEnd >= monthStart && eventStart <= monthEnd;
    });
  };

  const getMonthDays = (monthIndex: number) => {
    const monthStart = new Date(currentDate.getFullYear(), monthIndex, 1);
    const start = startOfMonth(monthStart);
    const end = endOfMonth(monthStart);
    const startDate = startOfWeek(start);
    const endDate = endOfWeek(end);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-3 border-b pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-forest-600" />
            <CardTitle className="text-base sm:text-lg">Program Calendar</CardTitle>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateToday}
                className="text-xs sm:text-sm"
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={navigatePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm sm:text-lg font-medium">
            {view === 'month' ? (
              format(currentDate, 'MMMM yyyy')
            ) : view === 'week' ? (
              `Week of ${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`
            ) : view === 'year' ? (
              format(currentDate, 'yyyy')
            ) : (
              format(currentDate, 'MMMM d, yyyy')
            )}
          </h3>
          
          <Tabs 
            defaultValue={view}
            value={view} 
            onValueChange={(val) => setView(val as 'month' | 'week' | 'day' | 'year')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 sm:w-[320px] md:w-[400px]">
              <TabsTrigger value="year" className="text-xs sm:text-sm px-1 sm:px-3">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Year</span>
                <span className="sm:hidden">Y</span>
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm px-1 sm:px-3">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Month</span>
                <span className="sm:hidden">M</span>
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm px-1 sm:px-3">
                <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Week</span>
                <span className="sm:hidden">W</span>
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs sm:text-sm px-1 sm:px-3">
                <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Day</span>
                <span className="sm:hidden">D</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 pt-0">
        {view === 'year' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDays = getMonthDays(i);
                const monthEvents = getEventsByMonth(i);
                const monthDate = new Date(currentDate.getFullYear(), i, 1);
                
                return (
                  <Card key={i} className="overflow-hidden border-forest-100 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 bg-gradient-to-r from-forest-50 to-sky-50">
                      <CardTitle className="text-base font-semibold text-center">
                        {format(monthDate, 'MMMM yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-7 gap-px text-center mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                          <div key={idx} className="text-xs font-medium text-muted-foreground py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-px">
                        {monthDays.map((day, index) => {
                          // Use getEventsByDay to properly respect eventDates array
                          const dayEvents = getEventsByDay(day);
                          const isCurrentDay = isToday(day);
                          const inMonth = isSameMonth(day, monthDate);
                          
                          return (
                            <div 
                              key={index}
                              className={cn(
                                "aspect-square text-xs flex items-center justify-center rounded-sm relative cursor-pointer",
                                !inMonth && "text-muted-foreground opacity-40",
                                isCurrentDay && "bg-primary text-primary-foreground font-bold",
                                dayEvents.length > 0 && !isCurrentDay && "bg-forest-100 font-medium",
                                inMonth && !isCurrentDay && dayEvents.length === 0 && "hover:bg-accent"
                              )}
                              onClick={() => {
                                if (dayEvents.length > 0) {
                                  setSelectedEvent(dayEvents[0]);
                                  setIsEventDialogOpen(true);
                                }
                              }}
                            >
                              {format(day, 'd')}
                              {dayEvents.length > 0 && (
                                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-forest-600 rounded-full" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {monthEvents.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Events ({monthEvents.length})</div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {monthEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  "text-xs p-1 rounded truncate cursor-pointer text-white",
                                  event.color
                                )}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsEventDialogOpen(true);
                                }}
                              >
                                {event.title}
                              </div>
                            ))}
                            {monthEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{monthEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {view === 'month' && (
          <div className="grid grid-cols-7 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <div key={day} className="py-1 sm:py-2 border-b font-medium text-[10px] sm:text-sm">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
            
            {days.map((day, index) => {
              const dayEvents = getEventsByDay(day);
              const isCurrentDay = isToday(day);
              const inMonth = isCurrentMonth(day);
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "min-h-[60px] sm:min-h-[100px] border-t border-r p-0.5 sm:p-1 relative",
                    index % 7 === 0 && "border-l",
                    !inMonth && "bg-gray-50",
                    isCurrentDay && "bg-blue-50"
                  )}
                >
                  <div className={cn(
                    "text-[10px] sm:text-sm font-medium leading-none rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center mx-auto sm:mx-0",
                    isCurrentDay && "bg-blue-600 text-white"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Mobile: Show dot indicator only */}
                  <div className="sm:hidden flex justify-center mt-0.5">
                    {dayEvents.length > 0 && (
                      <div 
                        className="flex gap-0.5 cursor-pointer"
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setSelectedEvent(dayEvents[0]);
                            setIsEventDialogOpen(true);
                          }
                        }}
                      >
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div 
                            key={i} 
                            className={cn("w-1.5 h-1.5 rounded-full", event.color)}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">+</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop: Show full event cards */}
                  <div className="hidden sm:block mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer",
                          event.color
                        )}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDialogOpen(true);
                        }}
                      >
                        <span className="text-white">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {view === 'week' && (
          <>
            {/* Mobile: Stacked vertical layout */}
            <div className="sm:hidden divide-y">
              {days.map((day, i) => {
                const dayEvents = getEventsByDay(day);
                return (
                  <div key={i} className={cn(
                    "p-3",
                    isToday(day) && "bg-blue-50"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full",
                        isToday(day) && "bg-blue-600 text-white"
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{format(day, 'EEEE')}</div>
                        <div className="text-xs text-muted-foreground">{format(day, 'MMM yyyy')}</div>
                      </div>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {dayEvents.length > 0 ? (
                      <div className="space-y-2 ml-13">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "p-2 rounded text-white cursor-pointer text-sm",
                              event.color
                            )}
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsEventDialogOpen(true);
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs flex items-center mt-1 opacity-90">
                              <Clock className="h-3 w-3 mr-1" />
                              {getEventTimeDisplay(event)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground ml-13">No events</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid grid-cols-7 divide-x">
              {days.map((day, i) => (
                <div key={i} className={cn(
                  "min-h-[500px] p-2",
                  isToday(day) && "bg-blue-50"
                )}>
                  <div className="text-center mb-2 font-medium">
                    <div>{format(day, 'EEE')}</div>
                    <div className={cn(
                      "text-lg inline-flex items-center justify-center h-8 w-8 rounded-full",
                      isToday(day) && "bg-blue-600 text-white"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {getEventsByDay(day).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-2 rounded text-white cursor-pointer",
                          event.color
                        )}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDialogOpen(true);
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {getEventTimeDisplay(event)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {view === 'day' && (
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-semibold">
                {format(currentDate, 'EEEE')}
              </div>
              <div className={cn(
                "text-lg inline-flex items-center justify-center h-10 w-10 rounded-full",
                isToday(currentDate) && "bg-blue-600 text-white"
              )}>
                {format(currentDate, 'd')}
              </div>
            </div>
            
            <div className="space-y-3">
              {getEventsByDay(currentDate).length > 0 ? (
                getEventsByDay(currentDate).map((event) => (
                  <Card key={event.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    setSelectedEvent(event);
                    setIsEventDialogOpen(true);
                  }}>
                    <div className={cn("h-2", event.color)} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant="outline">{getEventTimeDisplay(event)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {event.location && (
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.maxAttendees && (
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Max: {event.maxAttendees}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No events scheduled for today
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">{selectedEvent?.title}</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => setIsEventDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {selectedEvent && (
                <div className="flex items-center space-x-2">
                  <CalendarDateIcon className="h-4 w-4" />
                  <span>
                    {format(selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')}
                    {!isSameDay(
                      selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start),
                      selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end)
                    ) && (
                      <> - {format(selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end), 'EEEE, MMMM d, yyyy')}</>
                    )}
                  </span>
                  
                  {selectedEvent.isWeeklong && (
                    <Badge variant="outline" className="ml-2">
                      Week-long Event
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>{getEventTimeDisplay(selectedEvent)}</span>
                
                {selectedEvent.isWeeklong && (
                  <Badge variant="outline" className="ml-2">
                    {getEventDuration(selectedEvent)}
                  </Badge>
                )}
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-start text-sm">
                  <Users className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              
              <div className="text-sm space-y-2">
                <h4 className="font-medium">Program Details:</h4>
                <p className="text-gray-700">
                  {selectedEvent.description}
                </p>
              </div>
              
              {selectedEvent.maxAttendees && (
                <div className="text-sm">
                  <span className="font-medium">Maximum Attendees:</span> {selectedEvent.maxAttendees}
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-end pt-2">
                {isAdmin ? (
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDeleteEvent(selectedEvent.id);
                        setIsEventDialogOpen(false);
                      }}
                    >
                      Delete
                    </Button>
                    {showPdfDownload && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        size="sm"
                        onClick={() => downloadProgram(selectedEvent)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-x-2">
                    {selectedEvent.registrationUrl ? (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                      >
                        <Link to={selectedEvent.registrationUrl}>
                          Register Now
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                      >
                        <Link to="/programs">
                          View Programs
                        </Link>
                      </Button>
                    )}
                    {selectedEvent.programPdf && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        size="sm"
                        onClick={() => downloadProgram(selectedEvent)}
                      >
                        <FileText className="h-4 w-4" />
                        Download Brochure
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EventCalendar;
