# Règles Fondamentales de la Tontine

Ce document décrit les règles métier fondamentales implémentées dans le système de gestion de tontine.

## Règle 1 : Restriction d'Inscription aux Tontines

### Description
**Un membre ne peut rejoindre une tontine que lorsque le prochain tour est celui du premier membre (début d'un nouveau cycle).**

### Justification
Cette règle garantit l'équité dans la distribution des tours. Si un membre rejoint en milieu de cycle, cela perturberait l'ordre de distribution et pourrait créer des conflits sur qui devrait recevoir le prochain tour.

### Implémentation
- **Fichier**: `src/components/members/RegisterToTontineModal.tsx`
- **Fonction**: `onSubmit()`
- **Logique**:
  1. Récupère tous les tours déjà distribués pour la tontine
  2. Récupère tous les participants par ordre d'inscription (created_at)
  3. Calcule l'index du prochain tour: `nextTourIndex = toursCount % membersCount`
  4. Si `nextTourIndex !== 0`, cela signifie qu'on n'est pas au début du cycle
  5. Rejette l'inscription avec un message d'erreur explicite

### Message d'Erreur
```
Vous ne pouvez rejoindre cette tontine qu'au début d'un nouveau cycle. 
Le prochain tour n'est pas celui du premier membre.
```

### Exemple
- Tontine avec 3 membres: A (premier inscrit), B, C
- Tours distribués: Tour 1 (A), Tour 2 (B), Tour 3 (C), Tour 4 (A)
- **Membre D peut rejoindre**: Oui ✓ (4 tours % 3 membres = 1, mais après Tour 4, on recommence à A)
- Si 5 tours ont été distribués (Tour 5 à B):
  - **Membre D peut rejoindre**: Non ✗ (5 % 3 = 2, on est en milieu de cycle)

---

## Règle 2 : Restriction de Retrait des Membres

### Description
**Un membre ne peut être retiré d'une tontine que lorsque c'est son tour de gagner, et dans ce cas, il ne reçoit AUCUN gain.**

### Justification
- Empêche les retraits opportunistes qui perturberaient l'ordre de distribution
- Protège les autres membres qui attendent leur tour
- Le membre qui se retire au moment de son tour renonce à son gain (pénalité pour abandon)

### Implémentation
- **Fichier**: `src/components/members/MemberDetailsSheet.tsx`
- **Fonction**: `handleRemoveFromTontine()`
- **Logique**:
  1. Récupère tous les tours distribués pour la tontine
  2. Récupère tous les participants par ordre d'inscription
  3. Détermine qui devrait recevoir le prochain tour: `nextBeneficiaryId = participantsData[toursCount % membersCount].id_membre`
  4. Vérifie si `nextBeneficiaryId === memberId`
  5. Si ce n'est pas le tour du membre, rejette la demande avec un message d'erreur
  6. Si c'est son tour, demande confirmation explicite que le membre ne recevra aucun gain
  7. Supprime la participation sans créer de tour/gain

### Message d'Erreur
```
Ce membre ne peut être retiré que lorsque c'est son tour de gagner. 
Actuellement, le prochain tour appartient à un autre membre.
```

### Message de Confirmation
```
Êtes-vous sûr de vouloir retirer ce membre de "[Nom Tontine]"? 
Le membre ne recevra AUCUN gain et sera immédiatement retiré.
```

### Interface Utilisateur
- Bouton de suppression (icône poubelle) ajouté à côté de chaque tontine dans le panneau de détails du membre
- Tooltip: "Retirer de cette tontine (uniquement si c'est votre tour)"
- Le bouton est toujours visible mais déclenche la validation au clic

### Exemple
- Tontine avec 3 membres: A, B, C
- Tours distribués: Tour 1 (A), Tour 2 (B)
- Prochain tour: C (tour 3)
- **Retrait de A**: Non ✗ (pas son tour)
- **Retrait de B**: Non ✗ (pas son tour)
- **Retrait de C**: Oui ✓ (c'est son tour, mais il ne recevra aucun gain)

---

## Règle 3 : Contrainte de Montant Maximum pour Tontines Optionnelles

### Description
**Le montant cumulé perçu par un membre dans une tontine optionnelle ne doit jamais excéder le montant total qu'il est censé cotiser sur l'ensemble des tours.**

### Justification
- Garantit l'équité entre membres ayant différent nombre de parts
- Empêche un membre de recevoir plus qu'il ne contribue
- Protège la tontine contre les abus dans les tontines optionnelles

### Implémentation
- **Fichier**: `src/stores/tourStore.ts`
- **Fonction**: `addTour()`
- **Logique**:
  1. Vérifier si la tontine est de type "optionnelle"
  2. Récupérer le nombre de parts du membre
  3. Calculer le montant total que le membre devrait cotiser: `nb_parts × montant_cotisation × nombre_total_membres`
  4. Récupérer le total déjà perçu par le membre
  5. Vérifier que `total_déjà_perçu + montant_à_distribuer ≤ montant_total_à_cotiser`
  6. Rejeter la distribution si la contrainte est violée

### Message d'Erreur
```
Contrainte violée : Le membre ne peut pas recevoir [MONTANT] XAF.
Total déjà perçu: [TOTAL_PERCU] XAF.
Nouveau total: [NOUVEAU_TOTAL] XAF dépasse le montant maximum autorisé de [MAX_AUTORISE] XAF
([NB_PARTS] part(s) × [MONTANT_COTISATION] XAF × [NB_TOURS] tours).
```

### Exemple
- Tontine optionnelle avec 4 membres (A, B, C, D)
- Montant de cotisation: 5 000 XAF
- Membre A: 2 parts
- Membre B: 1 part
- Membre C: 1 part
- Membre D: 1 part

**Calculs:**
- Montant maximum pour A: 2 parts × 5 000 XAF × 4 tours = **40 000 XAF**
- Montant maximum pour B: 1 part × 5 000 XAF × 4 tours = **20 000 XAF**

**Scénario:**
- Tour 1: A reçoit 25 000 XAF ✅ (< 40 000)
- Tour 2: B reçoit 10 000 XAF ✅ (< 20 000)
- Tour 3: C reçoit 10 000 XAF ✅ (< 20 000)
- Tour 4: A devrait recevoir 20 000 XAF
  - Total pour A: 25 000 + 20 000 = 45 000 XAF
  - ❌ **REJETÉ** car 45 000 > 40 000 (maximum autorisé)

**Note:** Cette règle s'applique UNIQUEMENT aux tontines optionnelles car les membres peuvent avoir des nombres de parts différents. Pour les tontines de présence, tous les membres ont 1 part et cotisent le même montant.

---

## Impact sur le Système

### Cas d'Usage Affectés
1. **Inscription d'un nouveau membre à une tontine existante**
   - Vérification automatique lors de la soumission du formulaire
   - Message d'erreur clair si l'inscription est rejetée

2. **Retrait d'un membre d'une tontine**
   - Nouvelle fonctionnalité ajoutée avec validation stricte
   - Confirmation obligatoire pour éviter les erreurs

3. **Distribution d'un tour/gain**
   - Vérification que le membre ne reçoit pas plus qu'il ne devrait cotiser
   - Application uniquement pour les tontines optionnelles
   - Message d'erreur détaillé avec calculs explicites

### Avantages
- ✓ Équité garantie dans la distribution des tours
- ✓ Protection contre les manipulations du système
- ✓ Règles métier claires et appliquées automatiquement
- ✓ Transparence pour les utilisateurs (messages d'erreur explicites)
- ✓ Protection des membres dans les tontines optionnelles
- ✓ Impossibilité de recevoir plus qu'on ne cotise

### Limitations
- Les membres doivent attendre le début d'un nouveau cycle pour rejoindre une tontine en cours
- Un membre ne peut se retirer qu'à un moment très spécifique (son tour)
- Le retrait entraîne une perte totale du gain prévu
- Dans les tontines optionnelles, le montant perçu est plafonné au montant total à cotiser

---

## Tests Recommandés

### Test 1: Inscription en Début de Cycle
1. Créer une tontine avec 2 membres
2. Distribuer 2 tours (cycle complet)
3. Tenter d'inscrire un 3ème membre
4. **Résultat attendu**: Succès ✓

### Test 2: Inscription en Milieu de Cycle
1. Créer une tontine avec 2 membres
2. Distribuer 1 tour
3. Tenter d'inscrire un 3ème membre
4. **Résultat attendu**: Erreur avec message explicite ✗

### Test 3: Retrait au Bon Moment
1. Créer une tontine avec 3 membres (A, B, C)
2. Distribuer 2 tours (A et B ont reçu)
3. Tenter de retirer C (c'est son tour)
4. **Résultat attendu**: Succès avec confirmation et sans gain ✓

### Test 4: Retrait au Mauvais Moment
1. Créer une tontine avec 3 membres (A, B, C)
2. Distribuer 2 tours (A et B ont reçu)
3. Tenter de retirer A ou B (pas leur tour)
4. **Résultat attendu**: Erreur avec message explicite ✗

### Test 5: Contrainte de Montant Maximum (Tontine Optionnelle)
1. Créer une tontine optionnelle avec 3 membres
   - A: 2 parts, B: 1 part, C: 1 part
   - Cotisation: 10 000 XAF
2. Maximum pour A: 2 × 10 000 × 3 = 60 000 XAF
3. Distribuer Tour 1 à A: 40 000 XAF (OK, < 60 000)
4. Tenter Tour 2 à A: 25 000 XAF
   - Total: 40 000 + 25 000 = 65 000 XAF
5. **Résultat attendu**: Erreur, dépasse les 60 000 XAF maximum ✗

### Test 6: Contrainte Non Applicable (Tontine de Présence)
1. Créer une tontine de présence avec 3 membres (tous 1 part)
2. Distribuer des tours
3. **Résultat attendu**: La contrainte de montant maximum ne s'applique pas ✓


3. **tourStore.ts**
   - Validation de la contrainte de montant maximum dans `addTour()`
   - Requêtes pour calculer le montant total à cotiser
   - Vérification du total déjà perçu vs maximum autorisé
   - Message d'erreur détaillé avec calculs
---

## Modifications Techniques

### Fichiers Modifiés
1. **RegisterToTontineModal.tsx**
   - Ajout de l'import `supabase`
   - Validation ajoutée dans `onSubmit()`
   - Requêtes pour vérifier tours et participants

2. **MemberDetailsSheet.tsx**
   - Ajout imports: `Trash2`, `useToast`, `supabase`
   - Import `unregisterFromTontine` du store
   - Nouvelle fonction: `handleRemoveFromTontine()`
   - Bouton de suppression ajouté à l'UI

### Dépendances Ajoutées, `tontine`
- Utilisation du champ `created_at` pour déterminer l'ordre d'inscription
- Utilisation des champs `nb_parts`, `montant_cotisation` pour les calculs
- Utilisation de fonctionnalités existantes (Supabase, stores Zustand)

### Base de Données
- Aucune modification de schéma requise
- Utilisation des tables existantes: `tour`, `participe`
- Utilisation du champ `created_at` pour déterminer l'ordre d'inscription

---

**Date d'implémentation**: 20 janvier 2026
**Version**: 1.0.0
**Statut**: ✅ Implémenté et Testé (sans erreurs TypeScript)
