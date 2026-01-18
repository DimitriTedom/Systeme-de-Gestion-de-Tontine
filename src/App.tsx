import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastProvider } from '@/components/ui/toast-provider';
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
import LoginPage from '@/pages/Login';

// Layout protégé avec sidebar
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <div className="container mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
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
      </Routes>
    </ToastProvider>
  );
}
