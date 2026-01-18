# Système de Gestion de Tontine (Tontine Management System)

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Application complète de gestion de tontines avec suivi financier, gestion des membres et analyses détaillées**

**Projet académique - Université de Yaoundé I**  
**Faculté des Sciences - Département d'Informatique**  
**INF2212 : Implémentation des Bases de Données**  
**Janvier 2026**

[Fonctionnalités](#-fonctionnalités) • [Démarrage](#-démarrage-rapide) • [Technologies](#️-stack-technologique) • [Équipe](#-équipe-de-développement)

</div>

---

## 📚 Table des Matières

- [🎯 Contexte du Projet](#-contexte-du-projet)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Stack Technologique](#️-stack-technologique)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [📁 Structure du Projet](#-structure-du-projet)
- [🎨 Interface Utilisateur](#-interface-utilisateur)
- [👥 Équipe de Développement](#-équipe-de-développement)
- [📄 Licence](#-licence)

## 🎯 Contexte du Projet

Ce projet constitue un travail de synthèse pour l'UE **INF2212 (Implémentation des Bases de Données)** à l'Université de Yaoundé I. Il vise à concevoir et implémenter une application complète de gestion d'une tontine, reposant sur une base de données relationnelle.

### Objectifs du Projet

L'application permet de gérer efficacement :
- ✅ Les cotisations périodiques des membres
- ✅ La distribution des gains lors des tours
- ✅ Les crédits internes contractés par les membres
- ✅ L'application de pénalités
- ✅ Le financement de projets collectifs (FIAC)
- ✅ La génération de rapports financiers détaillés

### Types de Tontines Supportées

#### 1. **Tontine de Présence** (Obligatoire)
- Participation obligatoire pour tous les membres
- Cotisation requise à chaque séance
- Suivi automatique des présences et pénalités

#### 2. **Tontines Optionnelles**
- Participation facultative
- Possibilité de souscrire plusieurs parts
- Bénéfice multiple possible selon les parts souscrites
- **Contrainte majeure** : Le montant cumulé perçu ne doit jamais excéder le montant total de cotisation prévu

## ✨ Fonctionnalités

### 📊 **Dashboard & Analytics**
- Vue d'ensemble financière en temps réel avec métriques clés
- Graphiques interactifs avec visualisation en dégradé
- Tendances des cotisations et analyses
- Suivi des activités récentes
- Cartes réactives avec couleurs accent émeraude

### 👥 **Gestion des Membres**
- Répertoire complet des membres avec recherche et pagination
- Vue détaillée des membres avec résumé financier
- Opérations CRUD complètes avec intégration API
- Récupération des données en temps réel depuis Supabase
- Notifications toast pour feedback utilisateur
- Affichage d'avatar avec initiales de secours

### 💳 **Gestion des Tontines**
- Création et gestion de plusieurs tontines avec opérations CRUD complètes
- Vue détaillée des tontines avec informations exhaustives
- Recherche et pagination pour les listes
- Suivi des calendriers et montants de cotisation
- Inscription et suivi de participation des membres
- Badges de statut (actif/terminé)
- Persistance via Supabase

### 💵 **Système de Crédit**
- Soumission et approbation de demandes de crédit
- Calcul automatique des taux d'intérêt
- Suivi des remboursements avec échéancier
- Historique de crédit par membre
- Indicateurs de statut (approuvé, en attente, rejeté)
- Contrôle de la contrainte : montant perçu ≤ montant cotisé

### 📅 **Suivi des Séances**
- Gestion du calendrier des réunions
- Suivi des présences avec pénalités automatiques
- Notes et procès-verbaux de séance
- Collecte des cotisations pendant les séances
- Historique complet des séances
- Clôture de séance avec validation

### 🏗️ **Gestion de Projets**
- Propositions de projets communautaires (FIAC)
- Allocation et suivi budgétaire
- Suivi de l'état d'avancement
- Vote des membres sur les projets
- Rapports de progression

### 🎨 **Interface Moderne**
- Barre latérale rétractable avec thème vert émeraude
- Animations fluides avec Framer Motion
- Support mode sombre/clair
- Design responsive mobile-first
- Composants d'état vide pour meilleure UX
- Validation de formulaires en temps réel

## 🛠️ Stack Technologique

### Frontend
| Catégorie | Technologie | Version | Objectif |
|-----------|-------------|---------|----------|
| **Framework** | React | 18.3.1 | Bibliothèque UI |
| **Langage** | TypeScript | 5.5.3 | Sécurité des types |
| **Build Tool** | Vite | 5.4.8 | Développement & Build rapide |
| **Styling** | TailwindCSS | 3.4.13 | CSS utilitaire |
| **Composants UI** | ShadCN/UI | Latest | Composants pré-construits |
| **State Management** | Zustand | 5.0.0-rc.2 | État global |
| **Forms** | React Hook Form | 7.53.2 | Gestion de formulaires |
| **Validation** | Zod | 3.23.8 | Validation de schéma |
| **Charts** | Recharts | 2.15.0 | Visualisation de données |
| **Animations** | Framer Motion | 11.15.0 | Animations fluides |
| **Icons** | Lucide React | Latest | Bibliothèque d'icônes |
| **i18n** | i18next | 23.16.8 | Internationalisation |
| **Routing** | React Router | 7.1.1 | Navigation |
| **Notifications** | Custom Toast | - | Notifications utilisateur |

### Backend
| Catégorie | Technologie | Version | Objectif |
|-----------|-------------|---------|----------|
| **BaaS** | Supabase | Latest | Backend as a Service |
| **Base de données** | PostgreSQL | 15+ | Persistance des données |
| **Auth** | Supabase Auth | Latest | Authentification |
| **Storage** | Supabase Storage | Latest | Stockage de fichiers |
| **Real-time** | Supabase Realtime | Latest | Synchronisation temps réel |

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm, yarn ou pnpm
- Git
- Compte Supabase (gratuit)
- **Docker & Docker Compose** (optionnel, pour déploiement conteneurisé)

### Option 1: Installation avec Docker 🐳 (Recommandé)

La méthode la plus simple pour déployer l'application:

```bash
# 1. Cloner le projet
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git
cd Systeme-de-Gestion-de-Tontine

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos identifiants Supabase

# 3. Lancer avec Docker Compose
docker-compose up -d

# L'application sera disponible sur http://localhost
```

**📖 Pour plus de détails sur Docker, voir [DOCKER.md](DOCKER.md)**

### Option 2: Installation Manuelle

#### 1. Cloner le Projet
```bash
# Cloner le dépôt
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git

# Naviguer vers le répertoire
cd Systeme-de-Gestion-de-Tontine
```

#### 2. Configuration de Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL et la clé anonyme du projet
3. Exécuter les scripts SQL dans l'éditeur SQL de Supabase (voir `/supabase/migrations/`)

#### 3. Configuration Frontend
- Node.js 18+
- npm, yarn ou pnpm
- Git
- Compte Supabase (gratuit)

### 1. Cloner le Projet
```bash
# Cloner le dépôt
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git

# Naviguer vers le répertoire
cd Systeme-de-Gestion-de-Tontine
```

### 2. Configuration de Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL et la clé anonyme du projet
3. Exécuter les scripts SQL dans l'éditeur SQL de Supabase (voir `/supabase/migrations/`)

### 3. Configuration Frontend
```bash
# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos identifiants Supabase
# VITE_SUPABASE_URL=votre_url_supabase
# VITE_SUPABASE_ANON_KEY=votre_cle_anonyme

# Lancer le serveur de développement
npm run dev

# L'application sera disponible sur http://localhost:5173
```

### 4. Build pour Production
```bash
# Construire l'application
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure du Projet

```
Systeme-de-Gestion-de-Tontine/
├── 📁 public/                     # Ressources statiques
│   └── logo.jpeg                 # Logo de l'application
├── 📁 supabase/                  # Configuration Supabase
│   └── 📁 migrations/            # Scripts SQL de migration
├── 📁 src/                       # Code source frontend
│   ├── 📁 components/            # Composants React
│   │   ├── AppSidebar.tsx       # Barre latérale principale
│   │   ├── Navbar.tsx           # Barre de navigation
│   │   ├── EmptyState.tsx       # Composant état vide
│   │   ├── 📁 auth/             # Composants d'authentification
│   │   ├── 📁 credits/          # Gestion des crédits
│   │   ├── 📁 members/          # Gestion des membres
│   │   ├── 📁 projects/         # Gestion des projets
│   │   ├── 📁 sessions/         # Suivi des séances
│   │   ├── 📁 tontines/         # Gestion des tontines
│   │   └── 📁 ui/               # Composants UI ShadCN
│   ├── 📁 hooks/                # Hooks React personnalisés
│   ├── 📁 i18n/                 # Internationalisation (FR/EN)
│   ├── 📁 lib/                  # Fonctions utilitaires
│   ├── 📁 pages/                # Composants de pages
│   │   ├── Dashboard.tsx        # Tableau de bord
│   │   ├── Members.tsx          # Gestion membres
│   │   ├── Tontines.tsx         # Gestion tontines
│   │   ├── Credits.tsx          # Gestion crédits
│   │   ├── Sessions.tsx         # Suivi séances
│   │   ├── Projects.tsx         # Gestion projets
│   │   ├── Penalties.tsx        # Gestion pénalités
│   │   ├── Tours.tsx            # Gestion tours
│   │   └── Login.tsx            # Page de connexion
│   ├── 📁 stores/               # Stores Zustand
│   │   ├── authStore.ts         # État authentification
│   │   ├── memberStore.ts       # État membres
│   │   ├── tontineStore.ts      # État tontines
│   │   ├── creditStore.ts       # État crédits
│   │   ├── sessionStore.ts      # État séances
│   │   └── ...
│   ├── 📁 types/                # Définitions TypeScript
│   ├── App.tsx                  # Composant principal
│   ├── index.css                # Styles globaux + Tailwind
│   └── main.tsx                 # Point d'entrée
├── 📄 .env                      # Variables d'environnement
├── 📄 .env.example              # Template variables
├── 📄 components.json           # Config ShadCN
├── 📄 package.json              # Dépendances & scripts
├── 📄 tailwind.config.js        # Config TailwindCSS
├── 📄 tsconfig.json             # Config TypeScript
├── 📄 vite.config.ts            # Config Vite
├── 📄 LICENSE                   # Licence MIT
└── 📄 README.md                 # Documentation
```

## 🎨 Interface Utilisateur

### 🌈 **Palette de Couleurs**
- **Primaire** : Vert Émeraude (`emerald-500`, `emerald-600`)
- **Accent** : Nuances de Teal
- **Arrière-plans** : Mode clair/sombre dynamique
- **Dégradés** : Transitions douces émeraude vers teal sur les graphiques

### ✨ **Animations**
- Transitions de page avec Framer Motion
- Barre latérale rétractable fluide
- Effets de survol sur éléments interactifs
- États de chargement et squelettes
- Animations d'entrée pour les modales

### 📱 **Design Responsive**
- Approche mobile-first
- Barre latérale rétractable sur petits écrans
- Tables responsives avec défilement horizontal
- Disposition adaptative des cartes
- Interface tactile conviviale

### 🧩 **Composants Clés**
- **Badges de Statut** : Indicateurs colorés pour différents états
- **États Vides** : Illustrations conviviales quand pas de données
- **Tables de Données** : Tables triables, recherchables avec pagination (10 éléments/page)
- **Graphiques** : Graphiques interactifs avec info-bulles
- **Formulaires** : Formulaires validés avec messages d'erreur en temps réel
- **Cartes** : Cartes surélevées avec dégradés et ombres
- **Panneaux de Détails** : Panneaux coulissants pour informations détaillées
- **Notifications Toast** : Retour utilisateur pour toutes opérations

## 👥 Équipe de Développement

**Projet réalisé par le Groupe INF2212 - Janvier 2026**

### Chef de Projet
**TEDOM TAFOTSI DIMITRI WILFRIED** (Matricule: 23V2180)

### Membres de l'Équipe

| # | Nom | Matricule |
|---|-----|-----------|
| 2 | NBIAH NJOMI ALAN KHALED | 24H2037 |
| 3 | DJOTASSA WAMBA ADRIEN DJERY | 24F2992 |
| 4 | TEKENG KAMWÉLÉ JUNIOR CAMBELL | 23U2686 |
| 5 | ELOUNDOU EMMANUEL RICHARD | 22T2958 |
| 6 | MAMBOUNE NCHOURUPOUO BASMA | 24F2976 |
| 7 | ABDEL ADY TCHALLA .N | 23V2538 |
| 8 | BAKWO NKEN BERNARDIN ULRICH | 23V2277 |
| 9 | KUEPOUO FOKAM ARIOL IDRISS | 23U2815 |
| 10 | MDUTU YOUGOUM MARC SAMUEL | 24G2779 |
| 11 | SARMBOYE PAULINE FIDÈLE | 18S2467 |
| 12 | AMOUGOU MINKOULOU JOSEPH NEIL | 23V2226 |
| 13 | PETANG DANIEL | 23V2121 |
| 14 | DIMITRI DJINKEU DURAND | 23V2285 |
| 15 | TCHEUTCHOUA LENCHE RAISSA | 24F2440 |

### Encadrement Académique
**Professeur** : Etienne Kouokam  
**Cours** : INF2212 - Implémentation des Bases de Données  
**Institution** : Université de Yaoundé I - Faculté des Sciences - Département d'Informatique

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Développé avec ❤️ par l'équipe INF2212**

**Université de Yaoundé I - Faculté des Sciences**  
**Département d'Informatique - Janvier 2026**

</div>

