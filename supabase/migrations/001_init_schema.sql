-- ============================================================================
-- NJANGITECH - MIGRATION VERS SUPABASE
-- Script SQL complet pour PostgreSQL
-- Tables, Contraintes, Fonctions RPC, et Politiques RLS
-- ============================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CRÉATION DES TABLES
-- ============================================================================

-- Table MEMBRE
CREATE TABLE IF NOT EXISTS membre (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    adresse VARCHAR(255),
    commune VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'Suspendu')),
    date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table TONTINE
CREATE TABLE IF NOT EXISTS tontine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('presence', 'optionnelle')),
    montant_cotisation DECIMAL(12, 2) NOT NULL CHECK (montant_cotisation > 0),
    periode VARCHAR(50) NOT NULL CHECK (periode IN ('hebdomadaire', 'bimensuelle', 'mensuelle')),
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Terminée', 'Annulée')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Table PARTICIPE (Association Many-to-Many: Membre <-> Tontine)
CREATE TABLE IF NOT EXISTS participe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_membre UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    nb_parts INTEGER DEFAULT 1 CHECK (nb_parts >= 1),
    date_adhesion DATE NOT NULL DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_membre, id_tontine)
);

-- Table SEANCE
CREATE TABLE IF NOT EXISTS seance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    numero_seance INTEGER NOT NULL,
    date DATE NOT NULL,
    lieu VARCHAR(255),
    ordre_du_jour TEXT,
    notes TEXT,
    statut VARCHAR(50) DEFAULT 'programmee' 
        CHECK (statut IN ('programmee', 'en_cours', 'terminee', 'annulee')),
    total_cotisations DECIMAL(12, 2) DEFAULT 0,
    total_penalites DECIMAL(12, 2) DEFAULT 0,
    nombre_presents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table COTISATION
CREATE TABLE IF NOT EXISTS cotisation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_membre UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    id_seance UUID NOT NULL REFERENCES seance(id) ON DELETE CASCADE,
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL CHECK (montant >= 0),
    montant_attendu DECIMAL(12, 2) NOT NULL,
    date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
    methode_paiement VARCHAR(50) DEFAULT 'especes' 
        CHECK (methode_paiement IN ('especes', 'virement', 'mobile_money')),
    statut VARCHAR(20) DEFAULT 'complete' 
        CHECK (statut IN ('en_attente', 'partiel', 'complete', 'en_retard')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_membre, id_seance)
);

-- Table CREDIT
CREATE TABLE IF NOT EXISTS credit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_membre UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    id_tontine UUID REFERENCES tontine(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL CHECK (montant > 0),
    solde DECIMAL(12, 2) NOT NULL,
    taux_interet DECIMAL(5, 2) DEFAULT 0 CHECK (taux_interet >= 0),
    objet VARCHAR(255),
    date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
    date_decaissement DATE,
    date_remboursement_prevue DATE NOT NULL,
    montant_rembourse DECIMAL(12, 2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'en_attente' 
        CHECK (statut IN ('en_attente', 'approuve', 'decaisse', 'en_cours', 'rembourse', 'en_retard', 'defaut')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_solde CHECK (solde <= montant * (1 + taux_interet / 100))
);

-- Table PENALITE
CREATE TABLE IF NOT EXISTS penalite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_membre UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    id_seance UUID REFERENCES seance(id) ON DELETE SET NULL,
    id_tontine UUID REFERENCES tontine(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL CHECK (montant >= 0),
    montant_paye DECIMAL(12, 2) DEFAULT 0 CHECK (montant_paye >= 0),
    raison VARCHAR(255) NOT NULL,
    type_penalite VARCHAR(50) DEFAULT 'autre' 
        CHECK (type_penalite IN ('absence', 'retard_cotisation', 'mauvaise_conduite', 'autre')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    date_paiement DATE,
    statut VARCHAR(20) DEFAULT 'non_paye' 
        CHECK (statut IN ('non_paye', 'paye', 'partiellement_paye', 'annule')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table TOUR (Attribution des gains)
CREATE TABLE IF NOT EXISTS tour (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    id_seance UUID REFERENCES seance(id) ON DELETE SET NULL,
    id_beneficiaire UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    date DATE NOT NULL,
    montant_distribue DECIMAL(12, 2) NOT NULL CHECK (montant_distribue >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_tontine, numero)
);

-- Table PROJET
CREATE TABLE IF NOT EXISTS projet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    id_responsable UUID REFERENCES membre(id) ON DELETE SET NULL,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    budget DECIMAL(12, 2) NOT NULL CHECK (budget >= 0),
    montant_alloue DECIMAL(12, 2) DEFAULT 0,
    date_debut DATE NOT NULL,
    date_cible DATE,
    date_fin_reelle DATE,
    statut VARCHAR(50) DEFAULT 'planifie' 
        CHECK (statut IN ('planifie', 'collecte_fonds', 'en_cours', 'termine', 'annule')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table PRESENCE (pour suivre la présence à chaque séance)
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_membre UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    id_seance UUID NOT NULL REFERENCES seance(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT FALSE,
    heure_arrivee TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_membre, id_seance)
);

-- Table TRANSACTION (traçabilité financière complète)
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
    montant DECIMAL(12, 2) NOT NULL CHECK (montant != 0),  -- Positif = ENTRANT, Négatif = SORTANT
    description TEXT NOT NULL,
    
    -- Relations optionnelles vers les entités concernées
    id_credit UUID REFERENCES credit(id) ON DELETE CASCADE,
    id_penalite UUID REFERENCES penalite(id) ON DELETE CASCADE,
    id_tour UUID REFERENCES tour(id) ON DELETE CASCADE,
    id_projet UUID REFERENCES projet(id) ON DELETE CASCADE,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: INDEX POUR OPTIMISATION DES REQUÊTES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_membre_statut ON membre(statut);
CREATE INDEX IF NOT EXISTS idx_membre_email ON membre(email);

CREATE INDEX IF NOT EXISTS idx_tontine_statut ON tontine(statut);
CREATE INDEX IF NOT EXISTS idx_tontine_type ON tontine(type);

CREATE INDEX IF NOT EXISTS idx_participe_membre ON participe(id_membre);
CREATE INDEX IF NOT EXISTS idx_participe_tontine ON participe(id_tontine);

CREATE INDEX IF NOT EXISTS idx_seance_tontine ON seance(id_tontine);
CREATE INDEX IF NOT EXISTS idx_seance_date ON seance(date);
CREATE INDEX IF NOT EXISTS idx_seance_statut ON seance(statut);

CREATE INDEX IF NOT EXISTS idx_cotisation_membre ON cotisation(id_membre);
CREATE INDEX IF NOT EXISTS idx_cotisation_seance ON cotisation(id_seance);
CREATE INDEX IF NOT EXISTS idx_cotisation_tontine ON cotisation(id_tontine);

CREATE INDEX IF NOT EXISTS idx_credit_membre ON credit(id_membre);
CREATE INDEX IF NOT EXISTS idx_credit_statut ON credit(statut);

CREATE INDEX IF NOT EXISTS idx_penalite_membre ON penalite(id_membre);
CREATE INDEX IF NOT EXISTS idx_penalite_seance ON penalite(id_seance);
CREATE INDEX IF NOT EXISTS idx_penalite_statut ON penalite(statut);

CREATE INDEX IF NOT EXISTS idx_tour_tontine ON tour(id_tontine);
CREATE INDEX IF NOT EXISTS idx_tour_beneficiaire ON tour(id_beneficiaire);

CREATE INDEX IF NOT EXISTS idx_projet_tontine ON projet(id_tontine);
CREATE INDEX IF NOT EXISTS idx_projet_statut ON projet(statut);

CREATE INDEX IF NOT EXISTS idx_presence_seance ON presence(id_seance);
CREATE INDEX IF NOT EXISTS idx_presence_membre ON presence(id_membre);

CREATE INDEX IF NOT EXISTS idx_transaction_tontine ON transaction(id_tontine);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON transaction(type);
CREATE INDEX IF NOT EXISTS idx_transaction_membre ON transaction(id_membre);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_credit ON transaction(id_credit);
CREATE INDEX IF NOT EXISTS idx_transaction_penalite ON transaction(id_penalite);

-- ============================================================================
-- SECTION 3: FONCTIONS TRIGGERS POUR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables avec updated_at
CREATE TRIGGER update_membre_updated_at
    BEFORE UPDATE ON membre
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tontine_updated_at
    BEFORE UPDATE ON tontine
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seance_updated_at
    BEFORE UPDATE ON seance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cotisation_updated_at
    BEFORE UPDATE ON cotisation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_updated_at
    BEFORE UPDATE ON credit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalite_updated_at
    BEFORE UPDATE ON penalite
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_updated_at
    BEFORE UPDATE ON tour
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projet_updated_at
    BEFORE UPDATE ON projet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 4: FONCTIONS RPC POUR LA LOGIQUE MÉTIER
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FONCTION: cloturer_seance
-- Description: Clôture une séance et crée automatiquement les pénalités
--              pour les membres absents (si tontine de type 'presence')
-- Pénalité = montant_cotisation + 50% du montant_cotisation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cloturer_seance(
    id_seance_param UUID,
    montant_penalite_absence DECIMAL DEFAULT 5000.00
)
RETURNS JSON AS $$
DECLARE
    v_tontine_id UUID;
    v_tontine_type VARCHAR(50);
    v_montant_cotisation DECIMAL(12, 2);
    v_montant_penalite_calcule DECIMAL(12, 2);
    v_total_cotisations DECIMAL(12, 2);
    v_total_penalites DECIMAL(12, 2);
    v_nombre_presents INTEGER;
    v_penalites_creees JSON;
    v_membre_record RECORD;
    v_seance_date DATE;
BEGIN
    -- 1. Vérifier que la séance existe et n'est pas déjà clôturée
    SELECT s.id_tontine, s.date, t.type, t.montant_cotisation
    INTO v_tontine_id, v_seance_date, v_tontine_type, v_montant_cotisation
    FROM seance s
    JOIN tontine t ON s.id_tontine = t.id
    WHERE s.id = id_seance_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Séance non trouvée: %', id_seance_param;
    END IF;
    
    -- Calculer le montant de pénalité: cotisation + 50%
    v_montant_penalite_calcule := v_montant_cotisation * 1.5;

    -- 2. Compter les présents
    SELECT COUNT(*)
    INTO v_nombre_presents
    FROM presence
    WHERE id_seance = id_seance_param AND present = TRUE;

    -- 3. Calculer le total des cotisations
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total_cotisations
    FROM cotisation
    WHERE id_seance = id_seance_param;

    -- 4. Si la tontine est de type 'presence', créer les pénalités pour absents
    IF v_tontine_type = 'presence' THEN
        -- Créer des pénalités pour chaque membre absent
        FOR v_membre_record IN
            SELECT p.id_membre, m.nom, m.prenom
            FROM participe p
            JOIN membre m ON p.id_membre = m.id
            WHERE p.id_tontine = v_tontine_id
              AND p.statut = 'actif'
              AND p.id_membre NOT IN (
                  SELECT pr.id_membre
                  FROM presence pr
                  WHERE pr.id_seance = id_seance_param AND pr.present = TRUE
              )
        LOOP
            -- Insérer la pénalité d'absence (cotisation + 50%)
            INSERT INTO penalite (
                id_membre, id_seance, id_tontine, montant, raison, 
                type_penalite, date, statut
            )
            VALUES (
                v_membre_record.id_membre,
                id_seance_param,
                v_tontine_id,
                v_montant_penalite_calcule,
                'Absence à la séance du ' || v_seance_date::TEXT || ' - Pénalité: cotisation + 50%',
                'absence',
                v_seance_date,
                'non_paye'
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    -- 5. Calculer le total des pénalités pour cette séance
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total_penalites
    FROM penalite
    WHERE id_seance = id_seance_param;

    -- 6. Récupérer les pénalités créées pour le retour
    SELECT json_agg(json_build_object(
        'id_membre', p.id_membre,
        'nom', m.nom,
        'prenom', m.prenom,
        'montant', p.montant,
        'raison', p.raison
    ))
    INTO v_penalites_creees
    FROM penalite p
    JOIN membre m ON p.id_membre = m.id
    WHERE p.id_seance = id_seance_param;

    -- 7. Mettre à jour la séance
    UPDATE seance
    SET statut = 'terminee',
        total_cotisations = v_total_cotisations,
        total_penalites = v_total_penalites,
        nombre_presents = v_nombre_presents,
        updated_at = NOW()
    WHERE id = id_seance_param;

    -- 8. Retourner le résumé
    RETURN json_build_object(
        'id_seance', id_seance_param,
        'statut', 'terminee',
        'total_cotisations', v_total_cotisations,
        'total_penalites', v_total_penalites,
        'nombre_presents', v_nombre_presents,
        'penalites_creees', COALESCE(v_penalites_creees, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FONCTION: attribuer_gain
-- Description: Attribue le gain d'une séance à un membre bénéficiaire
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION attribuer_gain(
    id_seance_param UUID,
    id_membre_param UUID
)
RETURNS JSON AS $$
DECLARE
    v_tontine_id UUID;
    v_seance_date DATE;
    v_total_cotisations DECIMAL(12, 2);
    v_numero_tour INTEGER;
    v_tour_id UUID;
BEGIN
    -- 1. Récupérer les infos de la séance
    SELECT id_tontine, date
    INTO v_tontine_id, v_seance_date
    FROM seance
    WHERE id = id_seance_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Séance non trouvée: %', id_seance_param;
    END IF;

    -- 2. Vérifier que le membre participe à cette tontine
    IF NOT EXISTS (
        SELECT 1 FROM participe
        WHERE id_membre = id_membre_param 
          AND id_tontine = v_tontine_id
          AND statut = 'actif'
    ) THEN
        RAISE EXCEPTION 'Le membre % ne participe pas à cette tontine', id_membre_param;
    END IF;

    -- 3. Calculer le total des cotisations de la séance
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total_cotisations
    FROM cotisation
    WHERE id_seance = id_seance_param;

    -- 4. Déterminer le numéro du tour
    SELECT COALESCE(MAX(numero), 0) + 1
    INTO v_numero_tour
    FROM tour
    WHERE id_tontine = v_tontine_id;

    -- 5. Créer l'entrée dans tour
    INSERT INTO tour (
        id_tontine, id_seance, id_beneficiaire, numero, date, montant_distribue
    )
    VALUES (
        v_tontine_id, id_seance_param, id_membre_param, v_numero_tour, 
        v_seance_date, v_total_cotisations
    )
    RETURNING id INTO v_tour_id;

    -- 6. Retourner le résumé
    RETURN json_build_object(
        'id_tour', v_tour_id,
        'id_seance', id_seance_param,
        'id_beneficiaire', id_membre_param,
        'numero_tour', v_numero_tour,
        'montant_distribue', v_total_cotisations,
        'date', v_seance_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FONCTION: enregistrer_presence_et_cotisation
-- Description: Enregistre la présence et la cotisation d'un membre en une
--              seule transaction (utilisé par la feuille de séance)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enregistrer_presence_et_cotisation(
    id_seance_param UUID,
    id_membre_param UUID,
    est_present BOOLEAN,
    montant_paye DECIMAL DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_tontine_id UUID;
    v_montant_attendu DECIMAL(12, 2);
    v_nb_parts INTEGER;
BEGIN
    -- 1. Récupérer les infos de la séance et la tontine
    SELECT s.id_tontine, t.montant_cotisation
    INTO v_tontine_id, v_montant_attendu
    FROM seance s
    JOIN tontine t ON s.id_tontine = t.id
    WHERE s.id = id_seance_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Séance non trouvée: %', id_seance_param;
    END IF;

    -- 2. Récupérer le nombre de parts du membre
    SELECT nb_parts
    INTO v_nb_parts
    FROM participe
    WHERE id_membre = id_membre_param AND id_tontine = v_tontine_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Le membre ne participe pas à cette tontine';
    END IF;

    -- 3. Calculer le montant attendu selon le nombre de parts
    v_montant_attendu := v_montant_attendu * v_nb_parts;

    -- 4. Upsert présence
    INSERT INTO presence (id_membre, id_seance, present, heure_arrivee)
    VALUES (id_membre_param, id_seance_param, est_present, 
            CASE WHEN est_present THEN NOW() ELSE NULL END)
    ON CONFLICT (id_membre, id_seance)
    DO UPDATE SET present = EXCLUDED.present, 
                  heure_arrivee = EXCLUDED.heure_arrivee;

    -- 5. Upsert cotisation si un montant est payé
    IF montant_paye > 0 THEN
        INSERT INTO cotisation (
            id_membre, id_seance, id_tontine, montant, montant_attendu, 
            date_paiement, statut
        )
        VALUES (
            id_membre_param, id_seance_param, v_tontine_id, montant_paye,
            v_montant_attendu, CURRENT_DATE,
            CASE 
                WHEN montant_paye >= v_montant_attendu THEN 'complete'
                ELSE 'partiel'
            END
        )
        ON CONFLICT (id_membre, id_seance)
        DO UPDATE SET montant = EXCLUDED.montant,
                      statut = EXCLUDED.statut,
                      updated_at = NOW();
    END IF;

    -- 6. Retourner confirmation
    RETURN json_build_object(
        'success', TRUE,
        'id_membre', id_membre_param,
        'present', est_present,
        'montant_paye', montant_paye,
        'montant_attendu', v_montant_attendu
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FONCTION: get_statistiques_dashboard
-- Description: Récupère toutes les statistiques pour le tableau de bord
-- Utilise la table transaction pour un calcul précis de la caisse
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_statistiques_dashboard()
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        -- Statistiques membres
        'total_membres', (SELECT COUNT(*) FROM membre WHERE statut = 'Actif'),
        
        -- Statistiques tontines
        'total_tontines', (SELECT COUNT(*) FROM tontine WHERE statut = 'Actif'),
        
        -- Caisse TOTALE (somme de toutes les transactions de toutes les tontines actives)
        -- Positif = entrée, Négatif = sortie
        'caisse', (
            SELECT COALESCE(SUM(t.montant), 0) 
            FROM transaction t
            JOIN tontine ton ON t.id_tontine = ton.id
            WHERE ton.statut = 'Actif'
        ),
        
        -- Caisse GLOBALE (toutes tontines confondues, même terminées)
        'cash_in_hand', (
            SELECT COALESCE(SUM(montant), 0) 
            FROM transaction
        ),
        
        -- Crédits actifs
        'credits_actifs', (
            SELECT COUNT(*) FROM credit 
            WHERE statut IN ('decaisse', 'en_cours')
        ),
        'montant_credits_actifs', (
            SELECT COALESCE(SUM(solde), 0) FROM credit 
            WHERE statut IN ('decaisse', 'en_cours')
        ),
        
        -- Pénalités
        'penalites_non_payees', (
            SELECT COUNT(*) FROM penalite 
            WHERE statut = 'non_paye'
        ),
        'montant_penalites_non_payees', (
            SELECT COALESCE(SUM(montant), 0) FROM penalite 
            WHERE statut = 'non_paye'
        ),
        
        -- Projets
        'projets_actifs', (
            SELECT COUNT(*) FROM projet 
            WHERE statut IN ('planifie', 'collecte_fonds', 'en_cours')
        ),
        
        -- Statistiques de transactions (pour vérification)
        'total_entrees', (
            SELECT COALESCE(SUM(montant), 0) 
            FROM transaction 
            WHERE montant > 0
        ),
        'total_sorties', (
            SELECT COALESCE(ABS(SUM(montant)), 0) 
            FROM transaction 
            WHERE montant < 0
        ),
        
        -- Cotisations totales (legacy - pour compatibilité)
        'total_cotisations', (
            SELECT COALESCE(SUM(montant), 0) FROM cotisation
        ),
        
        -- Tours distribués (legacy - pour compatibilité)
        'total_tours', (
            SELECT COALESCE(SUM(montant_distribue), 0) FROM tour
        ),
        
        -- Dernières séances
        'dernieres_seances', (
            SELECT json_agg(s ORDER BY s.date DESC)
            FROM (
                SELECT id, date, lieu, statut, total_cotisations
                FROM seance
                ORDER BY date DESC
                LIMIT 5
            ) s
        ),
        
        -- Membres actifs vs total
        'active_members', (SELECT COUNT(*) FROM membre WHERE statut = 'Actif'),
        'total_members', (SELECT COUNT(*) FROM membre)
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FONCTION: get_membres_seance
-- Description: Récupère les membres pour la feuille de séance avec leurs
--              informations de participation et cotisation attendue
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_membres_seance(id_seance_param UUID)
RETURNS TABLE (
    id_membre UUID,
    nom TEXT,
    prenom TEXT,
    email TEXT,
    telephone TEXT,
    nb_parts INTEGER,
    montant_attendu NUMERIC,
    expected_contribution NUMERIC,
    present BOOLEAN,
    montant_paye NUMERIC,
    montant_cotise NUMERIC,
    deja_cotise BOOLEAN,
    statut_cotisation TEXT,
    penalites_impayees NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS id_membre,
        m.nom::TEXT,
        m.prenom::TEXT,
        m.email::TEXT,
        m.telephone::TEXT,
        p.nb_parts,
        (t.montant_cotisation * p.nb_parts) AS montant_attendu,
        (t.montant_cotisation * p.nb_parts) AS expected_contribution,
        COALESCE(pr.present, FALSE) AS present,
        COALESCE(c.montant, 0) AS montant_paye,
        COALESCE(c.montant, 0) AS montant_cotise,
        COALESCE(pr.present, FALSE) AS deja_cotise,
        c.statut::TEXT AS statut_cotisation,
        COALESCE(pen_sum.total, 0) AS penalites_impayees
    FROM seance s
    JOIN tontine t ON s.id_tontine = t.id
    JOIN participe p ON p.id_tontine = t.id AND p.statut = 'actif'
    JOIN membre m ON p.id_membre = m.id
    LEFT JOIN presence pr ON pr.id_membre = m.id AND pr.id_seance = s.id
    LEFT JOIN cotisation c ON c.id_membre = m.id AND c.id_seance = s.id
    LEFT JOIN LATERAL (
        SELECT SUM(pen.montant) AS total
        FROM penalite pen
        WHERE pen.id_membre = m.id AND pen.statut = 'non_paye'
    ) pen_sum ON TRUE
    WHERE s.id = id_seance_param
    ORDER BY m.nom, m.prenom;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- FONCTION: calculer_solde_tontine
-- Description: Calcule le solde d'une tontine en temps réel en additionnant
--              toutes ses transactions (positif = entrée, négatif = sortie)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- FONCTION: get_tontine_financial_summary
-- Description: Fournit un résumé financier complet d'une tontine avec détails
--              par type de transaction
-- ----------------------------------------------------------------------------
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
-- SECTION 5: TRIGGERS AUTOMATIQUES POUR TRANSACTIONS
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
        NEW.montant,
        CONCAT('Cotisation session #', (SELECT numero_seance FROM seance WHERE id = NEW.id_seance))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cotisation_transaction ON cotisation;
CREATE TRIGGER trigger_cotisation_transaction
    AFTER INSERT ON cotisation
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_cotisation();

-- Trigger function: Enregistrer transaction lors du paiement d'une pénalité
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
            (NEW.montant_paye - COALESCE(OLD.montant_paye, 0)),
            CONCAT('Paiement pénalité: ', NEW.raison)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_penalite_transaction ON penalite;
CREATE TRIGGER trigger_penalite_transaction
    AFTER INSERT OR UPDATE ON penalite
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_penalite();

-- Trigger function: Enregistrer transaction lors du décaissement d'un crédit
CREATE OR REPLACE FUNCTION enregistrer_transaction_credit_decaissement()
RETURNS TRIGGER AS $$
BEGIN
    -- Décaissement: argent qui SORT
    IF (NEW.statut = 'decaisse' AND (OLD.statut IS NULL OR OLD.statut != 'decaisse')) THEN
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
            -NEW.montant,
            CONCAT('Décaissement crédit pour: ', COALESCE(NEW.objet, 'Non spécifié'))
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_credit_decaissement ON credit;
CREATE TRIGGER trigger_credit_decaissement
    AFTER INSERT OR UPDATE ON credit
    FOR EACH ROW
    EXECUTE FUNCTION enregistrer_transaction_credit_decaissement();

-- Trigger function: Enregistrer transaction lors de la distribution d'un tour
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
        -NEW.montant_distribue,
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
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE membre ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine ENABLE ROW LEVEL SECURITY;
ALTER TABLE participe ENABLE ROW LEVEL SECURITY;
ALTER TABLE seance ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalite ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;

-- Politique: Seul l'utilisateur authentifié (administrateur) a accès complet
-- Cette politique est idéale pour un admin unique

-- MEMBRE
CREATE POLICY "Admin full access on membre" ON membre
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- TONTINE
CREATE POLICY "Admin full access on tontine" ON tontine
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- PARTICIPE
CREATE POLICY "Admin full access on participe" ON participe
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- SEANCE
CREATE POLICY "Admin full access on seance" ON seance
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- COTISATION
CREATE POLICY "Admin full access on cotisation" ON cotisation
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- CREDIT
CREATE POLICY "Admin full access on credit" ON credit
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- PENALITE
CREATE POLICY "Admin full access on penalite" ON penalite
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- TOUR
CREATE POLICY "Admin full access on tour" ON tour
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- PROJET
CREATE POLICY "Admin full access on projet" ON projet
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- PRESENCE
CREATE POLICY "Admin full access on presence" ON presence
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- TRANSACTION
CREATE POLICY "Admin full access on transaction" ON transaction
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================================
-- SECTION 7: VUES UTILES
-- ============================================================================

-- Vue: Transactions enrichies avec toutes les informations liées
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

-- Vue: Synthèse des membres avec leurs statistiques
CREATE OR REPLACE VIEW v_membre_synthese AS
SELECT 
    m.id,
    m.nom,
    m.prenom,
    m.email,
    m.telephone,
    m.statut,
    COUNT(DISTINCT p.id_tontine) AS nombre_tontines,
    COALESCE(SUM(c.montant), 0) AS total_cotisations,
    (SELECT COALESCE(SUM(pen.montant), 0) 
     FROM penalite pen 
     WHERE pen.id_membre = m.id AND pen.statut = 'non_paye') AS penalites_impayees,
    (SELECT COUNT(*) 
     FROM credit cr 
     WHERE cr.id_membre = m.id AND cr.statut IN ('decaisse', 'en_cours')) AS credits_actifs
FROM membre m
LEFT JOIN participe p ON m.id = p.id_membre
LEFT JOIN cotisation c ON m.id = c.id_membre
GROUP BY m.id;

-- Vue: Synthèse des tontines
CREATE OR REPLACE VIEW v_tontine_synthese AS
SELECT 
    t.id,
    t.nom,
    t.type,
    t.montant_cotisation,
    t.periode,
    t.statut,
    COUNT(DISTINCT p.id_membre) AS nombre_membres,
    COUNT(DISTINCT s.id) AS nombre_seances,
    COALESCE(SUM(c.montant), 0) AS total_cotisations,
    (SELECT COUNT(*) FROM tour tr WHERE tr.id_tontine = t.id) AS tours_effectues
FROM tontine t
LEFT JOIN participe p ON t.id = p.id_tontine AND p.statut = 'actif'
LEFT JOIN seance s ON t.id = s.id_tontine
LEFT JOIN cotisation c ON t.id = c.id_tontine
GROUP BY t.id;

-- ============================================================================
-- SECTION 8: FONCTIONS RPC POUR GESTION DES CRÉDITS
-- ============================================================================

-- FONCTION: verifier_credit_actif
-- Description: Vérifie si un membre a un crédit actif (en_cours, decaisse, en_retard)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verifier_credit_actif(id_membre_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_active_credit BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM credit 
        WHERE id_membre = id_membre_param 
        AND statut IN ('en_cours', 'decaisse', 'en_retard', 'approuve')
    ) INTO v_has_active_credit;
    
    RETURN v_has_active_credit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION: mettre_a_jour_credits_en_retard
-- Description: Met à jour automatiquement les crédits dont la date de remboursement est dépassée
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mettre_a_jour_credits_en_retard()
RETURNS TABLE (
    credits_mis_a_jour INTEGER,
    liste_credits_retard JSON
) AS $$
DECLARE
    v_count INTEGER;
    v_credits JSON;
BEGIN
    -- Mettre à jour les crédits en retard
    WITH updated AS (
        UPDATE credit
        SET statut = 'en_retard',
            updated_at = NOW()
        WHERE statut IN ('en_cours', 'decaisse')
        AND date_remboursement_prevue < CURRENT_DATE
        AND solde > 0
        RETURNING id, id_membre, montant, solde, date_remboursement_prevue
    )
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(json_agg(json_build_object(
            'id', id,
            'id_membre', id_membre,
            'montant', montant,
            'solde', solde,
            'date_remboursement_prevue', date_remboursement_prevue
        )), '[]'::json)
    INTO v_count, v_credits
    FROM updated;
    
    RETURN QUERY SELECT v_count, v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION: rembourser_credit (Version corrigée - 2026-01-22)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rembourser_credit(UUID, NUMERIC) IS 
'Traite un remboursement de crédit (partiel ou total). 
Gère les transitions de statut: decaisse → en_cours → rembourse.
Préserve les statuts en_retard et defaut jusqu''au remboursement complet.';

-- ----------------------------------------------------------------------------
-- FONCTION: payer_penalite
-- Description: Enregistre un paiement partiel ou total d'une pénalité
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION payer_penalite(
    id_penalite_param UUID,
    montant_paye NUMERIC
)
RETURNS TABLE(
    montant_total NUMERIC,
    montant_paye_total NUMERIC,
    montant_restant NUMERIC,
    statut TEXT,
    est_paye_complet BOOLEAN
) AS $$
DECLARE
    v_penalite RECORD;
    v_nouveau_montant_paye NUMERIC;
    v_montant_restant NUMERIC;
    v_nouveau_statut TEXT;
BEGIN
    -- Récupérer la pénalité
    SELECT * INTO v_penalite FROM penalite WHERE penalite.id = id_penalite_param;
    
    IF v_penalite IS NULL THEN
        RAISE EXCEPTION 'Pénalité non trouvée';
    END IF;
    
    -- Vérifier que la pénalité n'est pas annulée
    IF v_penalite.statut = 'annule' THEN
        RAISE EXCEPTION 'Impossible de payer une pénalité annulée';
    END IF;
    
    -- Calculer les nouvelles valeurs
    v_nouveau_montant_paye := COALESCE(v_penalite.montant_paye, 0) + montant_paye;
    
    -- Ne pas dépasser le montant total
    IF v_nouveau_montant_paye > v_penalite.montant THEN
        v_nouveau_montant_paye := v_penalite.montant;
    END IF;
    
    v_montant_restant := v_penalite.montant - v_nouveau_montant_paye;
    
    -- Déterminer le nouveau statut
    IF v_montant_restant = 0 THEN
        v_nouveau_statut := 'paye';
    ELSIF v_nouveau_montant_paye > 0 THEN
        v_nouveau_statut := 'partiellement_paye';
    ELSE
        v_nouveau_statut := 'non_paye';
    END IF;
    
    -- Mettre à jour la pénalité
    UPDATE penalite
    SET 
        montant_paye = v_nouveau_montant_paye,
        statut = v_nouveau_statut,
        date_paiement = CASE 
            WHEN v_nouveau_statut = 'paye' THEN CURRENT_DATE
            ELSE date_paiement
        END,
        updated_at = NOW()
    WHERE penalite.id = id_penalite_param;
    
    -- Retourner les informations de la pénalité mise à jour
    RETURN QUERY
    SELECT 
        v_penalite.montant,
        v_nouveau_montant_paye,
        v_montant_restant,
        v_nouveau_statut,
        (v_montant_restant = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 9: DONNÉES DE TEST (Optionnel - à supprimer en production)
-- ============================================================================

-- Décommenter pour insérer des données de test
/*
INSERT INTO membre (nom, prenom, telephone, email, adresse, commune, statut) VALUES
('Tedom', 'Dimitri', '690123456', 'dimitri@example.com', 'Rue 123', 'Yaoundé 1', 'Actif'),
('Nkoulou', 'Marie', '677889900', 'marie@example.com', 'Avenue 456', 'Yaoundé 3', 'Actif'),
('Fouda', 'Jean', '655443322', 'jean@example.com', 'Boulevard 789', 'Yaoundé 5', 'Actif');

INSERT INTO tontine (nom, type, montant_cotisation, periode, description, date_debut, statut) VALUES
('Tontine Solidarité', 'presence', 10000.00, 'mensuelle', 'Tontine mensuelle avec présence obligatoire', '2025-01-01', 'Actif'),
('Épargne Familiale', 'optionnelle', 5000.00, 'hebdomadaire', 'Épargne hebdomadaire flexible', '2025-01-01', 'Actif');
*/

-- ============================================================================
-- FIN DU SCRIPT DE MIGRATION
-- ============================================================================
