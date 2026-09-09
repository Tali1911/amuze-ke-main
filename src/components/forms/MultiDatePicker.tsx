import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import { parseLocalDate, formatLocalDate } from '@/utils/dateUtils';

interface MultiDatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  className?: string;
}

export const MultiDatePicker: React.FC<MultiDatePickerProps> = ({
  selectedDates,
  onChange,
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const selectedDateObjects = selectedDates.map(d => parseLocalDate(d));
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.includes(dateString);
    
    if (isSelected) {
      onChange(selectedDates.filter(d => d !== dateString));
    } else {
      onChange([...selectedDates, dateString].sort());
    }
  };

  const handleAddWeekdays = () => {
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekdays = allDays.filter(day => !isWeekend(day));
    const weekdayStrings = weekdays.map(d => format(d, 'yyyy-MM-dd'));
    
    const newDates = [...new Set([...selectedDates, ...weekdayStrings])].sort();
    onChange(newDates);
  };

  const handleAddNextWeek = () => {
    const weekStart = startOfWeek(addDays(currentMonth, 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(addDays(currentMonth, 7), { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekStrings = allDays.map(d => format(d, 'yyyy-MM-dd'));
    
    const newDates = [...new Set([...selectedDates, ...weekStrings])].sort();
    onChange(newDates);
  };

  const handleAddDateRange = () => {
    if (selectedDates.length === 0) return;
    
    const lastDate = parseLocalDate(selectedDates[selectedDates.length - 1]);
    const nextDays = eachDayOfInterval({ 
      start: addDays(lastDate, 1), 
      end: addDays(lastDate, 7) 
    });
    const dateStrings = nextDays.map(d => format(d, 'yyyy-MM-dd'));
    
    const newDates = [...new Set([...selectedDates, ...dateStrings])].sort();
    onChange(newDates);
  };

  const handleRemoveDate = (dateString: string) => {
    onChange(selectedDates.filter(d => d !== dateString));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const groupDatesByWeek = () => {
    if (selectedDates.length === 0) return [];
    
    const groups: { weekLabel: string; dates: string[] }[] = [];
    let currentWeekStart: Date | null = null;
    let currentGroup: string[] = [];
    
    selectedDates.forEach(dateString => {
      const date = parseLocalDate(dateString);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      
      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentGroup.length > 0) {
          groups.push({
            weekLabel: format(currentWeekStart!, 'MMM dd') + ' - ' + format(endOfWeek(currentWeekStart!, { weekStartsOn: 1 }), 'MMM dd, yyyy'),
            dates: currentGroup
          });
        }
        currentWeekStart = weekStart;
        currentGroup = [dateString];
      } else {
        currentGroup.push(dateString);
      }
    });
    
    if (currentGroup.length > 0 && currentWeekStart) {
      groups.push({
        weekLabel: format(currentWeekStart, 'MMM dd') + ' - ' + format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM dd, yyyy'),
        dates: currentGroup
      });
    }
    
    return groups;
  };

  const weekGroups = groupDatesByWeek();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calendar Section */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Dates
              </h4>
              <Badge variant="secondary">
                {selectedDates.length} {selectedDates.length === 1 ? 'date' : 'dates'}
              </Badge>
            </div>
            
            <Calendar
              mode="multiple"
              selected={selectedDateObjects}
              onSelect={(dates) => {
                if (!dates) return;
                const dateStrings = (Array.isArray(dates) ? dates : [dates])
                  .map(d => format(d, 'yyyy-MM-dd'))
                  .sort();
                onChange(dateStrings);
              }}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border pointer-events-auto"
            />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWeekdays}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Weekdays
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNextWeek}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Next Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDateRange}
                  disabled={selectedDates.length === 0}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add 7 Days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedDates.length === 0}
                  className="text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Dates Section */}
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">Selected Dates</h4>
            
            {selectedDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No dates selected</p>
                <p className="text-xs">Click dates on the calendar to add them</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {weekGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {group.weekLabel}
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {group.dates.map(dateString => (
                        <div
                          key={dateString}
                          className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-sm">
                            {formatLocalDate(dateString, 'EEE, MMM dd, yyyy')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDate(dateString)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      {selectedDates.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview: How users will see dates</p>
            <div className="space-y-1">
              {selectedDates.slice(0, 5).map((dateString, idx) => (
                <p key={dateString} className="text-sm text-muted-foreground">
                  Day {idx + 1} ({formatLocalDate(dateString, 'MMM dd, yyyy')})
                </p>
              ))}
              {selectedDates.length > 5 && (
                <p className="text-xs text-muted-foreground italic">
                  ... and {selectedDates.length - 5} more dates
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
