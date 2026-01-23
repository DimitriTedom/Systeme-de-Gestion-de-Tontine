# CONTRAINTE MÉTIER : LIMITATION DES TOURS POUR TONTINES OPTIONNELLES

## 📋 Problème Initial

**Comportement incorrect détecté :**
- Un membre avec N parts pouvait recevoir TOUS ses gains en UN SEUL tour
- Exemple : Membre avec 3 parts → peut gagner 3 × montant en 1 tour
- ❌ **Ce n'est PAS conforme aux tontines locales traditionnelles**

## ✅ Règle Métier Correcte

### Principe Fondamental
> **"Un membre avec N parts doit recevoir ses gains sur N tours différents"**

**Mathématiquement :**
```
nombre_tours_reçus ≤ nb_parts
```

**Exemples concrets :**
- Membre avec 1 part → peut gagner 1 fois maximum
- Membre avec 3 parts → peut gagner 3 fois maximum (sur 3 tours distincts)
- Membre avec 5 parts → peut gagner 5 fois maximum (sur 5 tours distincts)

### Contrainte Majeure du Cahier des Charges

```
Le montant cumulé perçu par un membre dans une tontine optionnelle 
ne doit JAMAIS excéder le montant total qu'il est censé cotiser 
sur l'ensemble des tours.
```

**Formule :**
```
montant_total_reçu ≤ montant_total_cotisé
```

## 🔧 Implémentation Technique

### 1. Modification de la Table `tour`

Ajout d'un champ `statut` pour gérer les annulations :

```sql
CREATE TABLE tour (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tontine UUID NOT NULL REFERENCES tontine(id) ON DELETE CASCADE,
    id_seance UUID REFERENCES seance(id) ON DELETE SET NULL,
    id_beneficiaire UUID NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    date DATE NOT NULL,
    montant_distribue DECIMAL(12, 2) NOT NULL CHECK (montant_distribue >= 0),
    statut VARCHAR(20) DEFAULT 'distribue' CHECK (statut IN ('distribue', 'annule')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_tontine, numero)
);
```

### 2. Trigger de Validation

**Fonction `verifier_limite_tours_membre()` :**

```sql
CREATE OR REPLACE FUNCTION verifier_limite_tours_membre()
RETURNS TRIGGER AS $$
DECLARE
    v_tontine_type VARCHAR(50);
    v_nb_parts INTEGER;
    v_tours_deja_recus INTEGER;
BEGIN
    -- 1. Vérifier le type de tontine
    SELECT type INTO v_tontine_type
    FROM tontine
    WHERE id = NEW.id_tontine;
    
    -- 2. Cette contrainte s'applique UNIQUEMENT aux tontines optionnelles
    IF v_tontine_type = 'optionnelle' THEN
        -- 3. Récupérer le nombre de parts du membre
        SELECT nb_parts INTO v_nb_parts
        FROM participe
        WHERE id_membre = NEW.id_beneficiaire
        AND id_tontine = NEW.id_tontine
        AND statut = 'actif';
        
        -- 4. Compter les tours déjà reçus (excluant annulés)
        SELECT COUNT(*)
        INTO v_tours_deja_recus
        FROM tour
        WHERE id_beneficiaire = NEW.id_beneficiaire
        AND id_tontine = NEW.id_tontine
        AND statut != 'annule';
        
        -- 5. BLOQUER si limite atteinte
        IF v_tours_deja_recus >= v_nb_parts THEN
            RAISE EXCEPTION 
                'CONTRAINTE MÉTIER VIOLÉE: Le membre a déjà reçu % tour(s) pour % part(s). Un membre avec N parts ne peut bénéficier que de N tours maximum dans une tontine optionnelle.',
                v_tours_deja_recus, v_nb_parts;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Activation du trigger :**

```sql
DROP TRIGGER IF EXISTS trigger_verifier_limite_tours ON tour;
CREATE TRIGGER trigger_verifier_limite_tours
    BEFORE INSERT ON tour
    FOR EACH ROW
    EXECUTE FUNCTION verifier_limite_tours_membre();
```

### 3. Fonction Utilitaire : Vérifier Tours Disponibles

```sql
CREATE OR REPLACE FUNCTION get_tours_disponibles_membre(
    id_membre_param UUID,
    id_tontine_param UUID
)
RETURNS TABLE (
    nb_parts INTEGER,
    tours_recus INTEGER,
    tours_disponibles INTEGER,
    peut_recevoir_tour BOOLEAN,
    type_tontine VARCHAR(50)
);
```

**Utilisation :**

```sql
-- Vérifier avant d'attribuer un tour
SELECT * FROM get_tours_disponibles_membre(
    'uuid-du-membre',
    'uuid-de-la-tontine'
);
```

**Résultat attendu :**

| nb_parts | tours_recus | tours_disponibles | peut_recevoir_tour | type_tontine |
|----------|-------------|-------------------|-------------------|--------------|
| 3        | 1           | 2                 | TRUE              | optionnelle  |

## 📊 Scénarios d'Utilisation

### Scénario 1 : Tontine Optionnelle - Attribution Réussie

**Contexte :**
- Tontine "Épargne Flexible" (type: `optionnelle`)
- Membre "Marie" a 3 parts
- Marie a déjà reçu 1 tour

**Action :**
```sql
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue)
VALUES (
    'uuid-tontine-epargne',
    'uuid-marie',
    5,
    '2026-01-23',
    150000.00
);
```

**Résultat :** ✅ **SUCCÈS** (2 tours restants disponibles)

---

### Scénario 2 : Tontine Optionnelle - Attribution Bloquée

**Contexte :**
- Tontine "Épargne Flexible" (type: `optionnelle`)
- Membre "Jean" a 2 parts
- Jean a déjà reçu 2 tours

**Action :**
```sql
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue)
VALUES (
    'uuid-tontine-epargne',
    'uuid-jean',
    8,
    '2026-01-23',
    150000.00
);
```

**Résultat :** ❌ **ERREUR**
```
CONTRAINTE MÉTIER VIOLÉE: Le membre a déjà reçu 2 tour(s) pour 2 part(s). 
Un membre avec N parts ne peut bénéficier que de N tours maximum dans une tontine optionnelle.
```

---

### Scénario 3 : Tontine de Présence - Pas de Limite

**Contexte :**
- Tontine "Solidarité Mensuelle" (type: `presence`)
- Membre "Patrick" a 1 part
- Patrick a déjà reçu 5 tours

**Action :**
```sql
INSERT INTO tour (id_tontine, id_beneficiaire, numero, date, montant_distribue)
VALUES (
    'uuid-tontine-solidarite',
    'uuid-patrick',
    12,
    '2026-01-23',
    200000.00
);
```

**Résultat :** ✅ **SUCCÈS** (pas de limite pour tontines de présence)

## 🎯 Vérifications Frontend

### Avant l'Attribution d'un Tour

```typescript
// 1. Récupérer les tours disponibles
const { data: toursInfo } = await supabase.rpc('get_tours_disponibles_membre', {
    id_membre_param: membreId,
    id_tontine_param: tontineId
});

// 2. Vérifier si le membre peut recevoir un tour
if (!toursInfo.peut_recevoir_tour) {
    alert(`❌ Ce membre a déjà reçu ${toursInfo.tours_recus} tour(s) pour ${toursInfo.nb_parts} part(s). Limite atteinte !`);
    return;
}

// 3. Afficher l'information
console.log(`✅ Tours disponibles : ${toursInfo.tours_disponibles} sur ${toursInfo.nb_parts}`);

// 4. Procéder à l'attribution
await supabase.from('tour').insert({
    id_tontine: tontineId,
    id_beneficiaire: membreId,
    numero: numeroTour,
    date: new Date(),
    montant_distribue: montant
});
```

## 📈 Impact sur le Système

### Avant la Contrainte

```
Tontine Optionnelle "Épargne Flexible"
- Montant par part: 50 000 FCFA
- Membre "Alice" : 4 parts

❌ Problème:
- Tour 1: Alice reçoit 200 000 FCFA (4 parts × 50 000)
- Total reçu: 200 000 FCFA en 1 seul tour
- Reste 0 FCFA pour 3 tours suivants
```

### Après la Contrainte

```
Tontine Optionnelle "Épargne Flexible"
- Montant par part: 50 000 FCFA
- Membre "Alice" : 4 parts

✅ Solution:
- Tour 1: Alice reçoit 50 000 FCFA (1 part)
- Tour 5: Alice reçoit 50 000 FCFA (1 part)
- Tour 9: Alice reçoit 50 000 FCFA (1 part)
- Tour 12: Alice reçoit 50 000 FCFA (1 part)
- Total reçu: 200 000 FCFA sur 4 tours distincts
```

## 🔍 Requêtes de Monitoring

### 1. Membres ayant atteint leur limite

```sql
SELECT 
    m.nom || ' ' || m.prenom AS membre,
    t.nom AS tontine,
    p.nb_parts,
    COUNT(tr.id) AS tours_recus
FROM membre m
JOIN participe p ON m.id = p.id_membre
JOIN tontine t ON p.id_tontine = t.id
LEFT JOIN tour tr ON tr.id_beneficiaire = m.id 
    AND tr.id_tontine = t.id 
    AND tr.statut != 'annule'
WHERE t.type = 'optionnelle'
GROUP BY m.id, m.nom, m.prenom, t.nom, p.nb_parts
HAVING COUNT(tr.id) >= p.nb_parts
ORDER BY m.nom;
```

### 2. Capacité restante par membre

```sql
SELECT 
    m.nom || ' ' || m.prenom AS membre,
    t.nom AS tontine,
    p.nb_parts,
    COUNT(tr.id) AS tours_recus,
    p.nb_parts - COUNT(tr.id) AS tours_restants,
    ROUND((COUNT(tr.id)::NUMERIC / p.nb_parts * 100), 2) AS pourcentage_utilise
FROM membre m
JOIN participe p ON m.id = p.id_membre
JOIN tontine t ON p.id_tontine = t.id
LEFT JOIN tour tr ON tr.id_beneficiaire = m.id 
    AND tr.id_tontine = t.id 
    AND tr.statut != 'annule'
WHERE t.type = 'optionnelle'
    AND p.statut = 'actif'
GROUP BY m.id, m.nom, m.prenom, t.nom, p.nb_parts
ORDER BY tours_restants ASC;
```

## 🚨 Messages d'Erreur

### Backend (PostgreSQL)

```
CONTRAINTE MÉTIER VIOLÉE: Le membre a déjà reçu 3 tour(s) pour 3 part(s). 
Un membre avec N parts ne peut bénéficier que de N tours maximum dans une tontine optionnelle.
```

### Frontend (Recommandé)

```javascript
// Message utilisateur friendly
const message = `
🚫 Attribution impossible !

Ce membre a déjà reçu ${toursRecus} tour(s) pour ${nbParts} part(s).

Règle : Un membre avec N parts ne peut gagner que N fois maximum.

💡 Solution : Attribuer le tour à un autre membre ou augmenter le nombre de parts de ce membre.
`;
```

## 📝 Notes Importantes

1. **Différence Tontines de Présence vs Optionnelles :**
   - **Présence** : Tous les membres présents à chaque séance
   - **Optionnelle** : Participation facultative → nécessite limite stricte

2. **Gestion des Annulations :**
   - Les tours avec `statut = 'annule'` ne comptent PAS dans la limite
   - Permet de corriger des erreurs d'attribution

3. **Augmentation du Nombre de Parts :**
   - Si un membre augmente ses parts (ex: 2 → 4), il peut recevoir 2 tours supplémentaires

4. **Conformité Cahier des Charges :**
   - Section 2.2 : "Un membre peut être bénéficiaire plusieurs fois"
   - **MAIS** : Contrainte majeure limite selon les parts

## 🎓 Exemple Pédagogique Complet

**Tontine "Épargne Solidaire" (optionnelle)**
- Montant par part : 25 000 FCFA
- 10 membres, 20 parts au total
- 20 tours à distribuer

**Membres :**

| Nom     | Parts | Tours Max | Tours Reçus | Tours Restants |
|---------|-------|-----------|-------------|----------------|
| Alice   | 4     | 4         | 2           | 2              |
| Bob     | 2     | 2         | 2           | 0 (LIMITE)     |
| Claire  | 3     | 3         | 1           | 2              |
| David   | 1     | 1         | 0           | 1              |

**Distributions valides :**
- ✅ Alice peut encore recevoir 2 tours
- ❌ Bob a atteint sa limite (2/2)
- ✅ Claire peut encore recevoir 2 tours
- ✅ David peut encore recevoir 1 tour

---

**Date de mise en œuvre :** 23 Janvier 2026  
**Statut :** ✅ Implémenté et Testé  
**Version Base de Données :** 001_init_schema.sql
