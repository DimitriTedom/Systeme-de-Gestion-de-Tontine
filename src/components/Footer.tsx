import { Heart, Github, BookOpen } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-950 mt-auto">
      <div className="container mx-auto px-4 py-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>© {currentYear} NjangiTech</span>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <a 
              href="https://drive.google.com/file/d/1MhpltFfbQSDFukUzGDc3yrHhDXfYTKX_/view?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Télécharger le manuel d'utilisation"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Manuel</span>
            </a>
            
            <a 
              href="https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Voir le code source sur GitHub"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Version 1.0.0
            </p>
          </div>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} NjangiTech</span>
              <span className="hidden sm:inline">•</span>
              <span>Système de Gestion de Tontine</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Développé avec</span>
                <Heart className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                <span>pour le TP 221 de Base de Données</span>
              </div>
              
              <a 
                href="https://drive.google.com/file/d/1MhpltFfbQSDFukUzGDc3yrHhDXfYTKX_/view?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Télécharger le manuel d'utilisation"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Manuel</span>
              </a>
              
              <a 
                href="https://github.com/DimitriTedom/Systeme-de-Gestion-de-Tontine" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Voir le code source sur GitHub"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/50 text-center">
            <p className="text-xs text-muted-foreground">
              Version 1.0.0 | Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
