import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Client Supabase sans typage strict pour éviter les incompatibilités de version
// Les types sont validés au niveau des stores via les interfaces locales
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persister la session dans le localStorage
    persistSession: true,
    // Détection automatique de la session
    autoRefreshToken: true,
    // Stockage local pour la session
    storage: localStorage,
  },
});

// Export du type pour faciliter l'utilisation
export type SupabaseClient = SupabaseClientType;
