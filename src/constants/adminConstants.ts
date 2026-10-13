
import { AdminUser } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/services/roleService';

export const INITIAL_ADMIN_USERS: Omit<AdminUser, 'id'>[] = [
  {
    username: 'admin',
    password: 'password', 
    email: 'admin@example.com',
    role: 'ADMIN',
    companyId: 'company-1',
    department: 'Administration',
    permissions: ROLE_PERMISSIONS.ADMIN,
    isSuperAdmin: true,
    createdAt: new Date().toISOString()
  },
  {
    username: 'user',
    password: 'password', 
    email: 'user@example.com',
    role: 'COACH',
    companyId: 'company-1',
    department: 'Programs',
    permissions: ROLE_PERMISSIONS.COACH,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'ceo',
    password: 'password', 
    email: 'ceo@example.com',
    role: 'CEO',
    companyId: 'company-1',
    department: 'Executive',
    permissions: ROLE_PERMISSIONS.CEO,
    isSuperAdmin: true,
    createdAt: new Date().toISOString()
  },
  {
    username: 'marketing',
    password: 'password', 
    email: 'marketing@example.com',
    role: 'MARKETING',
    companyId: 'company-1',
    department: 'Marketing',
    permissions: ROLE_PERMISSIONS.MARKETING,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'hr',
    password: 'password', 
    email: 'hr@example.com',
    role: 'HR',
    companyId: 'company-1',
    department: 'Human Resources',
    permissions: ROLE_PERMISSIONS.HR,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'accounts',
    password: 'password', 
    email: 'accounts@example.com',
    role: 'ACCOUNTS',
    companyId: 'company-1',
    department: 'Finance',
    permissions: ROLE_PERMISSIONS.ACCOUNTS,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    username: 'governance',
    password: 'password', 
    email: 'governance@example.com',
    role: 'GOVERNANCE',
    companyId: 'company-1',
    department: 'Risk & Compliance',
    permissions: ROLE_PERMISSIONS.GOVERNANCE,
    isSuperAdmin: false,
    createdAt: new Date().toISOString()
  }
];
