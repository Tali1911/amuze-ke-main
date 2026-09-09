
export interface AdminUser {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'CEO' | 'ADMIN' | 'HR' | 'MARKETING' | 'ACCOUNTS' | 'COACH' | 'GOVERNANCE';
  companyId: string;
  department: string;
  permissions: string[];
  reportingTo?: string; // ID of the supervisor
  isSuperAdmin?: boolean; // Keep for backward compatibility
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}
