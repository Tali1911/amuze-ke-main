
import { AdminUser } from '@/types/admin';

export const getDepartmentByRole = (role: string): string => {
  const departmentMap: Record<string, string> = {
    CEO: 'Executive',
    ADMIN: 'Administration',
    HR: 'Human Resources',
    MARKETING: 'Marketing',
    ACCOUNTS: 'Finance',
    COACH: 'Programs',
    GOVERNANCE: 'Risk & Compliance'
  };
  return departmentMap[role] || 'General';
};

export const getPermissionsByRole = (role: string): string[] => {
  const permissionMap: Record<string, string[]> = {
    CEO: ['view_all_data', 'approve_expenses', 'view_financial_data'],
    ADMIN: ['manage_users', 'system_config', 'manage_roles'],
    HR: ['manage_employees', 'view_hr_reports', 'manage_recruitment'],
    MARKETING: ['manage_customers', 'view_customer_data', 'manage_campaigns'],
    ACCOUNTS: ['view_financial_data', 'manage_invoices'],
    COACH: ['manage_programs', 'view_student_data', 'manage_schedules'],
    GOVERNANCE: ['manage_policies', 'manage_compliance', 'manage_risk', 'view_audit_trails', 'manage_data_governance']
  };
  return permissionMap[role] || [];
};

export const isSuperAdminRole = (role: string): boolean => {
  return role === 'CEO' || role === 'ADMIN';
};
