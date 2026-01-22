# 📁 Migrations Supabase - NjangiTech

## 📄 Fichier Unique de Migration

Ce dossier contient un seul fichier SQL complet qui initialise toute la base de données :

### `001_init_schema.sql` (Fichier Unique Complet)

Ce fichier contient **TOUT** le schéma de base de données incluant :

#### ✅ Tables Principales (Section 1)
- `membre` : Gestion des membres
- `tontine` : Configuration des tontines
- `participe` : Association membres-tontines
- `seance` : Sessions de tontine
- `cotisation` : Cotisations des membres
- `credit` : Gestion des crédits
- `penalite` : Pénalités des membres
- `tour` : Attribution des gains
- `projet` : Projets de tontine
- `presence` : Suivi de présence
- **`transaction`** ⭐ : **Traçabilité financière complète**

#### ✅ Contraintes CASCADE (Section 1)
- `credit.id_tontine` → `ON DELETE CASCADE` (corrigé ✅)
- `penalite.id_tontine` → `ON DELETE CASCADE` (corrigé ✅)
- Toutes les relations `transaction` → `ON DELETE CASCADE`

#### ✅ Index Optimisés (Section 2)
- Index sur toutes les colonnes de recherche fréquente
- Index pour les transactions par tontine, type, membre, date

#### ✅ Triggers Auto-Update (Section 3)
- Mise à jour automatique de `updated_at` sur toutes les tables

#### ✅ Fonctions RPC Métier (Section 4)
- `cloturer_seance()` : Clôture de session avec pénalités auto
- `attribuer_gain()` : Distribution d'un tour
- `enregistrer_presence_et_cotisation()` : Feuille de séance
- `get_statistiques_dashboard()` : Stats globales
- `get_membres_seance()` : Membres pour une session
- **`calculer_solde_tontine()`** ⭐ : Solde en temps réel
- **`get_tontine_financial_summary()`** ⭐ : Résumé financier complet

#### ✅ Triggers Financiers Automatiques (Section 5)
- `trigger_cotisation_transaction` : Enregistre automatiquement les cotisations
- `trigger_penalite_transaction` : Enregistre les paiements de pénalités
- `trigger_credit_decaissement` : Enregistre les décaissements de crédits
- `trigger_tour_transaction` : Enregistre les distributions de tours

#### ✅ Row Level Security (Section 6)
- Politiques RLS pour toutes les tables
- Accès complet pour utilisateurs authentifiés

#### ✅ Vues Utiles (Section 7)
- **`v_transactions_enrichies`** ⭐ : Transactions avec toutes les infos liées
- `v_membre_synthese` : Stats par membre
- `v_tontine_synthese` : Stats par tontine

#### ✅ Gestion des Crédits (Section 8)
- `verifier_credit_actif()` : Check crédit actif
- `mettre_a_jour_credits_en_retard()` : MAJ statuts automatique
- `rembourser_credit()` : Remboursement partiel/total
- `payer_penalite()` : Paiement de pénalité

#### ✅ Données de Test (Section 9)
- Exemples commentés pour tester le schéma

---

## 🚀 Déploiement

### Option 1 : Via Supabase Dashboard (Recommandé)
1. Aller sur [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. **SQL Editor** → **New Query**
4. Copier/coller le contenu de `001_init_schema.sql`
5. **Run** ▶️

### Option 2 : Via Supabase CLI
```bash
cd "Systeme-de-Gestion-de-Tontine"
supabase db reset
```

---

## ✨ Nouveautés : Traçabilité Financière

### Table `transaction`
Enregistre **TOUS** les mouvements d'argent :
- **Positif** = Argent qui ENTRE (cotisations, remboursements, pénalités)
- **Négatif** = Argent qui SORT (crédits, tours, projets)

### Suppression en Cascade Complète
Quand on supprime une **tontine**, TOUT disparaît automatiquement :
```
TONTINE supprimée
    ↓ CASCADE
├── PARTICIPE
├── SEANCE → COTISATION, PRESENCE, TRANSACTION
├── CREDIT → TRANSACTION
├── PENALITE → TRANSACTION
├── TOUR → TRANSACTION
├── PROJET
└── TRANSACTION (toutes!)
```

**Résultat :** Plus d'argent fantôme ! 💰✨

---

## 📊 Utilisation

### Calculer le solde d'une tontine
```sql
SELECT calculer_solde_tontine('uuid-tontine');
-- Retourne: 1250000.00
```

### Résumé financier complet
```sql
SELECT * FROM get_tontine_financial_summary('uuid-tontine');
-- Retourne: solde, entrées, sorties, cotisations, crédits, etc.
```

### Historique des transactions
```sql
SELECT * FROM v_transactions_enrichies 
WHERE id_tontine = 'uuid-tontine'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📝 Notes Importantes

- **Un seul fichier** : `001_init_schema.sql` contient TOUT
- **Pas de fichier 002** : Tout a été consolidé dans le 001
- **Triggers automatiques** : Les transactions sont créées automatiquement
- **CASCADE partout** : La suppression nettoie tout proprement
- **Idempotent** : Le script peut être exécuté plusieurs fois (`CREATE IF NOT EXISTS`)

---

## 🔧 Maintenance

Pour réinitialiser complètement la base de données :
```bash
# Supprimer toutes les tables et recommencer
supabase db reset
```

---

## 📚 Documentation

- [FINANCIAL_TRACEABILITY_FIX.md](../../FINANCIAL_TRACEABILITY_FIX.md) : Documentation complète du fix
- [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) : Guide d'utilisation détaillé
- [README.md](../../README.md) : Documentation générale du projet

---

**Dernière mise à jour :** 2026-01-22  
**Version :** 1.0 (Consolidée)
