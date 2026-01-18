# Configuration Supabase Local - NjangiTech

## ✅ Configuration Terminée

Le projet a été migré avec succès de FastAPI vers Supabase serverless !

## 🚀 Démarrage Rapide

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Node.js 18+ installé
- Supabase CLI installé

### 1. Démarrer Supabase Local

**Option 1 : Utiliser le script automatique**
```bash
./start-supabase.sh
```

**Option 2 : Commande manuelle**
```bash
sudo supabase start --exclude edge-runtime
```

### 2. Démarrer le Frontend

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

## 🔗 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Application React |
| **Supabase API** | http://127.0.0.1:54321 | API REST + GraphQL |
| **Supabase Studio** | http://127.0.0.1:54323 | Interface de gestion de la base de données |
| **PostgreSQL** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Base de données directe |
| **Mailpit** | http://127.0.0.1:54324 | Capture des emails (développement) |

## 📋 Schéma de Base de Données

Le schéma SQL complet est dans `supabase/migrations/001_init_schema.sql` avec :

### Tables Principales
- **membre** : Gestion des membres (nom, prenom, telephone, email, statut)
- **tontine** : Tontines (nom, type, montant_cotisation, periode, statut)
- **seance** : Sessions/réunions (date, lieu, statut, ordre_du_jour)
- **cotisation** : Contributions des membres (montant, statut, date_paiement)
- **credit** : Crédits accordés (montant, taux_interet, solde)
- **penalite** : Pénalités (type_penalite, montant, statut)
- **projet** : Projets communautaires (nom, budget, montant_alloue, statut)
- **tour** : Distribution des gains (numero, montant_distribue)

### Fonctions RPC (Stored Procedures)
- `cloturer_seance(id_seance)` : Clôture une session et génère les pénalités
- `attribuer_gain(id_seance, id_beneficiaire)` : Attribution du tour
- `obtenir_membres_seance(id_seance)` : Liste des membres avec statut de participation
- `valider_presence_membre(id_seance, id_membre, montant_paye)` : Validation de présence
- `enregistrer_absence_membre(id_seance, id_membre)` : Enregistrement d'absence

### Vues
- `v_membre_synthese` : Synthèse financière par membre
- `v_tontine_synthese` : Statistiques par tontine

## 🔑 Variables d'Environnement

Le fichier `.env` est déjà configuré avec :

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛑 Arrêter les Services

```bash
# Arrêter Supabase
sudo supabase stop

# Le frontend s'arrête avec Ctrl+C dans le terminal
```

## 📊 Accès à Supabase Studio

Ouvrez http://127.0.0.1:54323 pour :
- Visualiser et éditer les tables
- Exécuter des requêtes SQL
- Gérer l'authentification
- Voir les logs en temps réel

## 🔧 Commandes Utiles

```bash
# Voir le statut de Supabase
sudo supabase status

# Réinitialiser la base de données
sudo supabase db reset

# Créer une nouvelle migration
supabase migration new nom_migration

# Générer les types TypeScript depuis le schéma
supabase gen types typescript --local > src/types/database.types.ts
```

## 📝 Notes Importantes

1. **Pas de FastAPI** : Le dossier `/server` n'est plus utilisé et peut être supprimé
2. **Docker requis** : Supabase local nécessite Docker Desktop en cours d'exécution
3. **Sudo nécessaire** : Les commandes supabase doivent être exécutées avec `sudo` pour les permissions Docker
4. **Edge Runtime désactivé** : Nous excluons edge-runtime car il cause une erreur 502 sur certaines configurations

## 🐛 Dépannage

**Erreur "Cannot connect to Docker daemon"**
- Assurez-vous que Docker Desktop est démarré

**Erreur 502 au démarrage**
- Utilisez `--exclude edge-runtime` comme dans le script fourni

**Port déjà utilisé**
- Vérifiez qu'aucun autre service n'utilise les ports 54321-54324

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
