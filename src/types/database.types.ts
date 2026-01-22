// Types générés pour Supabase Database
// Ces types correspondent au schéma SQL défini dans supabase/migrations/001_init_schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      membre: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          telephone: string;
          email: string;
          adresse: string | null;
          commune: string | null;
          statut: 'Actif' | 'Inactif' | 'Suspendu';
          date_inscription: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          prenom: string;
          telephone: string;
          email: string;
          adresse?: string | null;
          commune?: string | null;
          statut?: 'Actif' | 'Inactif' | 'Suspendu';
          date_inscription?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          prenom?: string;
          telephone?: string;
          email?: string;
          adresse?: string | null;
          commune?: string | null;
          statut?: 'Actif' | 'Inactif' | 'Suspendu';
          date_inscription?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tontine: {
        Row: {
          id: string;
          nom: string;
          type: 'presence' | 'optionnelle';
          montant_cotisation: number;
          periode: 'hebdomadaire' | 'bimensuelle' | 'mensuelle';
          description: string | null;
          date_debut: string;
          date_fin: string | null;
          statut: 'Actif' | 'Terminée' | 'Annulée';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          type: 'presence' | 'optionnelle';
          montant_cotisation: number;
          periode: 'hebdomadaire' | 'bimensuelle' | 'mensuelle';
          description?: string | null;
          date_debut: string;
          date_fin?: string | null;
          statut?: 'Actif' | 'Terminée' | 'Annulée';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          type?: 'presence' | 'optionnelle';
          montant_cotisation?: number;
          periode?: 'hebdomadaire' | 'bimensuelle' | 'mensuelle';
          description?: string | null;
          date_debut?: string;
          date_fin?: string | null;
          statut?: 'Actif' | 'Terminée' | 'Annulée';
          created_at?: string;
          updated_at?: string;
        };
      };
      participe: {
        Row: {
          id: string;
          id_membre: string;
          id_tontine: string;
          nb_parts: number;
          date_adhesion: string;
          statut: 'actif' | 'inactif' | 'suspendu';
          created_at: string;
        };
        Insert: {
          id?: string;
          id_membre: string;
          id_tontine: string;
          nb_parts?: number;
          date_adhesion?: string;
          statut?: 'actif' | 'inactif' | 'suspendu';
          created_at?: string;
        };
        Update: {
          id?: string;
          id_membre?: string;
          id_tontine?: string;
          nb_parts?: number;
          date_adhesion?: string;
          statut?: 'actif' | 'inactif' | 'suspendu';
          created_at?: string;
        };
      };
      seance: {
        Row: {
          id: string;
          id_tontine: string;
          numero_seance: number;
          date: string;
          lieu: string | null;
          ordre_du_jour: string | null;
          notes: string | null;
          statut: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
          total_cotisations: number;
          total_penalites: number;
          nombre_presents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_tontine: string;
          numero_seance: number;
          date: string;
          lieu?: string | null;
          ordre_du_jour?: string | null;
          notes?: string | null;
          statut?: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
          total_cotisations?: number;
          total_penalites?: number;
          nombre_presents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_tontine?: string;
          numero_seance?: number;
          date?: string;
          lieu?: string | null;
          ordre_du_jour?: string | null;
          notes?: string | null;
          statut?: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
          total_cotisations?: number;
          total_penalites?: number;
          nombre_presents?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      cotisation: {
        Row: {
          id: string;
          id_membre: string;
          id_seance: string;
          id_tontine: string;
          montant: number;
          montant_attendu: number;
          date_paiement: string;
          methode_paiement: 'especes' | 'virement' | 'mobile_money';
          statut: 'en_attente' | 'partiel' | 'complete' | 'en_retard';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_membre: string;
          id_seance: string;
          id_tontine: string;
          montant: number;
          montant_attendu: number;
          date_paiement?: string;
          methode_paiement?: 'especes' | 'virement' | 'mobile_money';
          statut?: 'en_attente' | 'partiel' | 'complete' | 'en_retard';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_membre?: string;
          id_seance?: string;
          id_tontine?: string;
          montant?: number;
          montant_attendu?: number;
          date_paiement?: string;
          methode_paiement?: 'especes' | 'virement' | 'mobile_money';
          statut?: 'en_attente' | 'partiel' | 'complete' | 'en_retard';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit: {
        Row: {
          id: string;
          id_membre: string;
          id_tontine: string | null;
          montant: number;
          solde: number;
          taux_interet: number;
          objet: string | null;
          date_demande: string;
          date_decaissement: string | null;
          date_remboursement_prevue: string;
          montant_rembourse: number;
          statut: 'en_attente' | 'approuve' | 'decaisse' | 'en_cours' | 'rembourse' | 'en_retard' | 'defaut';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_membre: string;
          id_tontine?: string | null;
          montant: number;
          solde: number;
          taux_interet?: number;
          objet?: string | null;
          date_demande?: string;
          date_decaissement?: string | null;
          date_remboursement_prevue: string;
          montant_rembourse?: number;
          statut?: 'en_attente' | 'approuve' | 'decaisse' | 'en_cours' | 'rembourse' | 'en_retard' | 'defaut';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_membre?: string;
          id_tontine?: string | null;
          montant?: number;
          solde?: number;
          taux_interet?: number;
          objet?: string | null;
          date_demande?: string;
          date_decaissement?: string | null;
          date_remboursement_prevue?: string;
          montant_rembourse?: number;
          statut?: 'en_attente' | 'approuve' | 'decaisse' | 'en_cours' | 'rembourse' | 'en_retard' | 'defaut';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      penalite: {
        Row: {
          id: string;
          id_membre: string;
          id_seance: string | null;
          id_tontine: string | null;
          montant: number;
          montant_paye: number;
          raison: string;
          type_penalite: 'absence' | 'retard_cotisation' | 'mauvaise_conduite' | 'autre';
          date: string;
          date_paiement: string | null;
          statut: 'non_paye' | 'paye' | 'partiellement_paye' | 'annule';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_membre: string;
          id_seance?: string | null;
          id_tontine?: string | null;
          montant: number;
          montant_paye?: number;
          raison: string;
          type_penalite?: 'absence' | 'retard_cotisation' | 'mauvaise_conduite' | 'autre';
          date?: string;
          date_paiement?: string | null;
          statut?: 'non_paye' | 'paye' | 'partiellement_paye' | 'annule';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_membre?: string;
          id_seance?: string | null;
          id_tontine?: string | null;
          montant?: number;
          montant_paye?: number;
          raison?: string;
          type_penalite?: 'absence' | 'retard_cotisation' | 'mauvaise_conduite' | 'autre';
          date?: string;
          date_paiement?: string | null;
          statut?: 'non_paye' | 'paye' | 'partiellement_paye' | 'annule';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tour: {
        Row: {
          id: string;
          id_tontine: string;
          id_seance: string | null;
          id_beneficiaire: string;
          numero: number;
          date: string;
          montant_distribue: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_tontine: string;
          id_seance?: string | null;
          id_beneficiaire: string;
          numero: number;
          date: string;
          montant_distribue: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_tontine?: string;
          id_seance?: string | null;
          id_beneficiaire?: string;
          numero?: number;
          date?: string;
          montant_distribue?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projet: {
        Row: {
          id: string;
          id_tontine: string;
          id_responsable: string | null;
          nom: string;
          description: string | null;
          budget: number;
          montant_alloue: number;
          date_debut: string;
          date_cible: string | null;
          date_fin_reelle: string | null;
          statut: 'planifie' | 'collecte_fonds' | 'en_cours' | 'termine' | 'annule';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          id_tontine: string;
          id_responsable?: string | null;
          nom: string;
          description?: string | null;
          budget: number;
          montant_alloue?: number;
          date_debut: string;
          date_cible?: string | null;
          date_fin_reelle?: string | null;
          statut?: 'planifie' | 'collecte_fonds' | 'en_cours' | 'termine' | 'annule';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          id_tontine?: string;
          id_responsable?: string | null;
          nom?: string;
          description?: string | null;
          budget?: number;
          montant_alloue?: number;
          date_debut?: string;
          date_cible?: string | null;
          date_fin_reelle?: string | null;
          statut?: 'planifie' | 'collecte_fonds' | 'en_cours' | 'termine' | 'annule';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      presence: {
        Row: {
          id: string;
          id_membre: string;
          id_seance: string;
          present: boolean;
          heure_arrivee: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          id_membre: string;
          id_seance: string;
          present?: boolean;
          heure_arrivee?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          id_membre?: string;
          id_seance?: string;
          present?: boolean;
          heure_arrivee?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      v_membre_synthese: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          email: string;
          telephone: string;
          statut: string;
          nombre_tontines: number;
          total_cotisations: number;
          penalites_impayees: number;
          credits_actifs: number;
        };
      };
      v_tontine_synthese: {
        Row: {
          id: string;
          nom: string;
          type: string;
          montant_cotisation: number;
          periode: string;
          statut: string;
          nombre_membres: number;
          nombre_seances: number;
          total_cotisations: number;
          tours_effectues: number;
        };
      };
    };
    Functions: {
      cloturer_seance: {
        Args: {
          id_seance_param: string;
          montant_penalite_absence?: number;
        };
        Returns: Json;
      };
      attribuer_gain: {
        Args: {
          id_seance_param: string;
          id_membre_param: string;
        };
        Returns: Json;
      };
      enregistrer_presence_et_cotisation: {
        Args: {
          id_seance_param: string;
          id_membre_param: string;
          est_present: boolean;
          montant_paye?: number;
        };
        Returns: Json;
      };
      get_statistiques_dashboard: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_membres_seance: {
        Args: {
          id_seance_param: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Types utilitaires pour faciliter l'usage
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type Views<T extends keyof Database['public']['Views']> = 
  Database['public']['Views'][T]['Row'];

// Types des entités
export type Membre = Tables<'membre'>;
export type Tontine = Tables<'tontine'>;
export type Participe = Tables<'participe'>;
export type Seance = Tables<'seance'>;
export type Cotisation = Tables<'cotisation'>;
export type Credit = Tables<'credit'>;
export type Penalite = Tables<'penalite'>;
export type Tour = Tables<'tour'>;
export type Projet = Tables<'projet'>;
export type Presence = Tables<'presence'>;

// Types pour les vues
export type MembreSynthese = Views<'v_membre_synthese'>;
export type TontineSynthese = Views<'v_tontine_synthese'>;

// Types pour les réponses RPC
export interface DashboardStats {
  total_membres: number;
  total_tontines: number;
  caisse: number;
  credits_actifs: number;
  montant_credits_actifs: number;
  penalites_non_payees: number;
  montant_penalites_non_payees: number;
  projets_actifs: number;
  total_cotisations: number;
  total_tours: number;
  dernieres_seances: Array<{
    id: string;
    date: string;
    lieu: string;
    statut: string;
    total_cotisations: number;
  }>;
}

export interface MembreSeance {
  id_membre: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nb_parts: number;
  montant_attendu: number;
  expected_contribution: number; // Alias for montant_attendu
  present: boolean;
  montant_paye: number;
  montant_cotise: number; // Alias for montant_paye
  deja_cotise: boolean;
  statut_cotisation: string | null;
  penalites_impayees: number;
}

export interface PenaltySummary {
  nom: string;
  prenom: string;
  montant: number;
  raison: string;
}

export interface ClotureSeanceResult {
  id_seance: string;
  statut: string;
  total_cotisations: number;
  total_penalites: number;
  nombre_presents: number;
  penalites_creees: Array<{
    id_membre: string;
    nom: string;
    prenom: string;
    montant: number;
    raison: string;
  }>;
}

export interface AttributionGainResult {
  id_tour: string;
  id_seance: string;
  id_beneficiaire: string;
  numero_tour: number;
  montant_distribue: number;
  date: string;
}
// ============================================================================
// NOUVELLE TABLE: TRANSACTION (pour traçabilité financière)
// ============================================================================

export interface Transaction {
  id: string;
  id_tontine: string;
  id_membre: string | null;
  id_seance: string | null;
  type: 'contribution' | 'credit_granted' | 'credit_repayment' | 'penalty' | 'tour_distribution' | 'project_expense' | 'initial_funding' | 'adjustment';
  montant: number; // Positif = entrée, Négatif = sortie
  description: string;
  id_credit: string | null;
  id_penalite: string | null;
  id_tour: string | null;
  id_projet: string | null;
  metadata: Record<string, any> | null;
  created_by: string | null;
  created_at: string;
}

export interface InsertTransaction {
  id?: string;
  id_tontine: string;
  id_membre?: string | null;
  id_seance?: string | null;
  type: 'contribution' | 'credit_granted' | 'credit_repayment' | 'penalty' | 'tour_distribution' | 'project_expense' | 'initial_funding' | 'adjustment';
  montant: number;
  description: string;
  id_credit?: string | null;
  id_penalite?: string | null;
  id_tour?: string | null;
  id_projet?: string | null;
  metadata?: Record<string, any> | null;
  created_by?: string | null;
  created_at?: string;
}

export interface TransactionEnrichie {
  id: string;
  id_tontine: string;
  tontine_nom: string | null;
  type: string;
  montant: number;
  description: string;
  created_at: string;
  id_membre: string | null;
  membre_nom: string | null;
  id_seance: string | null;
  numero_seance: number | null;
  id_credit: string | null;
  id_penalite: string | null;
  id_tour: string | null;
  id_projet: string | null;
  projet_nom: string | null;
  metadata: Record<string, any> | null;
}

export interface TontineFinancialSummary {
  solde_actuel: number;
  total_entrees: number;
  total_sorties: number;
  total_cotisations: number;
  total_penalites: number;
  total_remboursements: number;
  total_credits_decaisses: number;
  total_tours_distribues: number;
}