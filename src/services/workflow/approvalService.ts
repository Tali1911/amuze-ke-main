
import { WorkflowTaskService } from './workflowTaskService';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requestor: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  entity_type: string;
  entity_id: string;
  comments?: string;
  created_at: string;
  approved_at?: string;
}

export class ApprovalService {
  static async createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'created_at'>): Promise<ApprovalRequest> {
    const newRequest: ApprovalRequest = {
      ...request,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    // Create corresponding workflow task
    await WorkflowTaskService.createWorkflowTask({
      title: `Approval Required: ${request.title}`,
      description: request.description,
      entity_type: request.entity_type,
      entity_id: request.entity_id,
      assignee_email: request.approver,
      status: 'pending',
      priority: 'medium'
    });

    return newRequest;
  }

  static async approveRequest(requestId: string, approverId: string, comments?: string): Promise<ApprovalRequest> {
    // This would update the approval status and complete related workflow tasks
    console.log(`Approving request ${requestId} by ${approverId}`, comments);
    
    // Update related workflow tasks
    const tasks = await WorkflowTaskService.getWorkflowTasks();
    const relatedTasks = tasks.filter(task => 
      task.entity_type === 'approval' && task.entity_id === requestId
    );
    
    for (const task of relatedTasks) {
      await WorkflowTaskService.updateWorkflowTask(task.id, { 
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    return {
      id: requestId,
      title: 'Mock Approval',
      description: 'Mock approval for demonstration',
      requestor: 'user@example.com',
      approver: approverId,
      status: 'approved',
      entity_type: 'policy',
      entity_id: 'policy-123',
      comments,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }
}
