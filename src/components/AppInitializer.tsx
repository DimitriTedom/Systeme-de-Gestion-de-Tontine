import { useEffect, useRef } from 'react';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCreditStore } from '@/stores/creditStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useContributionStore } from '@/stores/contributionStore';
import { useTourStore } from '@/stores/tourStore';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * AppInitializer component
 * Fetches initial data from the API when the app loads.
 * Wraps the app and ensures stores are populated with backend data.
 */
export function AppInitializer({ children }: AppInitializerProps) {
  const initialized = useRef(false);
  
  const fetchMembers = useMemberStore((state) => state.fetchMembers);
  const fetchTontines = useTontineStore((state) => state.fetchTontines);
  const fetchSessions = useSessionStore((state) => state.fetchSessions);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchCredits = useCreditStore((state) => state.fetchCredits);
  const fetchPenalties = usePenaltyStore((state) => state.fetchPenalties);
  const fetchContributions = useContributionStore((state) => state.fetchContributions);
  const fetchTours = useTourStore((state) => state.fetchTours);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    const initializeApp = async () => {
      console.log('🚀 Initializing app data...');
      
      try {
        // Fetch all initial data in parallel
        await Promise.allSettled([
          fetchMembers(),
          fetchTontines(),
          fetchSessions(),
          fetchProjects(),
          fetchCredits(),
          fetchPenalties(),
          fetchContributions(),
          fetchTours(),
        ]);
        
        console.log('✅ App data initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize app data:', error);
        // App will still render with empty states
      }
    };

    initializeApp();
  }, [fetchMembers, fetchTontines, fetchSessions, fetchProjects, fetchCredits, fetchPenalties, fetchContributions, fetchTours]);

  return <>{children}</>;
}

export default AppInitializer;
