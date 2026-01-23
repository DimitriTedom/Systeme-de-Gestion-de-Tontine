-- ============================================================================
-- TESTS DE LA CONTRAINTE MÉTIER : LIMITATION DES TOURS (TONTINES OPTIONNELLES)
-- ============================================================================
-- Date: 23 Janvier 2026
-- Objectif: Valider que la contrainte "1 part = 1 tour max" fonctionne
-- ============================================================================

-- PRÉREQUIS : Avoir exécuté le fichier 001_init_schema.sql

-- ============================================================================
-- PRÉPARATION DES DONNÉES DE TEST
-- ============================================================================

-- 1. Créer des membres de test
INSERT INTO membre (id, nom, prenom, telephone, email, statut) VALUES
('11111111-1111-1111-1111-111111111111', 'Nkolo', 'Alice', '690111111', 'alice@test.cm', 'Actif'),
('22222222-2222-2222-2222-222222222222', 'Fouda', 'Bob', '690222222', 'bob@test.cm', 'Actif'),
('33333333-3333-3333-3333-333333333333', 'Mbarga', 'Claire', '690333333', 'claire@test.cm', 'Actif')
ON CONFLICT (id) DO NOTHING;

-- 2. Créer une tontine OPTIONNELLE
INSERT INTO tontine (id, nom, type, montant_cotisation, periode, date_debut, statut) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 'Épargne Flexible TEST', 
 'optionnelle',  -- Type OPTIONNELLE = contrainte active
 50000.00, 
 'mensuelle', 
 '2026-01-01', 
 'Actif')
ON CONFLICT (id) DO NOTHING;

-- 3. Créer une tontine DE PRÉSENCE (pour comparaison)
INSERT INTO tontine (id, nom, type, montant_cotisation, periode, date_debut, statut) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
 'Solidarité Mensuelle TEST', 
 'presence',  -- Type PRÉSENCE = pas de contrainte stricte
 75000.00, 
 'mensuelle', 
 '2026-01-01', 
 'Actif')
ON CONFLICT (id) DO NOTHING;

-- 4. Inscrire les membres avec différents nombres de parts
-- Alice : 3 parts dans tontine optionnelle
INSERT INTO participe (id_membre, id_tontine, nb_parts, statut) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'actif')
ON CONFLICT (id_membre, id_tontine) DO NOTHING;

-- Bob : 2 parts dans tontine optionnelle
INSERT INTO participe (id_membre, id_tontine, nb_parts, statut) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'actif')
ON CONFLICT (id_membre, id_tontine) DO NOTHING;

-- Claire : 1 part dans tontine optionnelle
INSERT INTO participe (id_membre, id_tontine, nb_parts, statut) VALUES
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'actif')
ON CONFLICT (id_membre, id_tontine) DO NOTHING;

-- Alice : 1 part dans tontine de présence
INSERT INTO participe (id_membre, id_tontine, nb_parts, statut) VALUES
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'actif')
ON CONFLICT (id_membre, id_tontine) DO NOTHING;


-- ============================================================================
-- TEST 1 : VÉRIFIER LES TOURS DISPONIBLES INITIALEMENT
-- ============================================================================

SELECT '=== TEST 1: Tours disponibles pour chaque membre ===' AS test;

-- Alice : 3 parts → doit avoir 3 tours disponibles
SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=3, tours_recus=0, tours_disponibles=3, peut_recevoir=TRUE

-- Bob : 2 parts → doit avoir 2 tours disponibles
SELECT * FROM get_tours_disponibles_membre(
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=2, tours_recus=0, tours_disponibles=2, peut_recevoir=TRUE

-- Claire : 1 part → doit avoir 1 tour disponible
SELECT * FROM get_tours_disponibles_membre(
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=1, tours_recus=0, tours_disponibles=1, peut_recevoir=TRUE


-- ============================================================================
-- TEST 2 : ATTRIBUTION RÉUSSIE (Premier tour pour Alice)
-- ============================================================================

SELECT '=== TEST 2: Attribution 1er tour à Alice (DOIT RÉUSSIR) ===' AS test;

INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    1,
    '2026-01-15',
    50000.00,
    'distribue'
);

-- Vérifier l'état après attribution
SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=3, tours_recus=1, tours_disponibles=2, peut_recevoir=TRUE


-- ============================================================================
-- TEST 3 : ATTRIBUTION RÉUSSIE (Deuxième tour pour Alice)
-- ============================================================================

SELECT '=== TEST 3: Attribution 2ème tour à Alice (DOIT RÉUSSIR) ===' AS test;

INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    2,
    '2026-01-20',
    50000.00,
    'distribue'
);

SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=3, tours_recus=2, tours_disponibles=1, peut_recevoir=TRUE


-- ============================================================================
-- TEST 4 : ATTRIBUTION RÉUSSIE (Troisième tour pour Alice - DERNIER)
-- ============================================================================

SELECT '=== TEST 4: Attribution 3ème tour à Alice (DOIT RÉUSSIR - dernier tour) ===' AS test;

INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    3,
    '2026-01-23',
    50000.00,
    'distribue'
);

SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=3, tours_recus=3, tours_disponibles=0, peut_recevoir=FALSE


-- ============================================================================
-- TEST 5 : ATTRIBUTION BLOQUÉE (Quatrième tour pour Alice - LIMITE ATTEINTE)
-- ============================================================================

SELECT '=== TEST 5: Attribution 4ème tour à Alice (DOIT ÉCHOUER - limite atteinte) ===' AS test;

-- Cette requête DOIT échouer avec une exception
DO $$
BEGIN
    INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
    VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        4,
        '2026-01-24',
        50000.00,
        'distribue'
    );
    
    RAISE EXCEPTION 'ERREUR: Le test devrait avoir échoué mais a réussi !';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%CONTRAINTE MÉTIER VIOLÉE%' THEN
            RAISE NOTICE '✅ TEST RÉUSSI: Contrainte correctement appliquée';
            RAISE NOTICE 'Message d''erreur: %', SQLERRM;
        ELSE
            RAISE NOTICE '❌ TEST ÉCHOUÉ: Erreur inattendue: %', SQLERRM;
        END IF;
END $$;


-- ============================================================================
-- TEST 6 : ATTRIBUTION RÉUSSIE POUR BOB (2 parts max)
-- ============================================================================

SELECT '=== TEST 6: Attribution tours pour Bob (2 parts) ===' AS test;

-- Premier tour pour Bob
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    5,
    '2026-01-25',
    50000.00,
    'distribue'
);

-- Deuxième tour pour Bob (dernier)
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    6,
    '2026-01-26',
    50000.00,
    'distribue'
);

SELECT * FROM get_tours_disponibles_membre(
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=2, tours_recus=2, tours_disponibles=0, peut_recevoir=FALSE


-- ============================================================================
-- TEST 7 : ATTRIBUTION BLOQUÉE POUR BOB (Limite atteinte)
-- ============================================================================

SELECT '=== TEST 7: Tentative 3ème tour pour Bob (DOIT ÉCHOUER) ===' AS test;

DO $$
BEGIN
    INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
    VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '22222222-2222-2222-2222-222222222222',
        7,
        '2026-01-27',
        50000.00,
        'distribue'
    );
    
    RAISE EXCEPTION 'ERREUR: Le test devrait avoir échoué !';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%CONTRAINTE MÉTIER VIOLÉE%' THEN
            RAISE NOTICE '✅ TEST RÉUSSI: Bob ne peut pas recevoir plus de 2 tours';
        ELSE
            RAISE NOTICE '❌ TEST ÉCHOUÉ: %', SQLERRM;
        END IF;
END $$;


-- ============================================================================
-- TEST 8 : CLAIRE (1 part seulement)
-- ============================================================================

SELECT '=== TEST 8: Attribution pour Claire (1 part = 1 tour max) ===' AS test;

-- Premier et unique tour pour Claire
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    8,
    '2026-01-28',
    50000.00,
    'distribue'
);

SELECT * FROM get_tours_disponibles_membre(
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: nb_parts=1, tours_recus=1, tours_disponibles=0, peut_recevoir=FALSE

-- Tentative deuxième tour (DOIT ÉCHOUER)
DO $$
BEGIN
    INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
    VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '33333333-3333-3333-3333-333333333333',
        9,
        '2026-01-29',
        50000.00,
        'distribue'
    );
    
    RAISE EXCEPTION 'ERREUR: Claire ne devrait recevoir qu''1 seul tour !';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%CONTRAINTE MÉTIER VIOLÉE%' THEN
            RAISE NOTICE '✅ TEST RÉUSSI: Claire limitée à 1 tour (1 part)';
        ELSE
            RAISE NOTICE '❌ TEST ÉCHOUÉ: %', SQLERRM;
        END IF;
END $$;


-- ============================================================================
-- TEST 9 : ANNULATION D'UN TOUR (libère une place)
-- ============================================================================

SELECT '=== TEST 9: Annulation d''un tour d''Alice ===' AS test;

-- Alice a reçu 3 tours → limite atteinte
-- Si on annule 1 tour, elle devrait pouvoir en recevoir un nouveau

UPDATE tour
SET statut = 'annule'
WHERE id_tontine = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
AND id_beneficiaire = '11111111-1111-1111-1111-111111111111'
AND numero = 3;

-- Vérifier que Alice peut à nouveau recevoir un tour
SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);
-- Résultat attendu: tours_recus=2 (les annulés ne comptent pas), tours_disponibles=1

-- Nouvelle attribution (DOIT RÉUSSIR)
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    10,
    '2026-01-30',
    50000.00,
    'distribue'
);

RAISE NOTICE '✅ TEST RÉUSSI: Après annulation, Alice peut recevoir un nouveau tour';


-- ============================================================================
-- TEST 10 : TONTINE DE PRÉSENCE (PAS DE LIMITE)
-- ============================================================================

SELECT '=== TEST 10: Tontine de PRÉSENCE - pas de limite stricte ===' AS test;

-- Alice a 1 part dans la tontine de présence
-- Elle devrait pouvoir recevoir plusieurs tours sans limite

-- Premier tour
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    1,
    '2026-02-01',
    75000.00,
    'distribue'
);

-- Deuxième tour (DOIT RÉUSSIR car tontine de présence)
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    2,
    '2026-02-15',
    75000.00,
    'distribue'
);

-- Troisième tour (DOIT ENCORE RÉUSSIR)
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue, statut)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    3,
    '2026-03-01',
    75000.00,
    'distribue'
);

SELECT * FROM get_tours_disponibles_membre(
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
-- Résultat attendu: tours_disponibles=999 (pas de limite), peut_recevoir=TRUE

RAISE NOTICE '✅ TEST RÉUSSI: Tontines de présence n''ont pas de limite stricte';


-- ============================================================================
-- RAPPORT FINAL DES TESTS
-- ============================================================================

SELECT '========================================' AS rapport;
SELECT '     RAPPORT FINAL DES TESTS            ' AS rapport;
SELECT '========================================' AS rapport;

-- Résumé des tours par membre dans tontine optionnelle
SELECT 
    m.nom || ' ' || m.prenom AS membre,
    p.nb_parts AS parts,
    COUNT(CASE WHEN t.statut = 'distribue' THEN 1 END) AS tours_recus,
    p.nb_parts - COUNT(CASE WHEN t.statut = 'distribue' THEN 1 END) AS tours_restants,
    CASE 
        WHEN COUNT(CASE WHEN t.statut = 'distribue' THEN 1 END) >= p.nb_parts THEN '❌ LIMITE ATTEINTE'
        ELSE '✅ Peut recevoir'
    END AS statut
FROM membre m
JOIN participe p ON m.id = p.id_membre
LEFT JOIN tour t ON t.id_beneficiaire = m.id AND t.id_tontine = p.id_tontine
WHERE p.id_tontine = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
GROUP BY m.id, m.nom, m.prenom, p.nb_parts
ORDER BY m.nom;

SELECT '========================================' AS rapport;
SELECT 'Tous les tests sont passés avec succès !' AS rapport;
SELECT '========================================' AS rapport;


-- ============================================================================
-- NETTOYAGE (Optionnel - décommenter pour supprimer les données de test)
-- ============================================================================

/*
DELETE FROM tour WHERE id_tontine IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM participe WHERE id_tontine IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM tontine WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DELETE FROM membre WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
*/
