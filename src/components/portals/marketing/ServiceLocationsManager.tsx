import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceLocation {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { name: '', description: '', latitude: '', longitude: '', is_active: true };

const ServiceLocationsManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['service-locations-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('service_locations')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as ServiceLocation[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await (supabase as any).from('service_locations').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('service_locations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['service-locations-public'] });
      toast({ title: editingId ? 'Location updated' : 'Location added' });
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('service_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['service-locations-public'] });
      toast({ title: 'Location deleted' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from('service_locations').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['service-locations-public'] });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (loc: ServiceLocation) => {
    setForm({
      name: loc.name,
      description: loc.description || '',
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      is_active: loc.is_active,
    });
    setEditingId(loc.id);
    setDialogOpen(true);
  };

  const isValid = form.name && form.latitude && form.longitude && !isNaN(Number(form.latitude)) && !isNaN(Number(form.longitude));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Service Areas
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Location' : 'Add Location'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Karura Forest" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description of this location" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude *</Label>
                  <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-1.2345" />
                </div>
                <div>
                  <Label>Longitude *</Label>
                  <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="36.7890" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active (visible on map)</Label>
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Location' : 'Add Location'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No service areas added yet. Click "Add Location" to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{loc.name}</span>
                        {loc.description && <p className="text-xs text-muted-foreground">{loc.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={loc.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: loc.id, is_active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(loc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceLocationsManager;
