
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  employment_status?: 'active' | 'on_leave' | 'terminated';
  salary: number;
  emergency_contact: any;
  documents?: any;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  reviewer_id: string;
  overall_rating: number;
  strengths: string;
  areas_for_improvement: string;
  goals: any;
  comments: string;
  status: 'draft' | 'submitted' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  notes?: string;
  created_at: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_name: string;
  training_type: string;
  start_date: string;
  end_date: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
  completion_certificate_url?: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  applicant_name: string;
  email: string;
  phone: string;
  position_applied: string;
  resume_url: string;
  cover_letter?: string;
  status: 'received' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  notes?: string;
  created_at: string;
}

export class EmployeeService {
  private static instance: EmployeeService;

  static getInstance(): EmployeeService {
    if (!EmployeeService.instance) {
      EmployeeService.instance = new EmployeeService();
    }
    return EmployeeService.instance;
  }

  // STUB: Tables not created yet - returning mock data
  async getEmployees(): Promise<Employee[]> {
    console.warn('employees table not created yet');
    return [];
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    console.warn('employees table not created yet');
    return { 
      ...employee, 
      id: 'mock-id', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as Employee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    console.warn('employees table not created yet');
    return { id, ...updates, updated_at: new Date().toISOString() } as Employee;
  }

  async getPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]> {
    console.warn('performance_reviews table not created yet');
    return [];
  }

  async createPerformanceReview(review: Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>): Promise<PerformanceReview> {
    console.warn('performance_reviews table not created yet');
    return { 
      ...review, 
      id: 'mock-id', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as PerformanceReview;
  }

  async getAttendanceRecords(employeeId?: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    console.warn('attendance_records table not created yet');
    return [];
  }

  async recordAttendance(attendance: Omit<AttendanceRecord, 'id' | 'created_at'>): Promise<AttendanceRecord> {
    console.warn('attendance_records table not created yet');
    return { ...attendance, id: 'mock-id', created_at: new Date().toISOString() } as AttendanceRecord;
  }

  async getTrainingRecords(employeeId?: string): Promise<TrainingRecord[]> {
    console.warn('training_records table not created yet');
    return [];
  }

  async enrollInTraining(training: Omit<TrainingRecord, 'id' | 'created_at'>): Promise<TrainingRecord> {
    console.warn('training_records table not created yet');
    return { ...training, id: 'mock-id', created_at: new Date().toISOString() } as TrainingRecord;
  }

  async getJobApplications(): Promise<JobApplication[]> {
    console.warn('job_applications table not created yet');
    return [];
  }

  async createJobApplication(application: Omit<JobApplication, 'id' | 'created_at'>): Promise<JobApplication> {
    console.warn('job_applications table not created yet');
    return { ...application, id: 'mock-id', created_at: new Date().toISOString() } as JobApplication;
  }

  async updateApplicationStatus(id: string, status: JobApplication['status'], notes?: string): Promise<JobApplication> {
    console.warn('job_applications table not created yet');
    return { id, status, notes, created_at: new Date().toISOString() } as JobApplication;
  }
}

export const employeeService = EmployeeService.getInstance();
