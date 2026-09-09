import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowUpDown, MousePointerClick, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { emailManagementService, UserEngagementStats } from '@/services/emailManagementService';
import { format } from 'date-fns';

type SortKey = keyof UserEngagementStats;
type SortOrder = 'asc' | 'desc';

const UserEngagementTab: React.FC = () => {
  const [stats, setStats] = useState<UserEngagementStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('clickRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await emailManagementService.getUserEngagementStats();
    setStats(data);
    setLoading(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedStats = useMemo(() => {
    let result = stats.filter(s => 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return result;
  }, [stats, searchTerm, sortKey, sortOrder]);

  const getEngagementBadge = (clickRate: number) => {
    if (clickRate >= 10) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (clickRate >= 3) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-600">Low</Badge>;
  };

  const averageCTR = stats.length > 0 
    ? (stats.reduce((sum, s) => sum + s.clickRate, 0) / stats.length).toFixed(1)
    : '0';

  const highEngagers = stats.filter(s => s.clickRate >= 10).length;

  const SortableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 px-2 -ml-2 font-medium"
      onClick={() => handleSort(sortKeyName)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average CTR</p>
                <p className="text-2xl font-bold">{averageCTR}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Engagers</p>
                <p className="text-2xl font-bold">{highEngagers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" />
              User Click-Through Rates
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading engagement data...</div>
          ) : filteredAndSortedStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users match your search' : 'No email engagement data yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="Email" sortKeyName="email" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="Sent" sortKeyName="totalSent" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="Delivered" sortKeyName="totalDelivered" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="Opened" sortKeyName="totalOpened" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="Clicked" sortKeyName="totalClicked" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="Open Rate" sortKeyName="openRate" /></TableHead>
                    <TableHead className="text-center"><SortableHeader label="CTR" sortKeyName="clickRate" /></TableHead>
                    <TableHead className="text-center">Engagement</TableHead>
                    <TableHead><SortableHeader label="Last Activity" sortKeyName="lastActivity" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStats.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="text-center">{user.totalSent}</TableCell>
                      <TableCell className="text-center">{user.totalDelivered}</TableCell>
                      <TableCell className="text-center">{user.totalOpened}</TableCell>
                      <TableCell className="text-center">{user.totalClicked}</TableCell>
                      <TableCell className="text-center">{user.openRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-center font-semibold">{user.clickRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{getEngagementBadge(user.clickRate)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastActivity ? format(new Date(user.lastActivity), 'MMM d, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserEngagementTab;
