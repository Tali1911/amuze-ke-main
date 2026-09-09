import React from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { parseLocalDate } from '@/utils/dateUtils';

interface DateOption {
  date: string; // YYYY-MM-DD
  displayLabel: string; // e.g., "Mon, Nov 13"
  weekLabel?: string; // e.g., "Week 1"
}

interface DateSelectorProps {
  availableDates: string[]; // Array of YYYY-MM-DD strings
  selectedDates: string[];
  sessionTypes: Record<string, 'half' | 'full'>; // { '2025-11-13': 'full' }
  onDatesChange: (dates: string[]) => void;
  onSessionTypeChange: (date: string, type: 'half' | 'full') => void;
  halfDayRate: number;
  fullDayRate: number;
  currency: string;
  disabled?: boolean;
  flatRate?: number; // When set, hides half/full day toggle and uses this flat rate per day
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  availableDates,
  selectedDates,
  sessionTypes,
  onDatesChange,
  onSessionTypeChange,
  halfDayRate,
  fullDayRate,
  currency,
  disabled = false,
  flatRate
}) => {
  // Group dates by week for better UX
  const groupDatesByWeek = (dates: string[]): Map<number, DateOption[]> => {
    const weeks = new Map<number, DateOption[]>();
    
    dates.forEach(dateStr => {
      try {
        // Parse as local date to avoid timezone shifts
        const date = parseLocalDate(dateStr);
        const firstDate = parseLocalDate(dates[0]);
        const weekNumber = Math.floor((date.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        
        const option: DateOption = {
          date: dateStr,
          displayLabel: format(date, 'EEE, MMM d'),
          weekLabel: `Week ${weekNumber}`
        };
        
        if (!weeks.has(weekNumber)) {
          weeks.set(weekNumber, []);
        }
        weeks.get(weekNumber)!.push(option);
      } catch (error) {
        console.error('Error parsing date:', dateStr, error);
      }
    });
    
    return weeks;
  };

  const weekGroups = groupDatesByWeek(availableDates);

  const handleDateToggle = (date: string) => {
    if (disabled) return;
    
    const newSelectedDates = selectedDates.includes(date)
      ? selectedDates.filter(d => d !== date)
      : [...selectedDates, date].sort();
    
    onDatesChange(newSelectedDates);
  };

  const handleSelectAllWeek = (weekDates: DateOption[]) => {
    if (disabled) return;
    
    const weekDateStrings = weekDates.map(d => d.date);
    const allSelected = weekDateStrings.every(d => selectedDates.includes(d));
    
    if (allSelected) {
      // Deselect all from this week
      onDatesChange(selectedDates.filter(d => !weekDateStrings.includes(d)));
    } else {
      // Select all from this week
      const newSelectedDates = [...new Set([...selectedDates, ...weekDateStrings])].sort();
      onDatesChange(newSelectedDates);
    }
  };

  const calculateTotalPrice = () => {
    if (flatRate) {
      return selectedDates.length * flatRate;
    }
    return selectedDates.reduce((sum, date) => {
      const sessionType = sessionTypes[date] || 'full';
      return sum + (sessionType === 'half' ? halfDayRate : fullDayRate);
    }, 0);
  };

  if (!availableDates || availableDates.length === 0) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <p className="text-sm">No upcoming dates available for this camp. Please check back later or contact support.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Camp Dates</Label>
        <Badge variant="secondary" className="text-xs">
          {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} selected
        </Badge>
      </div>

      <div className="space-y-4">
        {Array.from(weekGroups.entries()).map(([weekNum, dates]) => {
          const allWeekSelected = dates.every(d => selectedDates.includes(d.date));
          
          return (
            <Card key={weekNum} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-primary">{dates[0].weekLabel}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllWeek(dates)}
                  disabled={disabled}
                >
                  {allWeekSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {dates.map(dateOption => {
                  const isSelected = selectedDates.includes(dateOption.date);
                  const sessionType = sessionTypes[dateOption.date] || 'full';
                  
                  return (
                    <div key={dateOption.date} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`date-${dateOption.date}`}
                          checked={isSelected}
                          onCheckedChange={() => handleDateToggle(dateOption.date)}
                          disabled={disabled}
                        />
                        <Label
                          htmlFor={`date-${dateOption.date}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {dateOption.displayLabel}
                        </Label>
                        {isSelected && !flatRate && (
                          <Badge variant="outline" className="text-xs">
                            {sessionType === 'half' ? 'Half Day' : 'Full Day'}
                          </Badge>
                        )}
                        {isSelected && flatRate && (
                          <Badge variant="outline" className="text-xs">
                            {flatRate.toLocaleString()} {currency}/day
                          </Badge>
                        )}
                      </div>
                      
                      {isSelected && !flatRate && (
                        <div className="ml-8 flex gap-2">
                          <Button
                            type="button"
                            variant={sessionType === 'half' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => onSessionTypeChange(dateOption.date, 'half')}
                            disabled={disabled}
                          >
                            Half Day ({halfDayRate.toLocaleString()} {currency})
                          </Button>
                          <Button
                            type="button"
                            variant={sessionType === 'full' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => onSessionTypeChange(dateOption.date, 'full')}
                            disabled={disabled}
                          >
                            Full Day ({fullDayRate.toLocaleString()} {currency})
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total for this child:</span>
            <span className="text-lg font-bold text-primary">
              {calculateTotalPrice().toLocaleString()} {currency}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};
