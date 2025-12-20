
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Only create the client when explicit environment values are provided.
// Vite env keys should be set in .env.[mode]:
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_USE_SUPABASE=true
export const supabase = config.useSupabase && config.supabaseUrl && config.supabaseAnonKey
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
