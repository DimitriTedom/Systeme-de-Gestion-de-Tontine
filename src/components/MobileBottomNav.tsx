import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MobileMoreMenu } from './MobileMoreMenu';

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  // Primary nav items (max 5 for bottom nav)
  const primaryItems = [
    {
      label: t('nav.dashboard'),
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: t('nav.members'),
      href: '/members',
      icon: Users,
    },
    {
      label: t('nav.tontines'),
      href: '/tontines',
      icon: Building2,
    },
    {
      label: t('nav.sessions'),
      href: '/sessions',
      icon: CalendarDays,
    },
  ];

  // Check if current path is in "more" menu
  const moreRoutes = ['/credits', '/penalties', '/tours', '/projects', '/transactions'];
  const isMoreActive = moreRoutes.includes(location.pathname);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-neutral-900 border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative flex flex-col items-center justify-center flex-1 py-2"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    isActive
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium truncate max-w-[60px]",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-0 right-0 flex justify-center"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                  </motion.div>
                )}
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className="relative flex flex-col items-center justify-center flex-1 py-2"
          >
            <motion.div
              initial={false}
              animate={{
                scale: isMoreActive ? 1.1 : 1,
                y: isMoreActive ? -2 : 0,
              }}
              className={cn(
                "p-2 rounded-xl transition-colors",
                isMoreActive
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
            </motion.div>
            <span
              className={cn(
                "text-[10px] mt-1 font-medium",
                isMoreActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {t('nav.more') || 'Plus'}
            </span>
            {isMoreActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute top-0 left-0 right-0 flex justify-center"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              </motion.div>
            )}
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <MobileMoreMenu open={showMore} onOpenChange={setShowMore} />
    </>
  );
}
