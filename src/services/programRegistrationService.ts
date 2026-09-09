import { supabase } from '@/integrations/supabase/client';

// Kenyan Experiences Service
export const kenyanExperiencesService = {
  async create(data: any) {
    const row = {
      parent_leader: data.parentLeader,
      participants: data.participants,
      circuit: data.circuit,
      preferred_dates: data.preferredDates,
      transport: data.transport || false,
      special_medical_needs: data.specialMedicalNeeds || null,
      email: data.email,
      phone: data.phone,
      consent_given: data.consent,
    };

    const { error } = await supabase
      .from('kenyan_experiences_registrations' as any)
      .insert([row] as any);

    // IMPORTANT: anonymous users do not have SELECT access, so we must not request
    // returned rows here (no .select(), no .single()).
    if (error) throw error;
    return row;
  },

  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('kenyan_experiences_registrations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('kenyan_experiences_registrations' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('kenyan_experiences_registrations' as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Homeschooling Service
export const homeschoolingService = {
  async create(data: any) {
    const row = {
      parent_name: data.parentName,
      children: data.children,
      package: data.package,
      focus: data.focus,
      transport: data.transport || false,
      meal: data.meal || false,
      allergies: data.allergies || null,
      email: data.email,
      phone: data.phone,
      consent_given: data.consent,
    };

    const { error } = await supabase
      .from('homeschooling_registrations' as any)
      .insert([row] as any);

    // IMPORTANT: avoid .select() for anon submissions (RLS blocks SELECT)
    if (error) throw error;
    return row;
  },

  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('homeschooling_registrations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('homeschooling_registrations' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('homeschooling_registrations' as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// School Experience Service
export const schoolExperienceService = {
  async create(data: any) {
    const row = {
      school_name: data.schoolName,
      number_of_kids: data.numberOfKids,
      number_of_adults: data.numberOfAdults,
      age_ranges: data.ageRanges,
      package: data.package,
      preferred_dates: data.preferredDates,
      location: data.location,
      number_of_students: data.numberOfStudents,
      number_of_teachers: data.numberOfTeachers,
      transport: data.transport || false,
      catering: data.catering || false,
      special_needs: data.specialNeeds || null,
      email: data.email,
      phone: data.phone,
      consent_given: data.consent,
    };

    const { error } = await supabase
      .from('school_experience_registrations' as any)
      .insert([row] as any);

    // IMPORTANT: avoid .select() for anon submissions (RLS blocks SELECT)
    if (error) throw error;
    return row;
  },

  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('school_experience_registrations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('school_experience_registrations' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('school_experience_registrations' as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Team Building Service
export const teamBuildingService = {
  async create(data: any) {
    const row = {
      occasion: data.occasion,
      adults_number: data.adultsNumber,
      children_number: data.childrenNumber,
      age_range: data.ageRange,
      package: data.package,
      event_date: data.eventDate instanceof Date ? data.eventDate.toISOString() : data.eventDate,
      location: data.location,
      decor: data.decor || false,
      catering: data.catering || false,
      email: data.email,
      phone: data.phone,
      consent_given: data.consent,
    };

    const { error } = await supabase
      .from('team_building_registrations' as any)
      .insert([row] as any);

    // IMPORTANT: avoid .select() for anon submissions (RLS blocks SELECT)
    if (error) throw error;
    return row;
  },

  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('team_building_registrations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('team_building_registrations' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('team_building_registrations' as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Parties Service
export const partiesService = {
  async create(data: any) {
    const row = {
      occasion: data.occasion,
      parent_name: data.parentName,
      children: data.children,
      guests_number: data.guestsNumber,
      package_type: data.packageType,
      event_date: data.eventDate instanceof Date ? data.eventDate.toISOString() : data.eventDate,
      location: data.location,
      decor: data.decor || false,
      catering: data.catering || false,
      photography: data.photography || false,
      activities: data.activities || false,
      email: data.email,
      phone: data.phone,
      consent_given: data.consent,
    };

    const { error } = await supabase
      .from('parties_registrations' as any)
      .insert([row] as any);

    // IMPORTANT: avoid .select() for anon submissions (RLS blocks SELECT)
    if (error) throw error;
    return row;
  },

  async getAll(filters?: { status?: string }) {
    let query = supabase
      .from('parties_registrations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('parties_registrations' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('parties_registrations' as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
