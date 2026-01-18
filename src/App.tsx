import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ToastProvider } from '@/components/ui/toast-provider';
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import Tontines from '@/pages/Tontines';
import Sessions from '@/pages/Sessions';
import Credits from '@/pages/Credits';
import Penalties from '@/pages/Penalties';
import Tours from '@/pages/Tours';
import Projects from '@/pages/Projects';

export default function App() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <div className="container mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/tontines" element={<Tontines />} />
                  <Route path="/sessions" element={<Sessions />} />
                  <Route path="/credits" element={<Credits />} />
                  <Route path="/penalties" element={<Penalties />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/projects" element={<Projects />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
