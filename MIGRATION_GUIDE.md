# 🚀 Guide de Migration - Traçabilité Financière

## ⚡ Application Rapide de la Migration

### Étape 1: Ouvrir Supabase Dashboard
1. Aller sur [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet NjangiTech
3. Cliquer sur **SQL Editor** dans le menu latéral

### Étape 2: Exécuter la Migration
1. Cliquer sur **New Query**
2. Ouvrir le fichier `supabase/migrations/002_add_transactions_and_fix_cascades.sql`
3. Copier TOUT le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **Run** (▶️)

### Étape 3: Vérifier que ça a marché
```sql
-- Vérifier que la table existe
SELECT * FROM transaction LIMIT 1;

-- Vérifier que les triggers sont créés
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%transaction%';

-- Vérifier que la fonction de calcul fonctionne
SELECT calculer_solde_tontine('votre-id-tontine-uuid');

-- Vérifier la vue enrichie
SELECT * FROM v_transactions_enrichies LIMIT 5;
```

## 🧪 Test de la Suppression en Cascade

### Créer des données de test
```sql
-- 1. Créer une tontine de test
INSERT INTO tontine (nom, type, montant_cotisation, periode, date_debut, statut)
VALUES ('Test Cascade', 'presence', 10000, 'mensuelle', '2026-01-01', 'Actif')
RETURNING id; -- Noter cet ID

-- 2. Créer un crédit
INSERT INTO credit (id_membre, id_tontine, montant, solde, date_remboursement_prevue)
VALUES (
  (SELECT id FROM membre LIMIT 1),  -- Premier membre
  'ID_TONTINE_TEST',  -- Remplacer par l'ID de la tontine test
  100000,
  100000,
  '2026-12-31'
);

-- 3. Vérifier qu'une transaction a été créée par le trigger
SELECT * FROM transaction WHERE id_tontine = 'ID_TONTINE_TEST';

-- 4. SUPPRIMER LA TONTINE
DELETE FROM tontine WHERE id = 'ID_TONTINE_TEST';

-- 5. Vérifier que les transactions ont aussi été supprimées
SELECT * FROM transaction WHERE id_tontine = 'ID_TONTINE_TEST';
-- ✅ Doit retourner 0 lignes
```

## 📊 Utiliser les Nouvelles Fonctions

### Calculer le solde d'une tontine
```sql
SELECT calculer_solde_tontine('votre-id-tontine');
-- Retourne: 1250000.00
```

### Résumé financier complet
```sql
SELECT * FROM get_tontine_financial_summary('votre-id-tontine');
-- Retourne:
-- solde_actuel: 1250000
-- total_entrees: 2000000
-- total_sorties: 750000
-- total_cotisations: 1500000
-- ...
```

### Historique des transactions
```sql
SELECT 
  created_at,
  type,
  montant,
  description,
  membre_nom
FROM v_transactions_enrichies
WHERE id_tontine = 'votre-id-tontine'
ORDER BY created_at DESC
LIMIT 20;
```

## 🔧 Utilisation dans React/TypeScript

### Dans vos composants
```typescript
import { useTransactionStore } from '@/stores/transactionStore';
import { useEffect, useState } from 'react';

function TontineFinances({ tontineId }: { tontineId: string }) {
  const { getTontineBalance, getTontineFinancialSummary } = useTransactionStore();
  const [solde, setSolde] = useState(0);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadFinances() {
      // Charger le solde
      const balance = await getTontineBalance(tontineId);
      setSolde(balance);

      // Charger le résumé
      const sum = await getTontineFinancialSummary(tontineId);
      setSummary(sum);
    }

    loadFinances();
  }, [tontineId]);

  return (
    <div>
      <h2>Finances de la Tontine</h2>
      <p>Solde actuel: {solde.toLocaleString()} XAF</p>
      
      {summary && (
        <>
          <p>Total entrées: {summary.total_entrees.toLocaleString()} XAF</p>
          <p>Total sorties: {summary.total_sorties.toLocaleString()} XAF</p>
          <p>Cotisations: {summary.total_cotisations.toLocaleString()} XAF</p>
          <p>Crédits décaissés: {summary.total_credits_decaisses.toLocaleString()} XAF</p>
        </>
      )}
    </div>
  );
}
```

### Afficher l'historique des transactions
```typescript
import { useTransactionStore } from '@/stores/transactionStore';
import { useEffect, useState } from 'react';

function TransactionHistory({ tontineId }: { tontineId: string }) {
  const { fetchTransactionsEnrichies } = useTransactionStore();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function loadTransactions() {
      const txns = await fetchTransactionsEnrichies(tontineId);
      setTransactions(txns);
    }

    loadTransactions();
  }, [tontineId]);

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Montant</th>
          <th>Description</th>
          <th>Membre</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((txn) => (
          <tr key={txn.id}>
            <td>{new Date(txn.created_at).toLocaleDateString()}</td>
            <td>{txn.type}</td>
            <td className={txn.montant > 0 ? 'text-green-600' : 'text-red-600'}>
              {txn.montant > 0 ? '+' : ''}{txn.montant.toLocaleString()} XAF
            </td>
            <td>{txn.description}</td>
            <td>{txn.membre_nom || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## ⚠️ Problèmes Courants

### Erreur: "function calculer_solde_tontine does not exist"
**Cause:** La migration n'a pas été exécutée correctement.  
**Solution:** Réexécuter le fichier `002_add_transactions_and_fix_cascades.sql`

### Erreur: "column montant does not exist"
**Cause:** Vous utilisez encore l'ancien code avec `amount` au lieu de `montant`.  
**Solution:** Utiliser la nouvelle interface `InsertTransaction` avec `montant`

### Les transactions ne s'affichent pas
**Cause:** Pas de données dans la table (c'est une nouvelle table vide).  
**Solution:** Les triggers créeront automatiquement les transactions pour les nouvelles opérations. Pour migrer l'historique :

```sql
-- Migrer les cotisations existantes
INSERT INTO transaction (id_tontine, id_membre, id_seance, type, montant, description)
SELECT 
  id_tontine,
  id_membre,
  id_seance,
  'contribution',
  montant,
  CONCAT('Migration: Cotisation session #', (SELECT numero_seance FROM seance WHERE id = cotisation.id_seance))
FROM cotisation;

-- Migrer les pénalités payées
INSERT INTO transaction (id_tontine, id_membre, id_penalite, type, montant, description)
SELECT 
  id_tontine,
  id_membre,
  id,
  'penalty',
  montant_paye,
  CONCAT('Migration: Paiement pénalité - ', raison)
FROM penalite
WHERE montant_paye > 0;
```

## ✅ Checklist Finale

- [ ] Migration SQL exécutée sans erreur
- [ ] Table `transaction` créée
- [ ] Vue `v_transactions_enrichies` disponible
- [ ] Fonction `calculer_solde_tontine` fonctionne
- [ ] Fonction `get_tontine_financial_summary` fonctionne
- [ ] Test de suppression en cascade réussi
- [ ] Code TypeScript mis à jour (git pull)
- [ ] Aucune erreur dans la console du navigateur

## 🎉 Terminé !

Votre système de traçabilité financière est maintenant opérationnel. Toutes les transactions sont persistées dans la base de données et la suppression en cascade fonctionne correctement. Plus d'argent fantôme ! 💰✨
