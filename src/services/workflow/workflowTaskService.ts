// Stub service - tables not created yet in fresh database

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  assignee_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export class WorkflowTaskService {
  private static instance: WorkflowTaskService;

  static getInstance(): WorkflowTaskService {
    if (!WorkflowTaskService.instance) {
      WorkflowTaskService.instance = new WorkflowTaskService();
    }
    return WorkflowTaskService.instance;
  }

  static async getWorkflowTasks(assigneeEmail?: string): Promise<WorkflowTask[]> {
    console.warn('workflow_tasks table not created yet');
    return [];
  }

  static async createWorkflowTask(task: Partial<WorkflowTask>): Promise<WorkflowTask> {
    console.warn('workflow_tasks table not created yet');
    return { 
      ...task, 
      id: 'mock-id', 
      due_date: task.due_date || new Date().toISOString(),
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    } as WorkflowTask;
  }

  static async updateWorkflowTask(id: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
    console.warn('workflow_tasks table not created yet');
    return { 
      id, 
      ...updates, 
      updated_at: new Date().toISOString() 
    } as WorkflowTask;
  }
}

export const workflowTaskService = WorkflowTaskService.getInstance();
