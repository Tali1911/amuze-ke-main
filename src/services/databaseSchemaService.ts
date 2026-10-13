
import { TableCreator } from './database/tableCreator';
import { SecuritySetup } from './database/securitySetup';
import { SchemaValidator } from './database/schemaValidator';

export class DatabaseSchemaService {
  private static instance: DatabaseSchemaService;

  static getInstance(): DatabaseSchemaService {
    if (!DatabaseSchemaService.instance) {
      DatabaseSchemaService.instance = new DatabaseSchemaService();
    }
    return DatabaseSchemaService.instance;
  }

  async createAllTables(): Promise<void> {
    try {
      console.log('Starting database schema creation...');
      
      await TableCreator.createSystemSettingsTable();
      await TableCreator.createAdminUsersTable();
      await TableCreator.createCustomersTable();
      await TableCreator.createProgramsTable();
      await TableCreator.createAnnouncementsTable();
      await TableCreator.createAuditLogsTable();
      await TableCreator.createGovernanceTables();
      await TableCreator.createContentTables();
      await SecuritySetup.setupRowLevelSecurity();
      
      console.log('Database schema creation completed successfully');
    } catch (error) {
      console.error('Database schema creation failed:', error);
      throw error;
    }
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    return SchemaValidator.checkTableExists(tableName);
  }

  async getSchemaStatus(): Promise<Record<string, boolean>> {
    return SchemaValidator.getSchemaStatus();
  }
}

export const databaseSchemaService = DatabaseSchemaService.getInstance();
