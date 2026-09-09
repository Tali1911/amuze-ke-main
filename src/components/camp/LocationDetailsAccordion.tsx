import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

export interface LocationDetail {
  name: string;
  duration: string;
  ageGroup: string;
  time: string;
  highlights: string[];
}

interface LocationDetailsAccordionProps {
  locations: LocationDetail[];
}

const LocationDetailsAccordion: React.FC<LocationDetailsAccordionProps> = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-primary">Camp Details by Location</h3>
      <Accordion type="single" collapsible defaultValue={locations[0]?.name} className="space-y-2">
        {locations.map((loc, idx) => (
          <AccordionItem key={idx} value={loc.name} className="border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {loc.name}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-sm">Duration</h4>
                      <p className="text-muted-foreground text-sm">{loc.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-sm">Age Group</h4>
                      <p className="text-muted-foreground text-sm">{loc.ageGroup}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-sm">Time</h4>
                      <p className="text-muted-foreground text-sm">{loc.time}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary text-sm mb-2">Camp Highlights</h4>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    {loc.highlights.map((highlight, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default LocationDetailsAccordion;
