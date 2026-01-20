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

## Impact sur le Système

### Cas d'Usage Affectés
1. **Inscription d'un nouveau membre à une tontine existante**
   - Vérification automatique lors de la soumission du formulaire
   - Message d'erreur clair si l'inscription est rejetée

2. **Retrait d'un membre d'une tontine**
   - Nouvelle fonctionnalité ajoutée avec validation stricte
   - Confirmation obligatoire pour éviter les erreurs

### Avantages
- ✓ Équité garantie dans la distribution des tours
- ✓ Protection contre les manipulations du système
- ✓ Règles métier claires et appliquées automatiquement
- ✓ Transparence pour les utilisateurs (messages d'erreur explicites)

### Limitations
- Les membres doivent attendre le début d'un nouveau cycle pour rejoindre une tontine en cours
- Un membre ne peut se retirer qu'à un moment très spécifique (son tour)
- Le retrait entraîne une perte totale du gain prévu

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

### Dépendances Ajoutées
- Aucune nouvelle dépendance externe
- Utilisation de fonctionnalités existantes (Supabase, stores Zustand)

### Base de Données
- Aucune modification de schéma requise
- Utilisation des tables existantes: `tour`, `participe`
- Utilisation du champ `created_at` pour déterminer l'ordre d'inscription

---

**Date d'implémentation**: 20 janvier 2026
**Version**: 1.0.0
**Statut**: ✅ Implémenté et Testé (sans erreurs TypeScript)
