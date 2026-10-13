
import { AdminUser } from '@/types/admin';
import { getStoredAdminUsers } from './adminStorage';
import { getAdminByUsername } from './adminUserService';

export { initializeAdminUsers } from './adminStorage';
export { createAdminUser, getAdminByUsername } from './adminUserService';

export const authenticateAdmin = (username: string, password: string): boolean => {
  try {
    // Get admin users (will auto-initialize if needed)
    const adminUsers = getStoredAdminUsers();
    
    console.log('Authenticating user:', username);
    console.log('Available users:', adminUsers.map(u => ({ username: u.username, role: u.role })));
    
    // Find matching username and password (case sensitive)
    const admin = adminUsers.find((user: AdminUser) => 
      user.username === username && user.password === password
    );
    
    console.log('Authentication result:', !!admin, 'for username:', username);
    if (admin) {
      console.log('Found admin user:', { username: admin.username, role: admin.role, department: admin.department });
    }
    
    return !!admin;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};
