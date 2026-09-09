import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Calendar as CalendarIcon, Clock, User, X, History
} from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { campRegistrationService } from '@/services/campRegistrationService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  registration_id: string;
  child_name: string;
  check_in_time: string;
  check_out_time: string | null;
  attendance_date: string;
  notes: string | null;
  camp_registrations?: {
    registration_number: string;
    parent_name: string;
    payment_status: string;
    camp_type: string;
  };
}

export const AttendanceHistoryTab: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [childFilter, setChildFilter] = useState<string>('');

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      // Get date range - default to last 30 days if not specified
      const endDate = dateTo || new Date();
      const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Fetch attendance records with related registration data
      const allRecords: AttendanceRecord[] = [];
      
      // Get attendance for each day in the range
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        try {
          const dayRecords = await attendanceService.getAttendanceByDate(
            dateStr,
            campTypeFilter !== 'all' ? campTypeFilter : undefined
          );
          allRecords.push(...dayRecords);
        } catch (err) {
          // Continue if no records for a day
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Apply client-side filters
      let filtered = allRecords;
      
      if (childFilter) {
        filtered = filtered.filter(r => 
          r.child_name.toLowerCase().includes(childFilter.toLowerCase())
        );
      }
      
      if (searchTerm) {
        filtered = filtered.filter(r => 
          r.child_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.camp_registrations?.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.camp_registrations?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Sort by date descending
      filtered.sort((a, b) => 
        new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()
      );
      
      setRecords(filtered);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceHistory();
  }, [campTypeFilter, dateFrom, dateTo]);

  const handleSearch = () => {
    loadAttendanceHistory();
  };

  const clearFilters = () => {
    setCampTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setChildFilter('');
    setSearchTerm('');
  };

  const hasActiveFilters = campTypeFilter !== 'all' || dateFrom || dateTo || childFilter || searchTerm;

  // Group records by child for summary
  const childSummary = records.reduce((acc, record) => {
    const key = `${record.registration_id}-${record.child_name}`;
    if (!acc[key]) {
      acc[key] = {
        child_name: record.child_name,
        registration_number: record.camp_registrations?.registration_number || '',
        parent_name: record.camp_registrations?.parent_name || '',
        camp_type: record.camp_registrations?.camp_type || '',
        total_days: 0,
        records: [],
      };
    }
    acc[key].total_days++;
    acc[key].records.push(record);
    return acc;
  }, {} as Record<string, { child_name: string; registration_number: string; parent_name: string; camp_type: string; total_days: number; records: AttendanceRecord[] }>);

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return format(new Date(time), 'HH:mm');
  };

  const getDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'In progress';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{Object.keys(childSummary).length}</div>
            <p className="text-xs text-muted-foreground">Unique Children</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {records.filter(r => r.check_out_time).length}
            </div>
            <p className="text-xs text-muted-foreground">Completed Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(records.map(r => r.attendance_date)).size}
            </div>
            <p className="text-xs text-muted-foreground">Days with Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by child, parent, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={campTypeFilter} onValueChange={setCampTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Camp Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Camps</SelectItem>
                  <SelectItem value="easter">Easter</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="end-year">End Year</SelectItem>
                  <SelectItem value="mid-term-feb-march">Mid-Term Camp (Feb/March)</SelectItem>
                  <SelectItem value="mid-term-may-june">Mid-Term Camp (May/June)</SelectItem>
                  <SelectItem value="mid-term-october">Mid-Term Camp (October)</SelectItem>
                  <SelectItem value="day-camps">Day Camps</SelectItem>
                  <SelectItem value="little-forest">Little Forest</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Filter by child name..."
                value={childFilter}
                onChange={(e) => setChildFilter(e.target.value)}
                className="w-full sm:w-[180px]"
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-auto justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-auto justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Child Summary Section */}
          {Object.keys(childSummary).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Per-Child Summary
              </h3>
              <div className="grid gap-2">
                {Object.values(childSummary).map((child, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">{child.child_name}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({child.parent_name})
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {child.camp_type.replace('-', ' ')}
                      </Badge>
                      <span className="text-sm">
                        <strong>{child.total_days}</strong> days attended
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Records Table */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Detailed Records
            </h3>
            
            {loading ? (
              <div className="text-center py-8">Loading attendance history...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for the selected filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead className="hidden md:table-cell">Parent</TableHead>
                      <TableHead className="hidden sm:table-cell">Camp</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead className="hidden lg:table-cell">Duration</TableHead>
                      <TableHead className="hidden xl:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm">
                          {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{record.child_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {record.camp_registrations?.parent_name || '-'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="capitalize text-xs">
                            {record.camp_registrations?.camp_type?.replace('-', ' ') || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatTime(record.check_in_time)}</TableCell>
                        <TableCell className="text-sm">
                          {record.check_out_time ? (
                            formatTime(record.check_out_time)
                          ) : (
                            <Badge variant="secondary" className="text-xs">In Progress</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {getDuration(record.check_in_time, record.check_out_time)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                          {record.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
