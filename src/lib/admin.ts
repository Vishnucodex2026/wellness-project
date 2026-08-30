import { getSupabase } from './supabase';

export interface DashboardLead {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  age: string;
  weight: string | null;
  height: string | null;
  gender: string | null;
  overall_score: number;
  readiness: number;
  main_goal: string | null;
  language: string | null;
}

export interface DashboardAppointment {
  id: string;
  created_at: string;
  lead_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  request_type: 'callback' | 'appointment';
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  language: string | null;
  status: string;
}

export interface BusinessSettings {
  id: number;
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  business_email: string;
  whatsapp_message: string;
  updated_at?: string;
}

export async function signInAdmin(email: string, password: string) {
  const supabase = getSupabase();

  if (!supabase) {
    return { error: new Error('Supabase is not configured.') };
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutAdmin() {
  const supabase = getSupabase();

  if (!supabase) {
    return { error: new Error('Supabase is not configured.') };
  }

  return supabase.auth.signOut();
}

export async function verifyAdmin() {
  const supabase = getSupabase();

  if (!supabase) {
    return { session: null, isAdmin: false };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { session: null, isAdmin: false };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return {
    session,
    isAdmin: !error && !!data,
  };
}

export async function fetchLeads(): Promise<DashboardLead[]> {
  const supabase = getSupabase();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('wellness_leads')
    .select(
      'id,created_at,full_name,phone,email,city,age,weight,height,gender,overall_score,readiness,main_goal,language'
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function fetchAppointments(): Promise<DashboardAppointment[]> {
  const supabase = getSupabase();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('contact_requests')
    .select(
      'id,created_at,lead_id,full_name,phone,email,request_type,preferred_date,preferred_time,notes,language,status'
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function updateAppointmentStatus(
  id: string,
  status: string
) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('contact_requests')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLead(id: string) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('wellness_leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateLead(
  id: string,
  updates: {
    full_name: string;
    phone: string;
    email: string | null;
    city: string | null;
    age: string;
    weight: string | null;
    height: string | null;
    gender: string | null;
    main_goal: string | null;
    language: string | null;
  }
) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('wellness_leads')
    .update(updates)
    .eq('id', id)
    .select(
      'id,created_at,full_name,phone,email,city,age,weight,height,gender,overall_score,readiness,main_goal,language'
    )
    .single();

  if (error) throw error;

  return data as DashboardLead;
}

export async function deleteAppointment(id: string) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('contact_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = getSupabase();

  if (!supabase) return null;

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function updateBusinessSettings(
  settings: Omit<BusinessSettings, 'updated_at'>
) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('business_settings')
    .update({
      business_name: settings.business_name,
      owner_name: settings.owner_name,
      whatsapp_number: settings.whatsapp_number,
      business_email: settings.business_email,
      whatsapp_message: settings.whatsapp_message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('*')
    .single();

  if (error) throw error;

  return data as BusinessSettings;
}