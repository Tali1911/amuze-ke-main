
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: 'direct' | 'notification' | 'system' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  attachment_url?: string;
  related_task_id?: string;
  created_at: string;
  read_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'task';
  action_url?: string;
  read: boolean;
  created_at: string;
}

export class CommunicationService {
  private static instance: CommunicationService;

  static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  // STUB: Tables not created yet - returning mock data
  async getMessages(userId: string): Promise<Message[]> {
    console.warn('messages table not created yet');
    return [];
  }

  async sendMessage(message: Omit<Message, 'id' | 'created_at' | 'read_at'>): Promise<Message> {
    console.warn('messages table not created yet');
    return { ...message, id: 'mock-id', created_at: new Date().toISOString() } as Message;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    console.warn('messages table not created yet');
  }

  async getTasks(userId: string): Promise<Task[]> {
    console.warn('tasks table not created yet');
    return [];
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    console.warn('tasks table not created yet');
    return { 
      ...task, 
      id: 'mock-id', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as Task;
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    console.warn('tasks table not created yet');
    return { id: taskId, status, updated_at: new Date().toISOString() } as Task;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    console.warn('notifications table not created yet');
    return [];
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    console.warn('notifications table not created yet');
    return { ...notification, id: 'mock-id', created_at: new Date().toISOString() } as Notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    console.warn('notifications table not created yet');
  }

  async sendEmailNotification(to: string, template: string, data: any): Promise<void> {
    console.log(`Email notification stub: ${to} - ${template}`, data);
  }
}

export const communicationService = CommunicationService.getInstance();
