#!/bin/bash
# Script de démarrage de Supabase local pour le projet NjangiTech

echo "🚀 Démarrage de Supabase local..."
echo ""

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution."
    echo "   Veuillez démarrer Docker Desktop et réessayer."
    exit 1
fi

# Démarrer Supabase (sans edge-runtime pour éviter l'erreur 502)
echo "📦 Démarrage des conteneurs Supabase..."
sudo supabase start --exclude edge-runtime

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Supabase est démarré avec succès !"
    echo ""
    echo "📊 Accès aux services :"
    echo "   - API URL:      http://127.0.0.1:54321"
    echo "   - Studio URL:   http://127.0.0.1:54323"
    echo "   - Database:     postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    echo ""
    echo "🔑 Clés d'authentification (déjà configurées dans .env) :"
    echo "   - Anon Key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    echo "💡 Pour arrêter Supabase, utilisez : sudo supabase stop"
else
    echo ""
    echo "❌ Erreur lors du démarrage de Supabase"
    exit 1
fi
