export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'uuid' | 'json';
}

export interface JoinDef {
  table: string;
  label: string;
  foreignKey: string; // column on the primary table
  selectSyntax: string; // Supabase nested select syntax
}

export interface TableDef {
  name: string;
  label: string;
  columns: ColumnDef[];
  joins: JoinDef[];
}

export const dataExplorerTables: TableDef[] = [
  {
    name: 'camp_registrations',
    label: 'Camp Registrations',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'registration_number', label: 'Reg Number', type: 'text' },
      { key: 'parent_name', label: 'Parent Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'camp_type', label: 'Camp Type', type: 'text' },
      { key: 'registration_type', label: 'Registration Type', type: 'text' },
      { key: 'total_amount', label: 'Total Amount', type: 'number' },
      { key: 'payment_status', label: 'Payment Status', type: 'text' },
      { key: 'payment_method', label: 'Payment Method', type: 'text' },
      { key: 'payment_reference', label: 'Payment Reference', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'children', label: 'Children', type: 'json' },
      { key: 'emergency_contact', label: 'Emergency Contact', type: 'text' },
      { key: 'admin_notes', label: 'Admin Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [
      { table: 'camp_attendance', label: 'Attendance Records', foreignKey: 'id', selectSyntax: 'camp_attendance(*)' },
    ],
  },
  {
    name: 'camp_attendance',
    label: 'Camp Attendance',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'registration_id', label: 'Registration ID', type: 'uuid' },
      { key: 'child_name', label: 'Child Name', type: 'text' },
      { key: 'attendance_date', label: 'Attendance Date', type: 'date' },
      { key: 'check_in_time', label: 'Check In', type: 'date' },
      { key: 'check_out_time', label: 'Check Out', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    joins: [
      { table: 'camp_registrations', label: 'Registration', foreignKey: 'registration_id', selectSyntax: 'camp_registrations(*)' },
    ],
  },
  {
    name: 'payments',
    label: 'Payments',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'invoice_id', label: 'Invoice ID', type: 'uuid' },
      { key: 'registration_id', label: 'Registration ID', type: 'uuid' },
      { key: 'registration_type', label: 'Registration Type', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'program_name', label: 'Program Name', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'payment_method', label: 'Payment Method', type: 'text' },
      { key: 'payment_reference', label: 'Payment Reference', type: 'text' },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'invoices',
    label: 'Invoices',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'invoice_number', label: 'Invoice Number', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'customer_email', label: 'Customer Email', type: 'text' },
      { key: 'program_name', label: 'Program Name', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'tax_amount', label: 'Tax Amount', type: 'number' },
      { key: 'total_amount', label: 'Total Amount', type: 'number' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'payment_terms', label: 'Payment Terms', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'expenses',
    label: 'Expenses',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'expense_date', label: 'Expense Date', type: 'date' },
      { key: 'vendor', label: 'Vendor', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'budget_id', label: 'Budget ID', type: 'uuid' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'budgets',
    label: 'Budgets',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'allocated_amount', label: 'Allocated Amount', type: 'number' },
      { key: 'spent_amount', label: 'Spent Amount', type: 'number' },
      { key: 'period_start', label: 'Period Start', type: 'date' },
      { key: 'period_end', label: 'Period End', type: 'date' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'accounts_action_items',
    label: 'Accounts Action Items',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'registration_id', label: 'Registration ID', type: 'uuid' },
      { key: 'registration_type', label: 'Registration Type', type: 'text' },
      { key: 'child_name', label: 'Child Name', type: 'text' },
      { key: 'parent_name', label: 'Parent Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'action_type', label: 'Action Type', type: 'text' },
      { key: 'amount_due', label: 'Amount Due', type: 'number' },
      { key: 'amount_paid', label: 'Amount Paid', type: 'number' },
      { key: 'camp_type', label: 'Camp Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
      { key: 'completed_at', label: 'Completed At', type: 'date' },
      { key: 'invoice_id', label: 'Invoice ID', type: 'uuid' },
      { key: 'invoice_sent', label: 'Invoice Sent', type: 'boolean' },
      { key: 'invoice_sent_at', label: 'Invoice Sent At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'vendors',
    label: 'Vendors',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'tax_id', label: 'Tax ID', type: 'text' },
      { key: 'payment_terms', label: 'Payment Terms', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [],
  },
  {
    name: 'bills',
    label: 'Bills',
    columns: [
      { key: 'id', label: 'ID', type: 'uuid' },
      { key: 'vendor_id', label: 'Vendor ID', type: 'uuid' },
      { key: 'bill_number', label: 'Bill Number', type: 'text' },
      { key: 'bill_date', label: 'Bill Date', type: 'date' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'amount_paid', label: 'Amount Paid', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'payment_method', label: 'Payment Method', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
    ],
    joins: [],
  },
];

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike';

export interface QueryFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export const operatorLabels: Record<FilterOperator, string> = {
  eq: 'Equals',
  neq: 'Not Equal',
  gt: 'Greater Than',
  gte: 'Greater or Equal',
  lt: 'Less Than',
  lte: 'Less or Equal',
  ilike: 'Contains',
};

export const getOperatorsForType = (type: ColumnDef['type']): FilterOperator[] => {
  switch (type) {
    case 'number':
      return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    case 'date':
      return ['eq', 'gt', 'gte', 'lt', 'lte'];
    case 'boolean':
      return ['eq'];
    case 'text':
    default:
      return ['eq', 'neq', 'ilike'];
  }
};
