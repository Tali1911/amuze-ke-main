
import { supabase, isSupabaseAvailable } from '../supabaseService';

export class SchemaValidator {
  static async checkTableExists(tableName: string): Promise<boolean> {
    if (!isSupabaseAvailable() || !supabase) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  static async getSchemaStatus(): Promise<Record<string, boolean>> {
    if (!isSupabaseAvailable()) {
      return {
        system_settings: false,
        admin_users: false,
        customers: false,
        programs: false,
        announcements: false,
        audit_logs: false,
        policies: false,
        risk_assessments: false,
        compliance_records: false,
        governance_documents: false,
        workflow_tasks: false,
        content_items: false,
        section_config: false
      };
    }

    const tables = [
      'system_settings',
      'admin_users', 
      'customers',
      'programs',
      'announcements',
      'audit_logs',
      'policies',
      'risk_assessments',
      'compliance_records',
      'governance_documents',
      'workflow_tasks',
      'content_items',
      'section_config'
    ];
    
    const status: Record<string, boolean> = {};
    
    for (const table of tables) {
      status[table] = await this.checkTableExists(table);
    }
    
    return status;
  }
}
