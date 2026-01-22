-- ============================================================================
-- MIGRATION: Correction du statut de remboursement des crédits
-- Date: 2026-01-22
-- Description: Corrige la fonction rembourser_credit pour gérer correctement
--              le statut 'decaisse' et la transition vers 'en_cours'
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS rembourser_credit(UUID, NUMERIC);

-- FONCTION: rembourser_credit (Version corrigée)
-- Description: Traite un remboursement de crédit (partiel ou total)
-- Gère correctement les transitions de statut : decaisse → en_cours → rembourse
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rembourser_credit(
    id_credit_param UUID,
    montant_paye NUMERIC
)
RETURNS TABLE (
    id UUID,
    montant NUMERIC,
    solde NUMERIC,
    montant_rembourse NUMERIC,
    statut TEXT,
    est_rembourse_complet BOOLEAN
) AS $$
DECLARE
    v_credit RECORD;
    v_nouveau_solde NUMERIC;
    v_nouveau_montant_rembourse NUMERIC;
    v_nouveau_statut TEXT;
BEGIN
    -- Récupérer le crédit
    SELECT * INTO v_credit FROM credit WHERE credit.id = id_credit_param;
    
    IF v_credit IS NULL THEN
        RAISE EXCEPTION 'Crédit non trouvé';
    END IF;
    
    -- Vérifier que le montant payé est positif
    IF montant_paye <= 0 THEN
        RAISE EXCEPTION 'Le montant du remboursement doit être supérieur à 0';
    END IF;
    
    -- Vérifier que le montant ne dépasse pas le solde restant
    IF montant_paye > v_credit.solde THEN
        RAISE EXCEPTION 'Le montant du remboursement (%) dépasse le solde restant (%)', 
            montant_paye, v_credit.solde;
    END IF;
    
    -- Calculer les nouvelles valeurs
    v_nouveau_montant_rembourse := v_credit.montant_rembourse + montant_paye;
    v_nouveau_solde := GREATEST(0, v_credit.solde - montant_paye);
    
    -- Déterminer le nouveau statut
    IF v_nouveau_solde = 0 THEN
        -- Crédit entièrement remboursé
        v_nouveau_statut := 'rembourse';
    ELSIF v_credit.statut = 'en_retard' AND v_nouveau_solde > 0 THEN
        -- Reste en retard si pas complètement remboursé et déjà en retard
        v_nouveau_statut := 'en_retard';
    ELSIF v_credit.statut = 'defaut' AND v_nouveau_solde > 0 THEN
        -- Reste en défaut si pas complètement remboursé et déjà en défaut
        v_nouveau_statut := 'defaut';
    ELSIF v_credit.statut IN ('decaisse', 'en_cours') AND v_nouveau_solde > 0 THEN
        -- Passe à 'en_cours' si c'était 'decaisse' ou reste 'en_cours'
        v_nouveau_statut := 'en_cours';
    ELSE
        -- Par défaut, passe à 'en_cours'
        v_nouveau_statut := 'en_cours';
    END IF;
    
    -- Mettre à jour le crédit
    UPDATE credit
    SET 
        montant_rembourse = v_nouveau_montant_rembourse,
        solde = v_nouveau_solde,
        statut = v_nouveau_statut,
        updated_at = NOW()
    WHERE credit.id = id_credit_param;
    
    -- Retourner les informations du crédit mis à jour
    RETURN QUERY
    SELECT 
        c.id,
        c.montant,
        c.solde,
        c.montant_rembourse,
        c.statut::TEXT,
        (c.solde = 0) AS est_rembourse_complet
    FROM credit c
    WHERE c.id = id_credit_param;
END;
$$ LANGUAGE plpgsql;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION rembourser_credit(UUID, NUMERIC) IS 
'Traite un remboursement de crédit (partiel ou total). 
Gère les transitions de statut: decaisse → en_cours → rembourse.
Préserve les statuts en_retard et defaut jusqu''au remboursement complet.';
