import { supabase } from '@/lib/supabase';

export interface TontineMemberParticipation {
  id_membre: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nb_parts: number;
}

/**
 * Get members participating in a specific tontine
 */
export async function getTontineMembers(tontineId: string): Promise<TontineMemberParticipation[]> {
  try {
    const { data, error } = await supabase
      .from('participe')
      .select(`
        id_membre,
        nb_parts,
        membre:id_membre (
          id,
          nom,
          prenom,
          email,
          telephone
        )
      `)
      .eq('id_tontine', tontineId)
      .eq('statut', 'actif');

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id_membre: p.id_membre,
      nom: p.membre.nom,
      prenom: p.membre.prenom,
      email: p.membre.email,
      telephone: p.membre.telephone,
      nb_parts: p.nb_parts,
    }));
  } catch (error) {
    console.error('Error fetching tontine members:', error);
    return [];
  }
}
