import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX, Edit, Settings2, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ROLES } from '@/services/roleService';
import { auditLogService } from '@/services/auditLogService';
import { coachAccessService, CAMP_TABS, CampTabId, ALL_TAB_IDS } from '@/services/coachAccessService';
import PreauthorizeStaff from './PreauthorizeStaff';

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  approval_status: string;
  created_at: string;
}

interface ApprovedUser {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  role: string;
  approved_at: string;
}

const UserManagement: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [selectedApprovedUser, setSelectedApprovedUser] = useState<ApprovedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ApprovedUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [coachAccessMap, setCoachAccessMap] = useState<Record<string, { granted: boolean; visibleTabs: CampTabId[] }>>({});
  const [togglingAccess, setTogglingAccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use the RPC function to get all users with their details
      const { data: allUsers, error } = await (supabase as any)
        .rpc('get_all_users_for_admin');

      if (error) throw error;

      // Separate pending and approved users
      const pending = (allUsers || [])
        .filter((u: any) => u.approval_status === 'pending')
        .map((u: any) => ({
          id: u.user_id,
          email: u.email,
          full_name: u.full_name,
          department: u.department,
          approval_status: u.approval_status,
          created_at: u.created_at
        }));

      const approved = (allUsers || [])
        .filter((u: any) => u.approval_status === 'approved')
        .map((u: any) => ({
          id: u.user_id,
          email: u.email,
          full_name: u.full_name,
          department: u.department,
          role: u.role || 'none',
          approved_at: u.approved_at
        }));

      setPendingUsers(pending);
      setApprovedUsers(approved);

      // Fetch coach access map
      const accessMap = await coachAccessService.listCoachAccess();
      setCoachAccessMap(accessMap);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user);
    setShowApprovalDialog(true);
  };

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user);
    setShowRejectionDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('approve_user_with_role', {
        _user_id: selectedUser.id,
        _role: selectedRole.toLowerCase(),
        _approved_by: user.id
      });

      if (error) throw error;

      // Log audit event
      await auditLogService.logEvent({
        action: 'user_approved',
        entityType: 'user',
        entityId: selectedUser.id,
        details: `Approved user ${selectedUser.email} with role ${selectedRole}`,
        metadata: {
          user_email: selectedUser.email,
          assigned_role: selectedRole,
          full_name: selectedUser.full_name,
          department: selectedUser.department
        },
        severity: 'info'
      });

      toast({
        title: "User Approved",
        description: `${selectedUser.email} has been approved with ${selectedRole} role`
      });

      setShowApprovalDialog(false);
      setSelectedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive"
      });
    }
  };

  const confirmRejection = async () => {
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('reject_user', {
        _user_id: selectedUser.id,
        _rejection_reason: rejectionReason,
        _rejected_by: user.id
      });

      if (error) throw error;

      // Log audit event
      await auditLogService.logEvent({
        action: 'user_rejected',
        entityType: 'user',
        entityId: selectedUser.id,
        details: `Rejected user ${selectedUser.email}. Reason: ${rejectionReason}`,
        metadata: {
          user_email: selectedUser.email,
          rejection_reason: rejectionReason,
          full_name: selectedUser.full_name,
          department: selectedUser.department
        },
        severity: 'warning'
      });

      toast({
        title: "User Rejected",
        description: `${selectedUser.email} registration has been rejected`
      });

      setShowRejectionDialog(false);
      setSelectedUser(null);
      setRejectionReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive"
      });
    }
  };

  const handleToggleCoachAccess = async (user: ApprovedUser, granted: boolean) => {
    setTogglingAccess(user.id);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      let success: boolean;
      if (granted) {
        success = await coachAccessService.grantAccess(user.id, currentUser.id);
      } else {
        success = await coachAccessService.revokeAccess(user.id);
      }

      if (!success) throw new Error('Operation failed');

      setCoachAccessMap(prev => ({ ...prev, [user.id]: { granted, visibleTabs: prev[user.id]?.visibleTabs || ALL_TAB_IDS } }));

      await auditLogService.logEvent({
        action: granted ? 'coach_access_granted' : 'coach_access_revoked',
        entityType: 'user',
        entityId: user.id,
        details: `${granted ? 'Granted' : 'Revoked'} Record Portal access for ${user.email}`,
        metadata: { user_email: user.email, full_name: user.full_name },
        severity: 'info'
      });

      toast({
        title: granted ? "Access Granted" : "Access Revoked",
        description: `Record Portal access ${granted ? 'granted to' : 'revoked from'} ${user.email}`
      });
    } catch (error) {
      console.error('Error toggling coach access:', error);
      toast({ title: "Error", description: "Failed to update coach access", variant: "destructive" });
    } finally {
      setTogglingAccess(null);
    }
  };

  const handleDeleteUser = (user: ApprovedUser) => {
    setUserToDelete(user);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || deleteConfirmText !== 'DELETE') return;

    try {
      setDeleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('delete_user_completely', {
        _user_id: userToDelete.id,
        _deleted_by: user.id
      });

      if (error) throw error;

      await auditLogService.logEvent({
        action: 'user_deleted',
        entityType: 'user',
        entityId: userToDelete.id,
        details: `Permanently deleted user ${userToDelete.email}`,
        metadata: {
          user_email: userToDelete.email,
          full_name: userToDelete.full_name,
          role: userToDelete.role
        },
        severity: 'critical'
      });

      toast({
        title: "User Deleted",
        description: `${userToDelete.email} has been permanently deleted`
      });

      setShowDeleteDialog(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleChangeRole = (user: ApprovedUser) => {
    setSelectedApprovedUser(user);
    setSelectedRole(user.role);
    setShowChangeRoleDialog(true);
  };

  const confirmChangeRole = async () => {
    if (!selectedApprovedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).rpc('change_user_role', {
        _user_id: selectedApprovedUser.id,
        _new_role: selectedRole.toLowerCase(),
        _changed_by: user.id
      });

      if (error) throw error;

      // Log audit event
      await auditLogService.logEvent({
        action: 'role_changed',
        entityType: 'user',
        entityId: selectedApprovedUser.id,
        details: `Changed role for ${selectedApprovedUser.email} from ${selectedApprovedUser.role} to ${selectedRole}`,
        metadata: {
          user_email: selectedApprovedUser.email,
          old_role: selectedApprovedUser.role,
          new_role: selectedRole,
          full_name: selectedApprovedUser.full_name,
          department: selectedApprovedUser.department
        },
        severity: 'info'
      });

      toast({
        title: "Role Changed",
        description: `${selectedApprovedUser.email}'s role has been changed to ${selectedRole}`
      });

      setShowChangeRoleDialog(false);
      setSelectedApprovedUser(null);
      setSelectedRole('');
      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "Failed to change user role",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: pendingUsers.length + approvedUsers.length,
    pending: pendingUsers.length,
    approved: approvedUsers.length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage system users and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Administrator accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">New user requests</p>
          </CardContent>
        </Card>
      </div>

      <PreauthorizeStaff />



      {/* Pending Users Table */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Users waiting for admin approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(user)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(user)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Users</CardTitle>
          <CardDescription>Active system users with assigned roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Record Portal</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <Badge>{user.role.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === 'coach' ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!coachAccessMap[user.id]?.granted}
                          onCheckedChange={(checked) => handleToggleCoachAccess(user, checked)}
                          disabled={togglingAccess === user.id}
                        />
                        {coachAccessMap[user.id]?.granted && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56" align="start">
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Visible Tabs</p>
                                {CAMP_TABS.map(tab => {
                                  const currentTabs = coachAccessMap[user.id]?.visibleTabs || ALL_TAB_IDS;
                                  const isChecked = currentTabs.includes(tab.id);
                                  return (
                                    <label key={tab.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const newTabs = checked
                                            ? [...currentTabs, tab.id]
                                            : currentTabs.filter(t => t !== tab.id);
                                          if (newTabs.length === 0) return; // prevent empty
                                          setCoachAccessMap(prev => ({
                                            ...prev,
                                            [user.id]: { ...prev[user.id], visibleTabs: newTabs as CampTabId[] }
                                          }));
                                          coachAccessService.updateVisibleTabs(user.id, newTabs as CampTabId[]);
                                        }}
                                      />
                                      {tab.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleChangeRole(user)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Change Role
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.CEO}>CEO</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                  <SelectItem value={ROLES.HR}>HR</SelectItem>
                  <SelectItem value={ROLES.MARKETING}>Marketing</SelectItem>
                  <SelectItem value={ROLES.ACCOUNTS}>Accounts</SelectItem>
                  <SelectItem value={ROLES.COACH}>Coach</SelectItem>
                  <SelectItem value={ROLES.GOVERNANCE}>Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApproval} disabled={!selectedRole}>
              Approve & Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejection}>
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedApprovedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Role: <Badge>{selectedApprovedUser?.role.toUpperCase()}</Badge></label>
              <div className="mt-2">
                <label className="text-sm font-medium">New Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLES.CEO}>CEO</SelectItem>
                    <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                    <SelectItem value={ROLES.HR}>HR</SelectItem>
                    <SelectItem value={ROLES.MARKETING}>Marketing</SelectItem>
                    <SelectItem value={ROLES.ACCOUNTS}>Accounts</SelectItem>
                    <SelectItem value={ROLES.COACH}>Coach</SelectItem>
                    <SelectItem value={ROLES.GOVERNANCE}>Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmChangeRole} disabled={!selectedRole || selectedRole === selectedApprovedUser?.role}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user
              <strong> {userToDelete?.email}</strong> and all their associated data from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 border border-destructive/30 rounded-md bg-destructive/5">
              <p className="text-sm font-medium">User Details:</p>
              <p className="text-sm text-muted-foreground">Name: {userToDelete?.full_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Email: {userToDelete?.email}</p>
              <p className="text-sm text-muted-foreground">Role: {userToDelete?.role?.toUpperCase()}</p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Type <strong>DELETE</strong> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
            >
              {deleting ? 'Deleting...' : 'Permanently Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
