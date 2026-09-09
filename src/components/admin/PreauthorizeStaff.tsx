import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ROLES } from '@/services/roleService';
import { UserPlus, Trash2 } from 'lucide-react';

interface Row {
  email: string;
  role: string;
  full_name: string | null;
  department: string | null;
  created_at: string;
}

const PreauthorizeStaff: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from('preapproved_staff')
      .select('email, role, full_name, department, created_at')
      .order('created_at', { ascending: false });
    if (!error) setRows(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!email || !role) {
      toast({ title: 'Email and role required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from('preapproved_staff')
      .upsert({
        email: email.trim().toLowerCase(),
        role: role.toLowerCase(),
        full_name: fullName || null,
        department: department || null,
      }, { onConflict: 'email' });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to pre-authorize', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Pre-authorized',
      description: `${email} will be auto-approved with role ${role} on their next sign-in (Google or email).`,
    });
    setEmail(''); setRole(''); setFullName(''); setDepartment('');
    load();
  };

  const handleRemove = async (em: string) => {
    const { error } = await (supabase as any)
      .from('preapproved_staff')
      .delete()
      .eq('email', em);
    if (error) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
      return;
    }
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Pre-authorize Returning Staff
        </CardTitle>
        <CardDescription>
          Add a staff email here before they sign in (typically via Google). On their next sign-in
          their account is auto-approved with the role you choose and routed straight to their portal —
          no second approval step needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1 md:col-span-2">
            <Label>Email</Label>
            <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((r: any) => (
                  <SelectItem key={r} value={String(r).toLowerCase()}>{String(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Full name (optional)</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Department (optional)</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          <UserPlus className="h-4 w-4 mr-1" /> Pre-authorize
        </Button>

        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Full name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Added</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.email}>
                  <TableCell>{r.email}</TableCell>
                  <TableCell className="uppercase">{r.role}</TableCell>
                  <TableCell>{r.full_name || '-'}</TableCell>
                  <TableCell>{r.department || '-'}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleRemove(r.email)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PreauthorizeStaff;
