
import { v4 as uuidv4 } from 'uuid';
import { AdminUser } from '@/types/admin';
import { getDepartmentByRole, getPermissionsByRole, isSuperAdminRole } from './roleHelpers';
import { getStoredAdminUsers, saveAdminUsers } from './adminStorage';

export const createAdminUser = (
  username: string, 
  password: string, 
  email?: string, 
  role: string = 'ADMIN'
): AdminUser => {
  return {
    id: uuidv4(),
    username,
    password, // TODO: In production, always hash passwords
    email,
    role: role as AdminUser['role'],
    companyId: 'company-1', // Default company for demo
    department: getDepartmentByRole(role),
    permissions: getPermissionsByRole(role),
    isSuperAdmin: isSuperAdminRole(role),
    createdAt: new Date().toISOString()
  };
};

export const getAdminByUsername = (username: string): AdminUser | null => {
  try {
    const adminUsers = getStoredAdminUsers();
    const user = adminUsers.find((user: AdminUser) => user.username === username) || null;
    console.log('Getting admin by username:', username, 'Found:', !!user);
    return user;
  } catch (error) {
    console.error('Error getting admin by username:', error);
    return null;
  }
};

export const addAdminUser = (newUser: AdminUser): boolean => {
  try {
    const adminUsers = getStoredAdminUsers();
    
    // Check if username already exists
    const existingUser = adminUsers.find(user => user.username === newUser.username);
    if (existingUser) {
      console.error('Username already exists:', newUser.username);
      return false;
    }
    
    adminUsers.push(newUser);
    saveAdminUsers(adminUsers);
    console.log('Added new admin user:', newUser.username);
    return true;
  } catch (error) {
    console.error('Error adding admin user:', error);
    return false;
  }
};

export const updateAdminUser = (updatedUser: AdminUser): boolean => {
  try {
    const adminUsers = getStoredAdminUsers();
    const userIndex = adminUsers.findIndex(user => user.id === updatedUser.id);
    
    if (userIndex === -1) {
      console.error('User not found for update:', updatedUser.id);
      return false;
    }
    
    adminUsers[userIndex] = updatedUser;
    saveAdminUsers(adminUsers);
    console.log('Updated admin user:', updatedUser.username);
    return true;
  } catch (error) {
    console.error('Error updating admin user:', error);
    return false;
  }
};

export const deleteAdminUser = (userId: string): boolean => {
  try {
    const adminUsers = getStoredAdminUsers();
    const filteredUsers = adminUsers.filter(user => user.id !== userId);
    
    if (filteredUsers.length === adminUsers.length) {
      console.error('User not found for deletion:', userId);
      return false;
    }
    
    saveAdminUsers(filteredUsers);
    console.log('Deleted admin user:', userId);
    return true;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }
};
