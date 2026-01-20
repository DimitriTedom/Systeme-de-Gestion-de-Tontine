import { Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from './theme-provider';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Navbar() {
  const { setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-1 shadow-md">
              <img 
                src="/logo.jpeg" 
                alt="Tontine Logo" 
                className="w-full h-full object-contain rounded"
              />
            </div>
            <span className="font-bold text-xl">{t('app.name')}</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center gap-2">
            <NotificationBell />
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={t('common.switchLanguage')}
            >
              <Globe className="h-5 w-5" />
              <span className="ml-1 text-xs">
                {i18n.language.toUpperCase()}
              </span>
              <span className="sr-only">{t('common.switchLanguage')}</span>
            </Button>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('common.toggleTheme')}>
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">{t('common.toggleTheme')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  {t('theme.light')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  {t('theme.dark')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
