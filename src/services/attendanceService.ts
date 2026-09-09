import { supabase } from '@/integrations/supabase/client';
import { CampAttendance, AttendanceRecord } from '@/types/campRegistration';

interface RegistrationDetails {
  parent_name: string;
  email: string;
  camp_type: string;
}

// Helper to send attendance notification email
async function sendAttendanceNotification(
  registrationId: string,
  childName: string,
  eventType: 'check-in' | 'check-out',
  notes?: string
) {
  try {
    // Fetch registration details for email
    const { data: registration, error: regError } = await supabase
      .from('camp_registrations')
      .select('parent_name, email, camp_type')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      console.error('Could not fetch registration for notification:', regError);
      return;
    }

    const regDetails = registration as RegistrationDetails;

    const { error } = await supabase.functions.invoke('send-attendance-notification', {
      body: {
        registrationId,
        childName,
        parentEmail: regDetails.email,
        parentName: regDetails.parent_name,
        campType: regDetails.camp_type,
        eventType,
        timestamp: new Date().toISOString(),
        notes
      }
    });

    if (error) {
      console.error('Failed to send attendance notification:', error);
    } else {
      console.log(`Attendance ${eventType} notification sent for ${childName}`);
    }
  } catch (err) {
    console.error('Error sending attendance notification:', err);
  }
}
// Client-side fallback for the DB trigger that promotes a quotation to an
// invoice the moment a child checks in. Safe to run even when the trigger
// already did it (idempotent — only updates rows still marked as quotations).
async function promoteRegistrationToInvoiceIfNeeded(registrationId: string) {
  try {
    const { data: reg } = await (supabase as any)
      .from('camp_registrations')
      .select('id, billing_doc_type, payment_status, invoice_number, converted_to_invoice_at')
      .eq('id', registrationId)
      .maybeSingle();

    if (!reg) return;
    const r = reg as any;
    if (r.payment_status === 'paid') return;
    if (r.billing_doc_type === 'invoice' || r.billing_doc_type === 'paid') return;

    const time = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invoiceNumber = r.invoice_number || `INV-${time}-${rand}`;

    await (supabase as any)
      .from('camp_registrations')
      .update({
        billing_doc_type: 'invoice',
        invoice_number: invoiceNumber,
        converted_to_invoice_at: r.converted_to_invoice_at || new Date().toISOString(),
      })
      .eq('id', registrationId);
  } catch (err) {
    // Non-fatal: trigger will/has handled it.
    console.warn('promoteRegistrationToInvoiceIfNeeded skipped:', err);
  }
}


export const attendanceService = {
  async checkIn(registrationId: string, childName: string, markedBy: string, notes?: string, sendNotification = false) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .insert({
        registration_id: registrationId,
        child_name: childName,
        check_in_time: new Date().toISOString(),
        attendance_date: new Date().toISOString().split('T')[0],
        marked_by: markedBy,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Promote quotation → invoice (idempotent client fallback for DB trigger)
    await promoteRegistrationToInvoiceIfNeeded(registrationId);

    // Optionally send notification
    if (sendNotification) {
      sendAttendanceNotification(registrationId, childName, 'check-in', notes);
    }

    return data as CampAttendance;
  },

  async checkInForDate(registrationId: string, childName: string, markedBy: string, date: string, notes?: string, sendNotification = false) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .insert({
        registration_id: registrationId,
        child_name: childName,
        check_in_time: new Date().toISOString(),
        attendance_date: date,
        marked_by: markedBy,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    await promoteRegistrationToInvoiceIfNeeded(registrationId);

    if (sendNotification) {
      sendAttendanceNotification(registrationId, childName, 'check-in', notes);
    }

    return data as CampAttendance;
  },

  async checkOut(attendanceId: string, notes?: string, sendNotification = false, registrationId?: string, childName?: string) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .update({
        check_out_time: new Date().toISOString(),
        notes,
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;

    if (sendNotification && registrationId && childName) {
      sendAttendanceNotification(registrationId, childName, 'check-out', notes);
    }

    return data as CampAttendance;
  },

  async getAttendanceByDate(date: string, campType?: string) {
    let query = supabase
      .from('camp_attendance')
      .select(`
        *,
        camp_registrations!inner(
          registration_number,
          parent_name,
          payment_status,
          camp_type
        )
      `)
      .eq('attendance_date', date);

    if (campType) {
      query = query.eq('camp_registrations.camp_type', campType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getTodaysAttendance(campType?: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByDate(today, campType);
  },

  async getAttendanceByRegistration(registrationId: string) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .select('*')
      .eq('registration_id', registrationId)
      .order('attendance_date', { ascending: false });

    if (error) throw error;
    return data as CampAttendance[];
  },

  async getAttendanceSummary(campType?: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('camp_attendance')
      .select(`
        attendance_date,
        camp_registrations!inner(camp_type, payment_status)
      `);

    if (campType) {
      query = query.eq('camp_registrations.camp_type', campType);
    }
    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async hasCheckedInToday(registrationId: string, childName: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.hasCheckedInOnDate(registrationId, childName, today);
  },

  async hasCheckedInOnDate(registrationId: string, childName: string, date: string) {
    // Use limit(1) instead of maybeSingle because legacy data sometimes contains
    // duplicate attendance rows for the same child/date (e.g. two staff checking
    // in concurrently). maybeSingle() throws PGRST116 in that case and would
    // break the whole "Failed to load registrations" flow.
    const { data, error } = await supabase
      .from('camp_attendance')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('child_name', childName)
      .eq('attendance_date', date)
      .order('check_in_time', { ascending: true })
      .limit(1);

    if (error) throw error;
    return ((data && data[0]) || null) as CampAttendance | null;
  },
};
