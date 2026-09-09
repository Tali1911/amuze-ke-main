
import React, { useState, useEffect } from 'react';
import EventCalendar from './calendar/EventCalendar';
import { format } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from '@/components/ui/card';
import { Event, loadEvents } from '@/services/calendarService';

const currentYear = new Date().getFullYear();

const YearlyCalendar = () => {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Load events when component mounts and initialize with proper dates
      const loadedEvents = await loadEvents();
      console.log('YearlyCalendar loaded events:', loadedEvents.length);
      
      // Ensure all events have proper Date objects
      const formattedEvents = loadedEvents.map(event => ({
        ...event,
        start: event.start instanceof Date ? event.start : new Date(event.start),
        end: event.end instanceof Date ? event.end : new Date(event.end)
      }));
      
      setEvents(formattedEvents);
    };
    
    fetchEvents();
    
    const sectionTitle = document.querySelector('.fade-in-element');
    if (sectionTitle) {
      setTimeout(() => {
        sectionTitle.classList.add('opacity-100');
      }, 300);
    }
  }, []);

  return (
    <section 
      id="calendar" 
      className={`pt-24 pb-12 px-4 bg-gradient-to-b from-forest-50 to-white`}
    >
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12 fade-in-element opacity-0 transition-opacity duration-500">
          <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Plan Your Year
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {currentYear} Program Calendar
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Explore our year-round activities and mark your calendar for unforgettable experiences at Amuse.Ke.
            View our programs by month, week, or day to plan your visits.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg border-forest-100 overflow-hidden">
            <EventCalendar 
              events={events}
              showAgeGroups={true}
              showPdfDownload={true}
            />
          </Card>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Click on any event in the calendar to view details, optional activities, and download program information.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default YearlyCalendar;
