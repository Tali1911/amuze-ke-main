-- Add event_dates column to support non-consecutive date selection
ALTER TABLE calendar_events 
ADD COLUMN event_dates JSONB DEFAULT NULL;

COMMENT ON COLUMN calendar_events.event_dates IS 'Array of specific dates when start_date and end_date represent a range with gaps. Format: ["2025-11-13", "2025-11-14", "2025-11-20"]';
