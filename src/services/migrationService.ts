
import { supabase, adminUsersService, customerService, programsService, announcementsService } from './supabaseService';
import { getAdminUsers, getPrograms, getAnnouncements, getRegistrations } from './dataService';

export class MigrationService {
  private static instance: MigrationService;

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  async checkMigrationStatus(): Promise<boolean> {
    try {
      // Check if data has already been migrated by looking for a migration flag
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'migration_completed')
        .single();
      
      return data?.value === 'true';
    } catch (error) {
      console.log('Migration status check failed, assuming not migrated yet');
      return false;
    }
  }

  async migrateAdminUsers(): Promise<void> {
    console.log('Migrating admin users...');
    const localAdminUsers = getAdminUsers();
    
    if (!localAdminUsers || localAdminUsers.length === 0) {
      console.log('No admin users to migrate');
      return;
    }

    for (const adminUser of localAdminUsers) {
      try {
        const migratedUser = {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email || `${adminUser.username}@example.com`,
          role: adminUser.role || 'ADMIN',
          department: adminUser.department || 'Administration',
          permissions: adminUser.permissions || [],
          is_super_admin: adminUser.isSuperAdmin || false,
          company_id: adminUser.companyId || 'company-1',
          created_at: adminUser.createdAt || new Date().toISOString()
        };

        await adminUsersService.create(migratedUser);
        console.log(`Migrated admin user: ${adminUser.username}`);
      } catch (error) {
        console.error(`Failed to migrate admin user ${adminUser.username}:`, error);
      }
    }
  }

  async migratePrograms(): Promise<void> {
    console.log('Migrating programs...');
    const localPrograms = getPrograms();
    
    if (!localPrograms || localPrograms.length === 0) {
      console.log('No programs to migrate');
      return;
    }

    for (const program of localPrograms) {
      try {
        const migratedProgram = {
          id: program.id,
          title: program.title,
          description: program.description,
          price: program.price,
          duration: program.duration,
          age_range: program.ageRange,
          max_participants: program.maxParticipants,
          is_active: program.isActive !== false,
          created_at: program.createdAt || new Date().toISOString(),
          created_by: program.createdBy || 'system'
        };

        await programsService.create(migratedProgram);
        console.log(`Migrated program: ${program.title}`);
      } catch (error) {
        console.error(`Failed to migrate program ${program.title}:`, error);
      }
    }
  }

  async migrateAnnouncements(): Promise<void> {
    console.log('Migrating announcements...');
    const localAnnouncements = getAnnouncements();
    
    if (!localAnnouncements || localAnnouncements.length === 0) {
      console.log('No announcements to migrate');
      return;
    }

    for (const announcement of localAnnouncements) {
      try {
        const migratedAnnouncement = {
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          is_active: announcement.isActive !== false,
          created_at: announcement.createdAt || new Date().toISOString(),
          created_by: announcement.createdBy || 'system'
        };

        await announcementsService.create(migratedAnnouncement);
        console.log(`Migrated announcement: ${announcement.title}`);
      } catch (error) {
        console.error(`Failed to migrate announcement ${announcement.title}:`, error);
      }
    }
  }

  async migrateCustomers(): Promise<void> {
    console.log('Migrating customer registrations...');
    const localRegistrations = getRegistrations();
    
    if (!localRegistrations || localRegistrations.length === 0) {
      console.log('No customer registrations to migrate');
      return;
    }

    for (const registration of localRegistrations) {
      try {
        const customer = {
          id: registration.id,
          parent_name: registration.parentName,
          parent_email: registration.email,
          parent_phone: registration.phone,
          children: registration.children,
          emergency_contact: null, // Default value since not in Registration type
          medical_conditions: null, // Default value since not in Registration type
          program_id: registration.programId,
          payment_status: registration.paymentStatus || 'pending',
          created_at: registration.createdAt?.toISOString() || new Date().toISOString()
        };

        await customerService.create(customer);
        console.log(`Migrated customer: ${registration.parentName}`);
      } catch (error) {
        console.error(`Failed to migrate customer ${registration.parentName}:`, error);
      }
    }
  }

  async markMigrationComplete(): Promise<void> {
    try {
      await supabase
        .from('system_settings')
        .upsert({
          key: 'migration_completed',
          value: 'true',
          updated_at: new Date().toISOString()
        });
      
      console.log('Migration marked as complete');
    } catch (error) {
      console.error('Failed to mark migration as complete:', error);
    }
  }

  async runFullMigration(): Promise<void> {
    try {
      console.log('Starting full data migration...');
      
      const isAlreadyMigrated = await this.checkMigrationStatus();
      if (isAlreadyMigrated) {
        console.log('Data has already been migrated');
        return;
      }

      await this.migrateAdminUsers();
      await this.migratePrograms();
      await this.migrateAnnouncements();
      await this.migrateCustomers();
      await this.markMigrationComplete();

      console.log('Full migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

export const migrationService = MigrationService.getInstance();
