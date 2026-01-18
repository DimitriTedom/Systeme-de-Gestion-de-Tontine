import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  FolderKanban,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
