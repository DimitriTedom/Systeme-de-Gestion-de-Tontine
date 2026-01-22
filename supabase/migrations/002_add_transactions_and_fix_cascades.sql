-- ============================================================================
-- MIGRATION: Ajout de la table transaction et correction des CASCADE
-- Objectif: Traçabilité financière complète et suppression en cascade
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer la table TRANSACTION pour traçabilité persistante
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    id_membre UUID REFERENCES membre(id) ON DELETE SET NULL,
    id_seance UUID REFERENCES seance(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'contribution',      -- Argent ENTRANT: Cotisation membre
        'credit_granted',    -- Argent SORTANT: Crédit accordé
        'credit_repayment',  -- Argent ENTRANT: Remboursement crédit
        'penalty',           -- Argent ENTRANT: Paiement pénalité
        'tour_distribution', -- Argent SORTANT: Distribution tour/gain
        'project_expense',   -- Argent SORTANT: Dépense projet
        'initial_funding',   -- Argent ENTRANT: Fonds initial
        'adjustment'         -- Ajustement manuel
    )),
    montant DECIMAL(12, 2) NOT NULL,  -- Positif = ENTRANT, Négatif = SORTANT
    description TEXT NOT NULL,
    
    -- Relations optionnelles vers les entités concernées
    id_credit UUID REFERENCES credit(id) ON DELETE CASCADE,
    id_penalite UUID REFERENCES penalite(id) ON DELETE CASCADE,
    id_tour UUID REFERENCES tour(id) ON DELETE CASCADE,
    id_projet UUID REFERENCES projet(id) ON DELETE CASCADE,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    created_by UUID,  -- ID de l'utilisateur qui a créé la transaction
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index pour recherches rapides
    CONSTRAINT check_montant CHECK (montant != 0)
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_transaction_tontine ON transaction(id_tontine);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON transaction(type);
CREATE INDEX IF NOT EXISTS idx_transaction_membre ON transaction(id_membre);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_credit ON transaction(id_credit);
CREATE INDEX IF NOT EXISTS idx_transaction_penalite ON transaction(id_penalite);

-- ============================================================================
-- ÉTAPE 2: Corriger les contraintes CASCADE incorrectes
-- ============================================================================

-- 2.1 CRÉDIT: Actuellement ON DELETE SET NULL → Doit être CASCADE
-- Quand on supprime une tontine, ses crédits doivent disparaître
ALTER TABLE credit 
DROP CONSTRAINT IF EXISTS credit_id_tontine_fkey;

ALTER TABLE credit 
ADD CONSTRAINT credit_id_tontine_fkey 
FOREIGN KEY (id_tontine) REFERENCES tontine(id) ON DELETE CASCADE;

-- 2.2 PÉNALITÉ: Actuellement ON DELETE SET NULL → Doit être CASCADE
-- Quand on supprime une tontine, ses pénalités doivent disparaître
ALTER TABLE penalite 
DROP CONSTRAINT IF EXISTS penalite_id_tontine_fkey;

ALTER TABLE penalite 
ADD CONSTRAINT penalite_id_tontine_fkey 
FOREIGN KEY (id_tontine) REFERENCES tontine(id) ON DELETE CASCADE;

-- Note: On garde ON DELETE SET NULL pour id_seance car une pénalité peut exister sans séance spécifique

-- 2.3 TOUR: Déjà CASCADE pour id_tontine ✓
-- Pas de modification nécessaire

-- ============================================================================
-- ÉTAPE 3: Fonction pour calculer le solde d'une tontine en temps réel
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_solde_tontine(id_tontine_param UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    solde DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(montant), 0)
    INTO solde
    FROM transaction
    WHERE id_tontine = id_tontine_param;
    
    RETURN solde;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 4: Fonction pour enregistrer automatiquement les transactions
-- ============================================================================

-- Trigger function: Enregistrer transaction lors d'une cotisation
CREATE OR REPLACE FUNCTION enregistrer_transaction_cotisation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transaction (
        id_tontine,
        id_membre,
        id_seance,
        type,
        montant,
        description
    ) VALUES (
        NEW.id_tontine,
        NEW.id_membre,
        NEW.id_seance,
        'contribution',
        NEW.montant,  -- Positif = argent qui ENTRE
        CONCAT('Cotisation session #', (SELECT numero_seance FROM seance WHERE id = NEW.id_seance))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les cotisations
DROP TRIGGER IF EXISTS trigger_cotisation_transaction ON cotisation;
CREATE TRIGGER trigger_cotisation_transaction
    AFTER INSERT ON cotisation
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_cotisation();

-- ============================================================================
-- ÉTAPE 5: Trigger pour transactions de pénalités
-- ============================================================================

CREATE OR REPLACE FUNCTION enregistrer_transaction_penalite()
RETURNS TRIGGER AS $$
BEGIN
    -- Seulement si le montant payé a augmenté
    IF (NEW.montant_paye > COALESCE(OLD.montant_paye, 0)) THEN
        INSERT INTO transaction (
            id_tontine,
            id_membre,
            id_penalite,
            type,
            montant,
            description
        ) VALUES (
            NEW.id_tontine,
            NEW.id_membre,
            NEW.id,
            'penalty',
            (NEW.montant_paye - COALESCE(OLD.montant_paye, 0)),  -- Montant du paiement
            CONCAT('Paiement pénalité: ', NEW.raison)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_penalite_transaction ON penalite;
CREATE TRIGGER trigger_penalite_transaction
    AFTER INSERT OR UPDATE ON penalite
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_penalite();

-- ============================================================================
-- ÉTAPE 6: Trigger pour transactions de crédits
-- ============================================================================

-- Transaction lors du décaissement du crédit
CREATE OR REPLACE FUNCTION enregistrer_transaction_credit_decaissement()
RETURNS TRIGGER AS $$
BEGIN
    -- Décaissement: argent qui SORT
    IF (NEW.statut = 'decaisse' AND OLD.statut != 'decaisse') THEN
        INSERT INTO transaction (
            id_tontine,
            id_membre,
            id_credit,
            type,
            montant,
            description
        ) VALUES (
            NEW.id_tontine,
            NEW.id_membre,
            NEW.id,
            'credit_granted',
            -NEW.montant,  -- NÉGATIF = argent qui SORT
            CONCAT('Décaissement crédit pour: ', COALESCE(NEW.objet, 'Non spécifié'))
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_credit_decaissement ON credit;
CREATE TRIGGER trigger_credit_decaissement
    AFTER UPDATE ON credit
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_credit_decaissement();

-- Note: Les remboursements sont gérés par la fonction rembourser_credit() qui crée déjà les transactions

-- ============================================================================
-- ÉTAPE 7: Trigger pour transactions de tours
-- ============================================================================

CREATE OR REPLACE FUNCTION enregistrer_transaction_tour()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transaction (
        id_tontine,
        id_membre,
        id_tour,
        type,
        montant,
        description
    ) VALUES (
        NEW.id_tontine,
        NEW.id_beneficiaire,
        NEW.id,
        'tour_distribution',
        -NEW.montant_distribue,  -- NÉGATIF = argent qui SORT
        CONCAT('Distribution tour #', NEW.numero, ' à ', (SELECT prenom || ' ' || nom FROM membre WHERE id = NEW.id_beneficiaire))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tour_transaction ON tour;
CREATE TRIGGER trigger_tour_transaction
    AFTER INSERT ON tour
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_tour();

-- ============================================================================
-- ÉTAPE 8: Vue pour faciliter les requêtes de transactions
-- ============================================================================

CREATE OR REPLACE VIEW v_transactions_enrichies AS
SELECT 
    t.id,
    t.id_tontine,
    ton.nom AS tontine_nom,
    t.type,
    t.montant,
    t.description,
    t.created_at,
    
    -- Informations membre
    t.id_membre,
    CASE 
        WHEN m.id IS NOT NULL THEN m.prenom || ' ' || m.nom
        ELSE NULL
    END AS membre_nom,
    
    -- Informations session
    t.id_seance,
    s.numero_seance,
    
    -- Informations crédit
    t.id_credit,
    
    -- Informations pénalité
    t.id_penalite,
    
    -- Informations tour
    t.id_tour,
    
    -- Informations projet
    t.id_projet,
    p.nom AS projet_nom,
    
    -- Métadonnées
    t.metadata
FROM transaction t
LEFT JOIN tontine ton ON t.id_tontine = ton.id
LEFT JOIN membre m ON t.id_membre = m.id
LEFT JOIN seance s ON t.id_seance = s.id
LEFT JOIN projet p ON t.id_projet = p.id
ORDER BY t.created_at DESC;

-- ============================================================================
-- ÉTAPE 9: Fonction pour obtenir le résumé financier d'une tontine
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tontine_financial_summary(id_tontine_param UUID)
RETURNS TABLE (
    solde_actuel DECIMAL(12, 2),
    total_entrees DECIMAL(12, 2),
    total_sorties DECIMAL(12, 2),
    total_cotisations DECIMAL(12, 2),
    total_penalites DECIMAL(12, 2),
    total_remboursements DECIMAL(12, 2),
    total_credits_decaisses DECIMAL(12, 2),
    total_tours_distribues DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Solde actuel
        COALESCE(SUM(t.montant), 0) AS solde_actuel,
        
        -- Total entrées
        COALESCE(SUM(CASE WHEN t.montant > 0 THEN t.montant ELSE 0 END), 0) AS total_entrees,
        
        -- Total sorties
        COALESCE(SUM(CASE WHEN t.montant < 0 THEN ABS(t.montant) ELSE 0 END), 0) AS total_sorties,
        
        -- Détails par type
        COALESCE(SUM(CASE WHEN t.type = 'contribution' THEN t.montant ELSE 0 END), 0) AS total_cotisations,
        COALESCE(SUM(CASE WHEN t.type = 'penalty' THEN t.montant ELSE 0 END), 0) AS total_penalites,
        COALESCE(SUM(CASE WHEN t.type = 'credit_repayment' THEN t.montant ELSE 0 END), 0) AS total_remboursements,
        COALESCE(SUM(CASE WHEN t.type = 'credit_granted' THEN ABS(t.montant) ELSE 0 END), 0) AS total_credits_decaisses,
        COALESCE(SUM(CASE WHEN t.type = 'tour_distribution' THEN ABS(t.montant) ELSE 0 END), 0) AS total_tours_distribues
    FROM transaction t
    WHERE t.id_tontine = id_tontine_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Commentaire explicatif
COMMENT ON TABLE transaction IS 'Traçabilité complète de tous les flux financiers. Montant positif = entrée, négatif = sortie. Suppression en cascade avec la tontine.';
COMMENT ON FUNCTION calculer_solde_tontine IS 'Calcule le solde actuel d''une tontine en additionnant toutes ses transactions';
COMMENT ON FUNCTION get_tontine_financial_summary IS 'Fournit un résumé financier complet d''une tontine avec détails par type de transaction';
COMMENT ON VIEW v_transactions_enrichies IS 'Vue enrichie des transactions avec toutes les informations liées (membre, séance, crédit, etc.)';
