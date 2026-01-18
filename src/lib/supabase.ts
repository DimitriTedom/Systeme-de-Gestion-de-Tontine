import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies'
  );
}

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
