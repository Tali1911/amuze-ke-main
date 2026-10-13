
import { supabase, isSupabaseAvailable } from '../supabaseService';

export class TableCreator {
  private static checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  static async createAdminUsersTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating admin_users table...');
    
    const { error } = await supabase!.rpc('create_admin_users_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating admin_users table:', error);
      throw error;
    }
    
    console.log('admin_users table created successfully');
  }

  static async createCustomersTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating customers table...');
    
    const { error } = await supabase!.rpc('create_customers_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating customers table:', error);
      throw error;
    }
    
    console.log('customers table created successfully');
  }

  static async createProgramsTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating programs table...');
    
    const { error } = await supabase!.rpc('create_programs_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating programs table:', error);
      throw error;
    }
    
    console.log('programs table created successfully');
  }

  static async createAnnouncementsTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating announcements table...');
    
    const { error } = await supabase!.rpc('create_announcements_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating announcements table:', error);
      throw error;
    }
    
    console.log('announcements table created successfully');
  }

  static async createAuditLogsTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating audit_logs table...');
    
    const { error } = await supabase!.rpc('create_audit_logs_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating audit_logs table:', error);
      throw error;
    }
    
    console.log('audit_logs table created successfully');
  }

  static async createSystemSettingsTable(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating system_settings table...');
    
    const { error } = await supabase!.rpc('create_system_settings_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating system_settings table:', error);
      throw error;
    }
    
    console.log('system_settings table created successfully');
  }

  static async createGovernanceTables(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating governance tables...');
    
    const { error } = await supabase!.rpc('create_governance_tables');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating governance tables:', error);
      throw error;
    }
    
    console.log('governance tables created successfully');
  }

  static async createContentTables(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Creating content management tables...');
    
    const { error } = await supabase!.rpc('create_content_tables');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating content tables:', error);
      throw error;
    }
    
    console.log('content tables created successfully');
  }
}
