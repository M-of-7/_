import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

// Create a single, typed Supabase client instance
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient<Database>(supabaseUrl, supabaseKey) 
  : null;

// A simple boolean to check if Supabase is configured
export const isSupabaseConfigured = !!supabase;
