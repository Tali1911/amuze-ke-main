import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlusCircle, 
  Trash2, 
  ShieldAlert, 
  Edit, 
  Lock, 
  UserCog
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  getAdminUsers, 
  addAdminUser, 
  deleteAdminUser,
  updateAdminUser,
  saveToLocalStorage 
} from "@/services/dataService";

interface AdminUser {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  isSuperAdmin?: boolean;
}

interface AdminUsersProps {
  currentAdminUsername: string;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ currentAdminUsername }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(getAdminUsers() || []);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const handleNewAdmin = () => {
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSuperAdmin(false);
    setError('');
    setIsEditing(false);
    setCurrentAdminId(null);
    setAdminDialogOpen(true);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setNewUsername(admin.username);
    setNewPassword(''); // Don't populate password for security
    setConfirmPassword('');
    setIsSuperAdmin(!!admin.isSuperAdmin);
    setError('');
    setIsEditing(true);
    setCurrentAdminId(admin.id);
    setAdminDialogOpen(true);
  };

  const handleSaveAdmin = () => {
    if (!newUsername) {
      setError('Username is required');
      return;
    }

    // If not editing, require password
    if (!isEditing && (!newPassword || !confirmPassword)) {
      setError('Password and confirmation are required');
      return;
    }

    // When adding new admin or changing password, check if passwords match
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    // Check if username already exists (only for new admins)
    if (!isEditing && adminUsers.some(user => user.username === newUsername)) {
      setError('Username already exists');
      return;
    }

    try {
      if (isEditing && currentAdminId) {
        // Update existing admin
        const adminToUpdate = adminUsers.find(admin => admin.id === currentAdminId);
        if (adminToUpdate) {
          const updatedAdmin = updateAdminUser(
            currentAdminId, 
            {
              username: newUsername,
              password: newPassword || undefined, // Only update password if provided
              isSuperAdmin: isSuperAdmin
            }, 
            currentAdminUsername
          );
          
          setAdminUsers(getAdminUsers());
          saveToLocalStorage();
          
          toast({
            title: "Success",
            description: `Admin user ${newUsername} updated successfully.`,
            duration: 3000,
          });
        }
      } else {
        // Add new admin
        const newAdmin = addAdminUser(
          newUsername, 
          newPassword, 
          isSuperAdmin, 
          currentAdminUsername
        );
        
        setAdminUsers(getAdminUsers());
        saveToLocalStorage();
        
        toast({
          title: "Success",
          description: `Admin user ${newUsername} created successfully.`,
          duration: 3000,
        });
      }

      setAdminDialogOpen(false);
    } catch (error) {
      console.error('Error saving admin user:', error);
      setError('Failed to save admin user');
    }
  };

  const handleDeleteAdmin = (id: string, username: string) => {
    // Prevent deleting the current admin user
    if (username === currentAdminUsername) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is the last super admin
    const currentUser = adminUsers.find(user => user.username === currentAdminUsername);
    const userToDelete = adminUsers.find(user => user.id === id);
    
    if (userToDelete?.isSuperAdmin && currentUser?.isSuperAdmin) {
      const superAdminCount = adminUsers.filter(user => user.isSuperAdmin).length;
      if (superAdminCount <= 1) {
        toast({
          title: "Cannot Delete",
          description: "Cannot delete the last super admin account.",
          variant: "destructive",
        });
        return;
      }
    }

    if (window.confirm(`Are you sure you want to delete admin user: ${username}?`)) {
      try {
        const success = deleteAdminUser(id, currentAdminUsername);
        
        if (success) {
          setAdminUsers(getAdminUsers() || []);
          saveToLocalStorage();
          
          toast({
            title: "Success",
            description: `Admin user ${username} deleted successfully.`,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error deleting admin user:', error);
        toast({
          title: "Error",
          description: "Failed to delete admin user.",
          variant: "destructive",
        });
      }
    }
  };

  const isSuperAdminUser = adminUsers.length > 0 ? 
    adminUsers.find(user => user.username === currentAdminUsername)?.isSuperAdmin : 
    false;

  return (
    <div className="p-4 border rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Admin User Management</h3>
        {isSuperAdminUser && (
          <Button onClick={handleNewAdmin} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-4">
          {adminUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No admin users found</p>
          ) : (
            adminUsers.map((admin) => (
              <div key={admin.id} className="p-4 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{admin.username}</h4>
                      {admin.isSuperAdmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Super Admin
                        </span>
                      )}
                      {admin.username === currentAdminUsername && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isSuperAdminUser && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      
                      {admin.username !== currentAdminUsername && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Admin User' : 'Add New Admin User'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update credentials for this admin user' 
                : 'Create credentials for a new admin user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {error && (
              <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep current password" : ""}
                />
                {isEditing && (
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPassword" className="text-right">
                Confirm Password
              </Label>
              <div className="col-span-3">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep current password" : ""}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="superAdmin">Super Admin</Label>
              </div>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="superAdmin" 
                  checked={isSuperAdmin}
                  onCheckedChange={(checked) => setIsSuperAdmin(checked as boolean)}
                />
                <label
                  htmlFor="superAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Grant super admin privileges
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdmin}>
              {isEditing ? 'Update Admin' : 'Save Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
