/**
 * Utility functions for handling Supabase errors and providing user-friendly messages
 */

import { PostgrestError } from '@supabase/supabase-js';

interface ErrorDetails {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Parse Supabase/PostgreSQL errors and return user-friendly messages in French
 */
export function handleSupabaseError(error: unknown): ErrorDetails {
  // Handle PostgrestError (from Supabase)
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    
    // Check for specific PostgreSQL error codes
    switch (pgError.code) {
      // Unique constraint violation
      case '23505':
        if (pgError.message.includes('email')) {
          return {
            message: 'Cet email est déjà utilisé par un autre membre',
            code: pgError.code,
            details: 'Veuillez utiliser une adresse email différente'
          };
        }
        if (pgError.message.includes('participe_id_membre_id_tontine_key')) {
          return {
            message: 'Ce membre est déjà inscrit à cette tontine',
            code: pgError.code,
            details: 'Un membre ne peut être inscrit qu\'une seule fois par tontine'
          };
        }
        if (pgError.message.includes('tour_id_tontine_numero_key')) {
          return {
            message: 'Ce numéro de tour existe déjà pour cette tontine',
            code: pgError.code,
            details: 'Chaque tour doit avoir un numéro unique'
          };
        }
        if (pgError.message.includes('cotisation_id_membre_id_seance_key')) {
          return {
            message: 'Une cotisation existe déjà pour ce membre à cette séance',
            code: pgError.code,
            details: 'Un membre ne peut cotiser qu\'une fois par séance'
          };
        }
        if (pgError.message.includes('presence_id_membre_id_seance_key')) {
          return {
            message: 'La présence de ce membre est déjà enregistrée pour cette séance',
            code: pgError.code
          };
        }
        return {
          message: 'Cette valeur existe déjà dans le système',
          code: pgError.code,
          details: 'Veuillez utiliser une valeur unique'
        };

      // Foreign key violation
      case '23503':
        if (pgError.message.includes('membre')) {
          return {
            message: 'Le membre sélectionné n\'existe pas',
            code: pgError.code,
            details: 'Veuillez choisir un membre valide'
          };
        }
        if (pgError.message.includes('tontine')) {
          return {
            message: 'La tontine sélectionnée n\'existe pas',
            code: pgError.code,
            details: 'Veuillez choisir une tontine valide'
          };
        }
        if (pgError.message.includes('seance')) {
          return {
            message: 'La séance sélectionnée n\'existe pas',
            code: pgError.code,
            details: 'Veuillez choisir une séance valide'
          };
        }
        return {
          message: 'Référence invalide',
          code: pgError.code,
          details: 'L\'élément référencé n\'existe pas'
        };

      // Check constraint violation
      case '23514':
        if (pgError.message.includes('montant')) {
          return {
            message: 'Le montant doit être positif',
            code: pgError.code,
            details: 'Veuillez entrer un montant valide'
          };
        }
        if (pgError.message.includes('statut')) {
          return {
            message: 'Statut invalide',
            code: pgError.code,
            details: 'Veuillez sélectionner un statut valide'
          };
        }
        if (pgError.message.includes('date')) {
          return {
            message: 'Dates invalides',
            code: pgError.code,
            details: 'La date de fin doit être après la date de début'
          };
        }
        if (pgError.message.includes('nb_parts')) {
          return {
            message: 'Le nombre de parts doit être au moins 1',
            code: pgError.code
          };
        }
        return {
          message: 'Contrainte de validation non respectée',
          code: pgError.code,
          details: 'Vérifiez que toutes les valeurs sont valides'
        };

      // Not null violation
      case '23502':
        const field = pgError.message.match(/column "(\w+)"/)?.[1];
        return {
          message: `Le champ ${field || 'requis'} est obligatoire`,
          code: pgError.code,
          details: 'Veuillez remplir tous les champs obligatoires'
        };

      // Row is being referenced by another table
      case '23P01':
        return {
          message: 'Impossible de supprimer cet élément',
          code: pgError.code,
          details: 'D\'autres éléments dépendent de celui-ci'
        };

      // Invalid text representation
      case '22P02':
        return {
          message: 'Format de données invalide',
          code: pgError.code,
          details: 'Vérifiez le format des données saisies'
        };

      // Numeric value out of range
      case '22003':
        return {
          message: 'La valeur numérique est trop grande',
          code: pgError.code,
          details: 'Veuillez entrer une valeur plus petite'
        };

      // Division by zero
      case '22012':
        return {
          message: 'Erreur de calcul : division par zéro',
          code: pgError.code
        };

      // Permission denied
      case '42501':
        return {
          message: 'Permission refusée',
          code: pgError.code,
          details: 'Vous n\'avez pas les droits nécessaires pour cette action'
        };

      // PGRST errors (Supabase specific)
      case 'PGRST116':
        return {
          message: 'Aucun résultat trouvé',
          code: pgError.code,
          details: 'L\'élément demandé n\'existe pas'
        };

      case 'PGRST301':
        return {
          message: 'Plusieurs résultats trouvés',
          code: pgError.code,
          details: 'La requête devrait retourner un seul résultat'
        };

      default:
        // Return the original error message if we don't have a specific handler
        return {
          message: pgError.message || 'Une erreur est survenue',
          code: pgError.code,
          details: pgError.details || undefined
        };
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return {
        message: 'Erreur de connexion',
        details: 'Vérifiez votre connexion internet et réessayez'
      };
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return {
        message: 'Délai d\'attente dépassé',
        details: 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants'
      };
    }
    
    // Network connection errors
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      return {
        message: 'Impossible de contacter le serveur',
        details: 'Vérifiez votre connexion internet et réessayez'
      };
    }
    
    return {
      message: error.message || 'Une erreur est survenue lors de l\'opération'
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  // Fallback for unknown error types
  return {
    message: 'Une erreur inattendue est survenue',
    details: 'Veuillez réessayer ou contacter le support si le problème persiste'
  };
}

/**
 * Format error message for toast notifications
 */
export function formatErrorForToast(error: unknown): { title: string; description?: string } {
  const errorDetails = handleSupabaseError(error);
  
  return {
    title: errorDetails.message,
    description: errorDetails.details
  };
}

/**
 * Log error to console with context (development only)
 */
export function logError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}

/**
 * Get operation-specific error messages
 */
export function getOperationError(operation: string, error: unknown): { title: string; description?: string } {
  const errorDetails = handleSupabaseError(error);
  
  // Map generic operations to user-friendly French messages
  const operationMessages: Record<string, string> = {
    'fetch': 'Erreur lors du chargement des données',
    'add': 'Erreur lors de l\'ajout',
    'create': 'Erreur lors de la création',
    'update': 'Erreur lors de la modification',
    'delete': 'Erreur lors de la suppression',
    'save': 'Erreur lors de l\'enregistrement',
    'load': 'Erreur lors du chargement',
    'upload': 'Erreur lors de l\'envoi',
    'download': 'Erreur lors du téléchargement',
    'payment': 'Erreur lors du paiement',
    'registration': 'Erreur lors de l\'inscription',
  };
  
  return {
    title: operationMessages[operation] || errorDetails.message,
    description: errorDetails.details || errorDetails.message
  };
}

/**
 * Create a descriptive error message based on context
 */
export function createContextualError(
  action: string,
  entity: string,
  error: unknown
): { message: string; details?: string } {
  const errorDetails = handleSupabaseError(error);
  
  const actionMap: Record<string, string> = {
    'creating': 'la création',
    'updating': 'la modification',
    'deleting': 'la suppression',
    'fetching': 'le chargement',
    'loading': 'le chargement',
    'saving': 'l\'enregistrement',
  };
  
  const entityMap: Record<string, string> = {
    'project': 'du projet',
    'member': 'du membre',
    'tontine': 'de la tontine',
    'credit': 'du crédit',
    'session': 'de la séance',
    'contribution': 'de la cotisation',
    'penalty': 'de la pénalité',
    'tour': 'du tour',
    'transaction': 'de la transaction',
  };
  
  const actionText = actionMap[action] || action;
  const entityText = entityMap[entity] || entity;
  
  return {
    message: `Erreur lors de ${actionText} ${entityText}`,
    details: errorDetails.details || errorDetails.message
  };
}
