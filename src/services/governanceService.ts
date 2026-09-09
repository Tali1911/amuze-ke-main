// Stub service - tables not created yet in fresh database

export interface Policy {
  id: string;
  title: string;
  content: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  category: string;
  effective_date: string;
  review_date: string;
  owner: string;
  approver?: string;
  created_at: string;
  updated_at: string;
}

export interface GovernanceDocument {
  id: string;
  title: string;
  description?: string;
  document_type: string;
  file_url: string;
  file_type?: string;
  version: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  category: string;
  owner: string;
  access_level?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Document = GovernanceDocument;

export class GovernanceService {
  private static instance: GovernanceService;

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async getPolicies(): Promise<Policy[]> {
    console.warn('governance tables not created yet');
    return [];
  }

  async createPolicy(policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>): Promise<Policy> {
    console.warn('governance tables not created yet');
    return { ...policy, id: 'mock-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Policy;
  }

  async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
    console.warn('governance tables not created yet');
    return { id, ...updates, updated_at: new Date().toISOString() } as Policy;
  }

  async getDocuments(): Promise<GovernanceDocument[]> {
    console.warn('governance tables not created yet');
    return [];
  }

  async createDocument(doc: Omit<GovernanceDocument, 'id' | 'created_at' | 'updated_at'>): Promise<GovernanceDocument> {
    console.warn('governance tables not created yet');
    return { ...doc, id: 'mock-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as GovernanceDocument;
  }
}

export const governanceService = GovernanceService.getInstance();
