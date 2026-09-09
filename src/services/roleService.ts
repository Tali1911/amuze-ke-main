import { AdminUser } from '@/types/admin';

export const ROLES = {
  CEO: 'CEO',
  ADMIN: 'ADMIN', 
  HR: 'HR',
  MARKETING: 'MARKETING',
  ACCOUNTS: 'ACCOUNTS',
  COACH: 'COACH',
  GOVERNANCE: 'GOVERNANCE'
} as const;

export const PERMISSIONS = {
  // General permissions
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_DATA: 'view_all_data',
  
  // HR permissions
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_HR_REPORTS: 'view_hr_reports',
  MANAGE_RECRUITMENT: 'manage_recruitment',
  
  // Marketing permissions
  MANAGE_CUSTOMERS: 'manage_customers',
  VIEW_CUSTOMER_DATA: 'view_customer_data',
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  
  // Accounts permissions
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  MANAGE_INVOICES: 'manage_invoices',
  APPROVE_EXPENSES: 'approve_expenses',
  
  // Coach permissions
  MANAGE_PROGRAMS: 'manage_programs',
  VIEW_STUDENT_DATA: 'view_student_data',
  MANAGE_SCHEDULES: 'manage_schedules',
  
  // Admin permissions
  SYSTEM_CONFIG: 'system_config',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Governance permissions
  MANAGE_POLICIES: 'manage_policies',
  MANAGE_COMPLIANCE: 'manage_compliance',
  MANAGE_RISK: 'manage_risk',
  VIEW_AUDIT_TRAILS: 'view_audit_trails',
  MANAGE_DATA_GOVERNANCE: 'manage_data_governance'
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.CEO]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.VIEW_HR_REPORTS,
    PERMISSIONS.APPROVE_EXPENSES,
    PERMISSIONS.VIEW_CUSTOMER_DATA,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_AUDIT_TRAILS
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_AUDIT_LOGS
  ],
  [ROLES.HR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_HR_REPORTS,
    PERMISSIONS.MANAGE_RECRUITMENT
  ],
  [ROLES.MARKETING]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMER_DATA,
    PERMISSIONS.MANAGE_CAMPAIGNS
  ],
  [ROLES.ACCOUNTS]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.MANAGE_INVOICES
  ],
  [ROLES.COACH]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_STUDENT_DATA,
    PERMISSIONS.MANAGE_SCHEDULES
  ],
  [ROLES.GOVERNANCE]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_POLICIES,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.MANAGE_RISK,
    PERMISSIONS.VIEW_AUDIT_TRAILS,
    PERMISSIONS.MANAGE_DATA_GOVERNANCE
  ]
};

export const hasPermission = (user: AdminUser, permission: string): boolean => {
  return user.permissions.includes(permission) || user.role === ROLES.CEO;
};

export const canViewData = (user: AdminUser, dataOwnerId: string): boolean => {
  // CEO can view all data
  if (user.role === ROLES.CEO) return true;
  
  // Users can view their own data
  if (user.id === dataOwnerId) return true;
  
  // Check if user is a supervisor of the data owner
  return isSubordinate(dataOwnerId, user.id);
};

export const isSubordinate = (userId: string, supervisorId: string): boolean => {
  // This would typically check the reporting structure
  // For demo purposes, simplified logic
  const users = getAdminUsers();
  const user = users.find(u => u.id === userId);
  return user?.reportingTo === supervisorId;
};

const getAdminUsers = (): AdminUser[] => {
  const adminUsersData = localStorage.getItem('adminUsersData');
  return adminUsersData ? JSON.parse(adminUsersData) : [];
};

export const getRoleDisplayName = (role: string): string => {
  const roleNames = {
    CEO: 'Chief Executive Officer',
    ADMIN: 'Administrator',
    HR: 'Human Resources',
    MARKETING: 'Marketing & CRM',
    ACCOUNTS: 'Accounts & Finance',
    COACH: 'Coach',
    GOVERNANCE: 'Governance & Compliance'
  };
  return roleNames[role as keyof typeof roleNames] || role;
};
