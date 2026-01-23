# 🔒 CHANGELOG - Contrainte Métier : Limitation des Tours

**Date :** 23 Janvier 2026  
**Version :** 1.0.0  
**Statut :** ✅ Implémenté et Testé

---

## 📋 Problème Identifié

### Comportement Incorrect
> Un membre avec **N parts** pouvait recevoir **TOUS ses gains en 1 seul tour**

**Exemple concret du problème :**
```
Tontine Optionnelle "Épargne Solidaire"
- Montant par part : 50 000 FCFA
- Membre "Alice" : 3 parts

❌ AVANT LA CORRECTION :
   Tour 1 : Alice reçoit 150 000 FCFA (3 parts × 50 000)
   Total reçu : 150 000 FCFA en 1 tour
   Problème : Alice ne peut plus gagner dans les 2 tours suivants
```

### Règle Métier Non Respectée
**Cahier des charges - Section 2.2 (Tontines optionnelles) :**

> "Le montant cumulé perçu par un membre dans une tontine optionnelle ne doit **jamais excéder** le montant total qu'il est censé cotiser sur l'ensemble des tours."

**Contrainte formelle :**
```
nombre_tours_reçus ≤ nb_parts
```

---

## ✅ Solution Implémentée

### 1. Modification Table `tour`

**Ajout du champ `statut` :**
```sql
ALTER TABLE tour ADD COLUMN statut VARCHAR(20) DEFAULT 'distribue' 
CHECK (statut IN ('distribue', 'annule'));
```

**Utilité :**
- Permet de distinguer les tours actifs des tours annulés
- Les tours annulés ne comptent PAS dans la limite
- Permet de corriger des erreurs d'attribution

---

### 2. Trigger de Validation `trigger_verifier_limite_tours`

**Déclenchement :** `BEFORE INSERT` sur table `tour`

**Logique :**
```
SI tontine.type = 'optionnelle' ALORS
    1. Récupérer nb_parts du membre
    2. Compter tours_déjà_reçus (excluant annulés)
    3. SI tours_déjà_reçus >= nb_parts ALORS
          BLOQUER l'insertion avec message d'erreur
       SINON
          Autoriser l'insertion
    FIN SI
SINON (tontine de présence)
    Autoriser sans limite
FIN SI
```

**Code SQL :**
```sql
CREATE OR REPLACE FUNCTION verifier_limite_tours_membre()
RETURNS TRIGGER AS $$
DECLARE
    v_tontine_type VARCHAR(50);
    v_nb_parts INTEGER;
    v_tours_deja_recus INTEGER;
BEGIN
    SELECT type INTO v_tontine_type FROM tontine WHERE id = NEW.id_tontine;
    
    IF v_tontine_type = 'optionnelle' THEN
        SELECT nb_parts INTO v_nb_parts
        FROM participe
        WHERE id_membre = NEW.id_beneficiaire
        AND id_tontine = NEW.id_tontine
        AND statut = 'actif';
        
        SELECT COUNT(*) INTO v_tours_deja_recus
        FROM tour
        WHERE id_beneficiaire = NEW.id_beneficiaire
        AND id_tontine = NEW.id_tontine
        AND statut != 'annule';
        
        IF v_tours_deja_recus >= v_nb_parts THEN
            RAISE EXCEPTION 'CONTRAINTE MÉTIER VIOLÉE: Le membre a déjà reçu % tour(s) pour % part(s).', 
                v_tours_deja_recus, v_nb_parts;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verifier_limite_tours
    BEFORE INSERT ON tour
    FOR EACH ROW
    EXECUTE FUNCTION verifier_limite_tours_membre();
```

---

### 3. Fonction Utilitaire `get_tours_disponibles_membre()`

**Signature :**
```sql
get_tours_disponibles_membre(
    id_membre_param UUID,
    id_tontine_param UUID
)
RETURNS TABLE (
    nb_parts INTEGER,
    tours_recus INTEGER,
    tours_disponibles INTEGER,
    peut_recevoir_tour BOOLEAN,
    type_tontine VARCHAR(50)
)
```

**Utilisation Frontend :**
```typescript
const { data } = await supabase.rpc('get_tours_disponibles_membre', {
    id_membre_param: membre.id,
    id_tontine_param: tontine.id
});

if (!data.peut_recevoir_tour) {
    alert(`❌ Ce membre a atteint sa limite : ${data.tours_recus}/${data.nb_parts} tours`);
}
```

**Résultat exemple :**
```json
{
    "nb_parts": 3,
    "tours_recus": 1,
    "tours_disponibles": 2,
    "peut_recevoir_tour": true,
    "type_tontine": "optionnelle"
}
```

---

## 📊 Comportement Après Correction

### Scénario 1 : Tontine Optionnelle (Limite Active)

```
Tontine "Épargne Solidaire"
- Type : optionnelle
- Montant par part : 50 000 FCFA
- Membre "Alice" : 3 parts

✅ APRÈS LA CORRECTION :
   Tour 1  : Alice reçoit 50 000 FCFA  ✓ (1/3 tours)
   Tour 5  : Alice reçoit 50 000 FCFA  ✓ (2/3 tours)
   Tour 9  : Alice reçoit 50 000 FCFA  ✓ (3/3 tours - LIMITE)
   Tour 12 : BLOQUÉ ❌ "Membre a déjà reçu 3 tours pour 3 parts"
   
   Total reçu : 150 000 FCFA sur 3 tours distincts
```

### Scénario 2 : Tontine de Présence (Pas de Limite)

```
Tontine "Solidarité Mensuelle"
- Type : presence
- Membre "Bob" : 1 part

✅ AUCUNE LIMITE :
   Tour 1  : Bob reçoit 75 000 FCFA  ✓
   Tour 3  : Bob reçoit 75 000 FCFA  ✓
   Tour 7  : Bob reçoit 75 000 FCFA  ✓
   Tour N  : Bob peut continuer...   ✓
```

---

## 🧪 Tests Automatisés

**Fichier :** `supabase/tests/test_contrainte_tours.sql`

**10 tests implémentés :**

| # | Test | Résultat Attendu |
|---|------|------------------|
| 1 | Tours disponibles initiaux | Alice: 3/3, Bob: 2/2, Claire: 1/1 |
| 2 | 1er tour Alice (3 parts) | ✅ SUCCÈS |
| 3 | 2ème tour Alice | ✅ SUCCÈS |
| 4 | 3ème tour Alice (dernier) | ✅ SUCCÈS |
| 5 | 4ème tour Alice (dépassement) | ❌ BLOQUÉ |
| 6 | 2 tours Bob (2 parts) | ✅ SUCCÈS |
| 7 | 3ème tour Bob (dépassement) | ❌ BLOQUÉ |
| 8 | 2ème tour Claire (1 part) | ❌ BLOQUÉ |
| 9 | Annulation + nouveau tour | ✅ SUCCÈS |
| 10 | Tontine présence sans limite | ✅ SUCCÈS |

**Exécution des tests :**
```bash
psql -d tontine_db -f supabase/tests/test_contrainte_tours.sql
```

---

## 📁 Fichiers Modifiés

### 1. Migration Principale
**Fichier :** `supabase/migrations/001_init_schema.sql`

**Modifications :**
- Ligne 136 : Ajout colonne `statut` dans table `tour`
- Lignes 974-1027 : Nouvelle section 5B avec trigger de validation
- Lignes 1220-1293 : Fonction `get_tours_disponibles_membre()`

### 2. Documentation
**Fichiers créés :**
- `CONTRAINTE_TOURS_TONTINES_OPTIONNELLES.md` - Documentation complète
- `CHANGELOG_CONTRAINTE_TOURS.md` - Ce fichier
- `supabase/tests/test_contrainte_tours.sql` - Tests automatisés

---

## 🎯 Impact sur l'Application

### Backend (Supabase)
- ✅ Contrainte automatique au niveau base de données
- ✅ Impossible de violer la règle même avec API directe
- ✅ Messages d'erreur explicites

### Frontend (React + TypeScript)
**Recommandations d'implémentation :**

```typescript
// 1. Avant d'afficher la liste des bénéficiaires potentiels
async function getBeneficiairesDisponibles(tontineId: string) {
    const membres = await getMembresActifs(tontineId);
    
    const disponibles = await Promise.all(
        membres.map(async (m) => {
            const info = await supabase.rpc('get_tours_disponibles_membre', {
                id_membre_param: m.id,
                id_tontine_param: tontineId
            });
            
            return {
                ...m,
                peut_recevoir: info.data?.peut_recevoir_tour,
                tours_restants: info.data?.tours_disponibles
            };
        })
    );
    
    return disponibles.filter(m => m.peut_recevoir);
}

// 2. Lors de l'attribution d'un tour
async function attribuerTour(membreId: string, tontineId: string, montant: number) {
    // Vérification préalable
    const { data: info } = await supabase.rpc('get_tours_disponibles_membre', {
        id_membre_param: membreId,
        id_tontine_param: tontineId
    });
    
    if (!info.peut_recevoir_tour) {
        throw new Error(
            `Ce membre a atteint sa limite : ${info.tours_recus}/${info.nb_parts} tours reçus`
        );
    }
    
    // Attribution
    const { error } = await supabase.from('tour').insert({
        id_tontine: tontineId,
        id_beneficiaire: membreId,
        montant_distribue: montant,
        date: new Date(),
        statut: 'distribue'
    });
    
    if (error) {
        // Le trigger backend bloquera si nécessaire
        console.error('Erreur attribution tour:', error.message);
    }
}
```

---

## 🔍 Requêtes Utiles

### Vérifier l'état des membres
```sql
SELECT 
    m.nom || ' ' || m.prenom AS membre,
    t.nom AS tontine,
    p.nb_parts AS parts_totales,
    COUNT(CASE WHEN tr.statut = 'distribue' THEN 1 END) AS tours_recus,
    p.nb_parts - COUNT(CASE WHEN tr.statut = 'distribue' THEN 1 END) AS tours_restants,
    CASE 
        WHEN COUNT(CASE WHEN tr.statut = 'distribue' THEN 1 END) >= p.nb_parts 
        THEN '❌ LIMITE ATTEINTE'
        ELSE '✅ Peut recevoir'
    END AS statut
FROM membre m
JOIN participe p ON m.id = p.id_membre
JOIN tontine t ON p.id_tontine = t.id
LEFT JOIN tour tr ON tr.id_beneficiaire = m.id AND tr.id_tontine = t.id
WHERE t.type = 'optionnelle'
    AND p.statut = 'actif'
GROUP BY m.id, m.nom, m.prenom, t.nom, p.nb_parts
ORDER BY tours_restants ASC;
```

### Identifier les violations potentielles (avant fix)
```sql
-- À exécuter sur anciennes données pour détecter violations
SELECT 
    m.nom || ' ' || m.prenom AS membre,
    t.nom AS tontine,
    p.nb_parts,
    COUNT(tr.id) AS tours_recus,
    COUNT(tr.id) - p.nb_parts AS depassement
FROM tour tr
JOIN membre m ON tr.id_beneficiaire = m.id
JOIN tontine t ON tr.id_tontine = t.id
JOIN participe p ON p.id_membre = m.id AND p.id_tontine = t.id
WHERE t.type = 'optionnelle'
    AND tr.statut = 'distribue'
GROUP BY m.id, m.nom, m.prenom, t.nom, p.nb_parts
HAVING COUNT(tr.id) > p.nb_parts
ORDER BY depassement DESC;
```

---

## 📝 Notes de Migration

### Si vous avez des données existantes

**Étape 1 : Identifier les violations**
```sql
-- Voir requête ci-dessus
```

**Étape 2 : Correction manuelle**
```sql
-- Option A : Annuler les tours en excès
UPDATE tour
SET statut = 'annule'
WHERE id IN (
    -- IDs des tours à annuler
);

-- Option B : Augmenter le nombre de parts
UPDATE participe
SET nb_parts = nb_parts + 1
WHERE id_membre = 'uuid'
AND id_tontine = 'uuid';
```

**Étape 3 : Appliquer la migration**
```bash
psql -d votre_db -f supabase/migrations/001_init_schema.sql
```

---

## 🚀 Prochaines Étapes

### Frontend
- [ ] Afficher le nombre de tours restants dans l'UI
- [ ] Filtrer automatiquement les membres ayant atteint leur limite
- [ ] Ajouter badge visuel : "3/3 tours reçus ⛔"
- [ ] Notification lors de la dernière attribution

### Backend
- [x] Trigger de validation
- [x] Fonction de vérification
- [x] Tests automatisés
- [ ] Fonction pour réinitialiser les tours (nouvelle période)

### Documentation
- [x] Changelog détaillé
- [x] Guide d'implémentation
- [x] Tests SQL
- [ ] Vidéo de démonstration

---

## 👥 Contributeurs

- **Auteur :** Équipe NjangiTech
- **Date :** 23 Janvier 2026
- **Projet :** INF221 - Système de Gestion de Tontine

---

## 📞 Support

En cas de questions sur cette contrainte :
1. Consulter `CONTRAINTE_TOURS_TONTINES_OPTIONNELLES.md`
2. Exécuter les tests : `test_contrainte_tours.sql`
3. Vérifier les logs PostgreSQL pour messages d'erreur détaillés

---

**Version :** 1.0.0  
**Dernière mise à jour :** 23 Janvier 2026  
**Statut :** ✅ Production Ready
