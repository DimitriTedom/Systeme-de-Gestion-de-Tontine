import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  FolderKanban,
  PanelLeftClose,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      title: t('nav.dashboard'),
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: t('nav.members'),
      url: '/members',
      icon: Users,
    },
    {
      title: t('nav.tontines'),
      url: '/tontines',
      icon: Building2,
    },
    {
      title: t('nav.sessions'),
      url: '/sessions',
      icon: CalendarDays,
    },
    {
      title: t('nav.credits'),
      url: '/credits',
      icon: CreditCard,
    },
    {
      title: t('nav.penalties'),
      url: '/penalties',
      icon: AlertTriangle,
    },
    {
      title: t('nav.tours'),
      url: '/tours',
      icon: Trophy,
    },
    {
      title: t('nav.projects'),
      url: '/projects',
      icon: FolderKanban,
    },
  ];

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 mb-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                  <img 
                    src="/logo.jpeg" 
                    alt="Tontine Logo" 
                    className="w-7 h-7 object-contain rounded"
                  />
                </div>
                <SidebarGroupLabel className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {t('app.name')}
                </SidebarGroupLabel>
              </div>
              <SidebarTrigger className="ml-auto hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md transition-colors">
                <PanelLeftClose className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </SidebarTrigger>
            </motion.div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                          relative group transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                          }
                        `}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 w-1 h-8 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-r-full"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                          <item.icon 
                            className={`
                              transition-all duration-200
                              ${isActive 
                                ? 'text-emerald-600 dark:text-emerald-400 scale-110' 
                                : 'group-hover:scale-110'
                              }
                            `}
                          />
                          <span className={`transition-all duration-200 ${isActive ? 'text-emerald-700' : 'group-hover:font-medium'}`}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
