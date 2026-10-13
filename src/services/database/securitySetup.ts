
import { supabase, isSupabaseAvailable } from '../supabaseService';

export class SecuritySetup {
  private static checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  static async setupRowLevelSecurity(): Promise<void> {
    this.checkSupabaseAvailable();
    console.log('Setting up Row Level Security policies...');
    
    const { error } = await supabase!.rpc('setup_rls_policies');
    if (error) {
      console.error('Error setting up RLS policies:', error);
      throw error;
    }
    
    console.log('RLS policies set up successfully');
  }
}
