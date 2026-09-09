import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, CheckCircle, Eye, MousePointer, AlertTriangle, Ban } from "lucide-react";
import { emailManagementService, EmailDelivery } from '@/services/emailManagementService';

const EmailDeliveriesTab: React.FC = () => {
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, [statusFilter, typeFilter]);

  const loadDeliveries = async () => {
    setIsLoading(true);
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (typeFilter !== 'all') filters.email_type = typeFilter;
    
    const data = await emailManagementService.getEmailDeliveries(filters);
    setDeliveries(data);
    setIsLoading(false);
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: EmailDelivery['status']) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      sent: { variant: 'secondary', icon: Mail, color: 'text-gray-600' },
      delivered: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      opened: { variant: 'default', icon: Eye, color: 'text-blue-600' },
      clicked: { variant: 'default', icon: MousePointer, color: 'text-purple-600' },
      bounced: { variant: 'destructive', icon: AlertTriangle, color: 'text-red-600' },
      spam: { variant: 'destructive', icon: Ban, color: 'text-red-800' }
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: EmailDelivery['email_type']) => {
    const colors: Record<string, string> = {
      confirmation: 'bg-green-100 text-green-800',
      marketing: 'bg-blue-100 text-blue-800',
      transactional: 'bg-purple-100 text-purple-800',
      notification: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Deliveries</h2>
        <p className="text-muted-foreground">Track all email deliveries and their status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="confirmation">Confirmation</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries ({filteredDeliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading deliveries...</div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No deliveries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Delivered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{delivery.subject || 'N/A'}</TableCell>
                      <TableCell>{getTypeBadge(delivery.email_type)}</TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(delivery.sent_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : '-'}
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

export default EmailDeliveriesTab;
