// Centralized runtime configuration driven by Vite env variables.
// Defaults keep the app in local-only mode unless explicit Supabase values are provided.
export const config = {
  useSupabase: String(import.meta.env.VITE_USE_SUPABASE).toLowerCase() === 'true',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};
