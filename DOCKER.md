# 🐳 Déploiement Docker - Système de Gestion de Tontine

## Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+
- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))

## 🚀 Installation Rapide

### 1. Cloner le Projet

```bash
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git
cd Systeme-de-Gestion-de-Tontine
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL du projet et la clé anonyme (anon key)
3. Exécuter les scripts SQL dans l'éditeur SQL de Supabase (dossier `/supabase/migrations/`)

### 3. Configuration de l'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos identifiants Supabase
nano .env  # ou vim, code, etc.
```

Remplir les variables suivantes dans `.env`:
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_ici
VITE_NODE_ENV=production
```

### 4. Lancer l'Application

```bash
# Construire et démarrer les conteneurs
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f tontine-app
```

L'application sera accessible sur **http://localhost**

## 📦 Commandes Docker Compose

### Démarrage
```bash
# Démarrer en arrière-plan
docker-compose up -d

# Démarrer avec logs
docker-compose up
```

### Arrêt
```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### Maintenance
```bash
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Reconstruire après modifications
docker-compose up -d --build

# Voir l'état des conteneurs
docker-compose ps
```

### Debugging
```bash
# Accéder au shell du conteneur
docker-compose exec tontine-app sh

# Voir les logs détaillés
docker-compose logs --tail=100 -f tontine-app
```

## 🐋 Build Docker Classique

Si vous préférez utiliser Docker sans Docker Compose:

```bash
# Build l'image
docker build \
  --build-arg VITE_SUPABASE_URL=https://votre-projet.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=votre_cle_anonyme \
  -t tontine-app:latest .

# Lancer le conteneur
docker run -d \
  --name tontine-management \
  -p 80:80 \
  tontine-app:latest

# Voir les logs
docker logs -f tontine-management

# Arrêter
docker stop tontine-management
docker rm tontine-management
```

## 🌐 Déploiement en Production

### Option 1: VPS avec Docker

```bash
# Sur votre serveur
git clone https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine.git
cd Systeme-de-Gestion-de-Tontine

# Configuration
cp .env.example .env
nano .env  # Remplir avec vos identifiants

# Lancer
docker-compose up -d

# Configurer nginx reverse proxy (optionnel)
# Exemple: proxy_pass http://localhost:80;
```

### Option 2: Cloud Platforms

#### Heroku
```bash
heroku container:login
heroku create votre-app-tontine
heroku container:push web -a votre-app-tontine
heroku container:release web -a votre-app-tontine
```

#### DigitalOcean App Platform
1. Connecter le dépôt GitHub
2. Sélectionner Dockerfile
3. Configurer les variables d'environnement
4. Déployer

#### Render
1. Nouveau Web Service
2. Connecter le dépôt
3. Docker comme environnement
4. Ajouter les variables d'environnement
5. Déployer

## 🔒 Sécurité

- Les variables d'environnement sensibles sont passées via build args
- Conteneur exécuté avec utilisateur non-root
- Headers de sécurité configurés dans nginx
- Health checks activés

## 🛠️ Résolution de Problèmes

### Le conteneur ne démarre pas
```bash
# Vérifier les logs
docker-compose logs tontine-app

# Vérifier la configuration
docker-compose config

# Reconstruire complètement
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Erreur de connexion Supabase
- Vérifier que les identifiants dans `.env` sont corrects
- S'assurer que le projet Supabase est actif
- Vérifier les politiques RLS (Row Level Security) dans Supabase

### Port 80 déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "8080:80"  # Utiliser le port 8080 à la place

# Ou arrêter le service utilisant le port 80
sudo systemctl stop apache2  # ou nginx
```

## 📊 Monitoring

### Health Check
```bash
# Vérifier la santé du conteneur
docker inspect --format='{{.State.Health.Status}}' tontine-management-app

# Via Docker Compose
docker-compose ps
```

### Métriques
```bash
# Utilisation des ressources
docker stats tontine-management-app
```

## 🔄 Mise à Jour

```bash
# Récupérer les dernières modifications
git pull origin main

# Reconstruire et redémarrer
docker-compose up -d --build

# Vérifier
docker-compose ps
docker-compose logs -f tontine-app
```

## 📝 Support

Pour toute question ou problème:
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation Supabase

---

**Développé par l'équipe INF2212 - Université de Yaoundé I**
