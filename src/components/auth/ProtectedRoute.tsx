import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Afficher un loader pendant l'initialisation
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};

// Composant inverse : redirige vers le dashboard si déjà connecté
interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Afficher un loader pendant l'initialisation
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Rediriger vers le dashboard si déjà authentifié
  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
