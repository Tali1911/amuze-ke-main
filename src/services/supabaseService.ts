// Legacy service - use src/integrations/supabase/client.ts instead
import { supabase } from '@/integrations/supabase/client';
import * as customerServiceExports from './customerService';

export { supabase };

export const isSupabaseAvailable = (): boolean => {
  return !!supabase;
};

export const initializeDatabase = async (): Promise<void> => {
  // Database initialization handled via Supabase migrations
  console.log('Database initialized via Supabase migrations');
};

// Re-export customer service for backward compatibility
export const customerService = {
  getAll: customerServiceExports.getCustomers,
  getFrequentCustomers: customerServiceExports.getFrequentCustomers,
  addVisit: customerServiceExports.addCustomerVisit,
  sendEmail: customerServiceExports.sendEmailToCustomer
};

// Stub programs service (table doesn't exist yet)
export const programsService = {
  getAll: async () => {
    console.warn('Programs table not created yet - returning empty array');
    return [];
  }
};
