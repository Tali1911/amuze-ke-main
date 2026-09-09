export interface CampChild {
  childName: string;
  dateOfBirth: string;
  ageRange: string;
  specialNeeds?: string;
  selectedDays: string[]; // Deprecated: For backward compatibility
  selectedDates: string[]; // Array of YYYY-MM-DD dates
  selectedSessions: string[] | Record<string, 'half' | 'full'>; // Array (old) or keyed by date (new)
  price: number;
  activityType?: 'camp' | 'archery'; // 'archery' for Ngong Sanctuary archery-only sessions
}

export interface CampRegistration {
  id?: string;
  registration_number?: string;
  camp_type: 'easter' | 'summer' | 'end-year' | 'mid-term-1' | 'mid-term-2' | 'mid-term-3' | 'mid-term-october' | 'mid-term-feb-march' | 'day-camps' | 'little-forest';
  parent_name: string;
  email: string;
  phone: string;
  emergency_contact?: string;
  children: CampChild[];
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'partial';
  payment_method: 'pending' | 'card' | 'mpesa' | 'cash_ground' | 'bank_transfer';
  payment_reference?: string;
  registration_type: 'online_only' | 'online_paid' | 'ground_registration';
  qr_code_data: string;
  consent_given: boolean;
  status: 'active' | 'cancelled' | 'completed';
  location?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  /** 'quotation' = registered, not paid & not attended; 'invoice' = unpaid but attended; 'paid' = fully paid */
  billing_doc_type?: 'quotation' | 'invoice' | 'paid';
  quote_number?: string;
  invoice_number?: string;
  converted_to_invoice_at?: string;
  admin_notes?: string;
  discount_amount?: number;
  discount_id?: string;
}

export interface CampAttendance {
  id?: string;
  registration_id: string;
  child_name: string;
  check_in_time: string;
  check_out_time?: string;
  attendance_date: string;
  marked_by?: string;
  notes?: string;
  created_at?: string;
}

export interface AttendanceRecord extends CampAttendance {
  registration_number?: string;
  parent_name?: string;
  payment_status?: string;
}

export interface CampRegistrationWithAttendance extends CampRegistration {
  attendance_records?: CampAttendance[];
}
