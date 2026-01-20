import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

// Pages
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import Tontines from '@/pages/Tontines';
import Sessions from '@/pages/Sessions';
import Credits from '@/pages/Credits';
import Penalties from '@/pages/Penalties';
import Tours from '@/pages/Tours';
import Projects from '@/pages/Projects';
import Transactions from '@/pages/Transactions';
import LoginPage from '@/pages/Login';

// Layout protégé avec sidebar
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navbar visible only on desktop */}
          <div className="hidden md:block">
            <Navbar />
          </div>
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white dark:bg-neutral-900 border-b border-border/50 w-full">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg flex-shrink-0">
                <img src="/logo.jpeg" alt="Logo" className="w-6 h-6 object-contain rounded" />
              </div>
              <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400 truncate">NjangiTech</span>
            </div>
          </header>
          <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
            <div className="w-full max-w-full px-4 md:px-6 mx-auto md:container">
              {children}
            </div>
          </main>
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
};

export default function App() {
  const { initialize, isInitialized } = useAuthStore();

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <ToastProvider>
      <ErrorBoundary>
        <Routes>
          {/* Route publique - Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Routes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Members />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tontines"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Tontines />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Sessions />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Credits />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/penalties"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Penalties />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tours"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Tours />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Projects />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Transactions />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  );
}
