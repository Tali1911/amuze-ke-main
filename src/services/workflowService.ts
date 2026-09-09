
import { WorkflowTaskService, WorkflowTask } from './workflow/workflowTaskService';
import { ApprovalService, ApprovalRequest } from './workflow/approvalService';

class WorkflowService {
  private static instance: WorkflowService;

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  async getWorkflowTasks(assigneeEmail?: string): Promise<WorkflowTask[]> {
    return WorkflowTaskService.getWorkflowTasks(assigneeEmail);
  }

  async createWorkflowTask(task: Omit<WorkflowTask, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowTask> {
    return WorkflowTaskService.createWorkflowTask(task);
  }

  async updateWorkflowTask(id: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
    return WorkflowTaskService.updateWorkflowTask(id, updates);
  }

  async createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'created_at'>): Promise<ApprovalRequest> {
    return ApprovalService.createApprovalRequest(request);
  }

  async approveRequest(requestId: string, approverId: string, comments?: string): Promise<ApprovalRequest> {
    return ApprovalService.approveRequest(requestId, approverId, comments);
  }
}

export const workflowService = WorkflowService.getInstance();
export type { WorkflowTask, ApprovalRequest };
