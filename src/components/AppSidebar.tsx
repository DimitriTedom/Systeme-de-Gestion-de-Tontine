import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  FolderKanban,
  AlertTriangle,
  Trophy,
  LogOut,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  AnimatedSidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from '@/components/ui/animated-sidebar';

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      label: t('nav.dashboard'),
      href: '/',
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.members'),
      href: '/members',
      icon: <Users className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.tontines'),
      href: '/tontines',
      icon: <Building2 className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.sessions'),
      href: '/sessions',
      icon: <CalendarDays className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.credits'),
      href: '/credits',
      icon: <CreditCard className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.penalties'),
      href: '/penalties',
      icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.tours'),
      href: '/tours',
      icon: <Trophy className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: t('nav.projects'),
      href: '/projects',
      icon: <FolderKanban className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <AnimatedSidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo />
          <div className="mt-8 flex flex-col gap-1">
            {menuItems.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <SidebarLink
                  key={link.href}
                  link={link}
                  isActive={isActive}
                />
              );
            })}
          </div>
        </div>
        <UserProfile />
      </SidebarBody>
    </AnimatedSidebar>
  );
}

const Logo = () => {
  const { t } = useTranslation();
  const { open } = useSidebar();
  
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
        <img 
          src="/logo.jpeg" 
          alt="Tontine Logo" 
          className="w-7 h-7 object-contain rounded flex-shrink-0"
        />
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="text-lg font-bold text-emerald-700 dark:text-emerald-400 whitespace-pre"
      >
        {t('app.name')}
      </motion.span>
    </div>
  );
};

const UserProfile = () => {
  const { t } = useTranslation();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  
  const handleLogout = async () => {
    if (confirm(t('auth.confirmLogout') || 'Are you sure you want to logout?')) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt={user.email || 'User'} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        <motion.div
          animate={{
            display: open ? "block" : "none",
            opacity: open ? 1 : 0,
          }}
          className="flex-1 overflow-hidden"
        >
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User'}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {user?.email || 'admin@tontine.com'}
          </p>
        </motion.div>
        <motion.button
          animate={{
            display: open ? "flex" : "none",
            opacity: open ? 1 : 0,
          }}
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          title={t('auth.logout') || 'Logout'}
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      </div>
      {!open && (
        <button
          onClick={handleLogout}
          className="w-full p-2 mt-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center"
          title={t('auth.logout') || 'Logout'}
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
