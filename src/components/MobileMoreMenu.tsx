import { useTranslation } from 'react-i18next';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  AlertTriangle,
  Trophy,
  FolderKanban,
  ArrowLeftRight,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  Globe,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from './theme-provider';

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMoreMenu({ open, onOpenChange }: MobileMoreMenuProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const menuItems = [
    {
      label: t('nav.credits'),
      href: '/credits',
      icon: CreditCard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: t('nav.penalties'),
      href: '/penalties',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: t('nav.tours'),
      href: '/tours',
      icon: Trophy,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: t('nav.projects'),
      href: '/projects',
      icon: FolderKanban,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: t('nav.transactions'),
      href: '/transactions',
      icon: ArrowLeftRight,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
  ];

  const handleLogout = async () => {
    if (confirm(t('auth.confirmLogout') || 'Are you sure you want to logout?')) {
      await signOut();
      onOpenChange(false);
      navigate('/login');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-3xl md:hidden safe-area-pb"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.email || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email || 'admin@tontine.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-4 gap-3 p-5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "p-4 rounded-2xl transition-all",
                        isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/50 ring-2 ring-emerald-500"
                          : item.bgColor
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-emerald-600 dark:text-emerald-400" : item.color
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium text-center",
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Settings Row */}
            <div className="flex items-center justify-around px-5 py-4 border-t border-border/50">
              {/* Download Manual */}
              <a
                href="https://drive.google.com/file/d/1MhpltFfbQSDFukUzGDc3yrHhDXfYTKX_/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-800">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Manuel
                </span>
              </a>
              
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {i18n.language.toUpperCase()}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  )}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {t('common.toggleTheme')}
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 p-2"
              >
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <LogOut className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-xs text-red-500">
                  {t('auth.logout') || 'Logout'}
                </span>
              </button>
            </div>

            {/* Extra bottom padding for safe area */}
            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
