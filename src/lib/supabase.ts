import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

export interface LeadRecord {
  id?: string;
  created_at?: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  age: string;
  weight: string;
  height: string;
  gender: string;
  answers: Record<string, unknown>;
  overall_score: number;
  category_scores: Record<string, number>;
  readiness: number;
  main_goal: string;
  language?: string;
}

export interface ContactRequestRecord {
  full_name: string;
  phone: string;
  email?: string;
  request_type: 'callback' | 'appointment';
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  language?: string;
}

async function insertFallback(table: string, record: Record<string, unknown>): Promise<boolean> {
  try {
    const key = table === 'wellness_leads' ? 'bhw_leads' : 'bhw_contact_requests';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ ...record, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore
  }
  return false;
}

export async function saveLead(record: LeadRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return insertFallback('wellness_leads', record);
  const { error } = await supabase.from('wellness_leads').insert(record);
  return !error;
}

export async function saveContactRequest(record: ContactRequestRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return insertFallback('contact_requests', record);
  const { error } = await supabase.from('contact_requests').insert(record);
  return !error;
}


export async function getPublicBusinessSettings(): Promise<{ whatsapp_number: string; business_name: string; owner_name: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('business_settings')
    .select('whatsapp_number,business_name,owner_name')
    .eq('id', 1)
    .maybeSingle();
  if (error) return null;
  return data;
}
