
import { AdminUser } from '@/types/admin';
import { INITIAL_ADMIN_USERS } from '@/constants/adminConstants';

const ADMIN_USERS_KEY = 'adminUsersData';

export const initializeAdminUsers = (): AdminUser[] => {
  const adminUsers: AdminUser[] = INITIAL_ADMIN_USERS.map((user, index) => ({
    ...user,
    id: (index + 1).toString()
  }));

  // Force clear any existing data and set new data
  localStorage.removeItem(ADMIN_USERS_KEY);
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(adminUsers));
  console.log('Initialized admin users with governance account:', adminUsers);
  return adminUsers;
};

export const getStoredAdminUsers = (): AdminUser[] => {
  try {
    const adminUsersData = localStorage.getItem(ADMIN_USERS_KEY);
    if (!adminUsersData) {
      return initializeAdminUsers();
    }
    
    const adminUsers = JSON.parse(adminUsersData);
    
    // Validate data structure
    if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
      return initializeAdminUsers();
    }
    
    const firstUser = adminUsers[0];
    if (!firstUser.role || !firstUser.permissions) {
      return initializeAdminUsers();
    }
    
    return adminUsers;
  } catch (error) {
    console.error('Error parsing admin users data:', error);
    return initializeAdminUsers();
  }
};

export const saveAdminUsers = (adminUsers: AdminUser[]): void => {
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(adminUsers));
};
