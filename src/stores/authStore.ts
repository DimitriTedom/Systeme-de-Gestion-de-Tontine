import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  // Initialisation
  initialize: () => Promise<void>;
  
  // Authentification
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  
  // Récupération de mot de passe
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  
  // Utilitaires
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // État initial
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  // Initialisation - à appeler au démarrage de l'app
  initialize: async () => {
    try {
      // Récupérer la session actuelle
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error);
        set({ error: error.message, isLoading: false, isInitialized: true });
        return;
      }

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true,
      });

      // Écouter les changements d'état d'authentification
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      set({
        error: error instanceof Error ? error.message : 'Erreur d\'initialisation',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // Connexion avec email/password
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      set({ error: errorMessage, isLoading: false });
      return { error: error as AuthError };
    }
  },

  // Inscription (pour créer l'admin initial si nécessaire)
  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error };
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
      set({ error: errorMessage, isLoading: false });
      return { error: error as AuthError };
    }
  },

  // Déconnexion
  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Supabase signOut error:', error.message);
        // Continue anyway to clear local state
      }

      set({
        user: null,
        session: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error during signOut:', error);
      // Still clear the session locally even if Supabase fails
      set({
        user: null,
        session: null,
        error: null, // Don't show error to user on logout
        isLoading: false,
      });
    }
  },

  // Réinitialisation du mot de passe
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      set({ isLoading: false });
      
      if (error) {
        set({ error: error.message });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
      set({ error: errorMessage, isLoading: false });
      return { error: error as AuthError };
    }
  },

  // Mise à jour du mot de passe
  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      set({ isLoading: false });
      
      if (error) {
        set({ error: error.message });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      set({ error: errorMessage, isLoading: false });
      return { error: error as AuthError };
    }
  },

  // Effacer les erreurs
  clearError: () => {
    set({ error: null });
  },
}));

// Hook utilitaire pour vérifier si l'utilisateur est authentifié
export const useIsAuthenticated = () => {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  return isInitialized && user !== null;
};
