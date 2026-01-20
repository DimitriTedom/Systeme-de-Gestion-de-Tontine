import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Briefcase, Edit, FolderKanban, Target, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import { EditProjectModal } from '@/components/projects/EditProjectModal';
import { ProjectsExcelExport } from '@/components/projects/ProjectsExcelExport';

export default function Projects() {
  const { t } = useTranslation();
  const { projects, deleteProject } = useProjectStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      planifie: 'secondary',
      collecte_fonds: 'default',
      en_cours: 'default',
      termine: 'outline', // Vert via className personnalisée
      annule: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  const calculateProgress = (amountRaised: number, budget: number) => {
    return Math.min(100, (amountRaised / budget) * 100);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('projects.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Suivez la progression des projets communautaires (FIAC)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('projects.addProject')}
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={projects.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <InteractiveEmptyState
              title={t('projects.noProjects')}
              description="Financez des projets collectifs pour développer votre communauté et atteindre vos objectifs communs."
              icons={[
                <Briefcase key="1" className="h-6 w-6" />,
                <FolderKanban key="2" className="h-6 w-6" />,
                <Target key="3" className="h-6 w-6" />
              ]}
              action={{
                label: t('projects.addFirstProject'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedProjects.map((project, index) => {
            const tontine = getTontineById(project.id_tontine);
            const responsible = project.id_responsable 
              ? getMemberById(project.id_responsable) 
              : null;
            const progress = calculateProgress(project.montant_alloue, project.budget);
            const remaining = project.budget - project.montant_alloue;

            // Determine card theme based on status
            const getCardTheme = () => {
              switch (project.statut) {
                case 'termine':
                  return {
                    gradient: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
                    shadow: 'hover:shadow-green-400/50 dark:hover:shadow-green-600/50',
                    iconBg: 'from-green-200 to-green-300 dark:from-green-800 dark:to-green-700',
                    iconColor: 'text-green-700 dark:text-green-300',
                  };
                case 'en_cours':
                  return {
                    gradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
                    shadow: 'hover:shadow-blue-400/50 dark:hover:shadow-blue-600/50',
                    iconBg: 'from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700',
                    iconColor: 'text-blue-700 dark:text-blue-300',
                  };
                case 'collecte_fonds':
                  return {
                    gradient: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900',
                    shadow: 'hover:shadow-orange-400/50 dark:hover:shadow-orange-600/50',
                    iconBg: 'from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-700',
                    iconColor: 'text-orange-700 dark:text-orange-300',
                  };
                case 'annule':
                  return {
                    gradient: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
                    shadow: 'hover:shadow-red-400/50 dark:hover:shadow-red-600/50',
                    iconBg: 'from-red-200 to-red-300 dark:from-red-800 dark:to-red-700',
                    iconColor: 'text-red-700 dark:text-red-300',
                  };
                default: // planifie
                  return {
                    gradient: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
                    shadow: 'hover:shadow-purple-400/50 dark:hover:shadow-purple-600/50',
                    iconBg: 'from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-700',
                    iconColor: 'text-purple-700 dark:text-purple-300',
                  };
              }
            };

            const theme = getCardTheme();

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card className={`flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-2xl ${theme.shadow} transition-all duration-300 bg-gradient-to-br ${theme.gradient}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{project.nom}</CardTitle>
                        <Badge 
                          variant={getStatusColor(project.statut)}
                          className={project.statut === 'termine' ? 'bg-green-600 text-white border-green-600' : ''}
                        >
                          {t(`projects.statuses.${project.statut}`)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditProjectId(project.id)}
                          title="Mettre à jour le projet"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce projet?')) {
                              try {
                                await deleteProject(project.id);
                                toast.success('Projet supprimé', {
                                  description: `${project.nom} a été supprimé avec succès`,
                                });
                              } catch (error) {
                                toast.error('Erreur', {
                                  description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
                                });
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('projects.fundingProgress')}
                        </span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-green-600">
                          {formatCurrency(project.montant_alloue)}
                        </span>
                        <span className="text-muted-foreground">
                          / {formatCurrency(project.budget)}
                        </span>
                      </div>
                      {remaining > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Reste à collecter: {formatCurrency(remaining)}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tontine:</span>
                        <span className="font-medium">{tontine?.nom}</span>
                      </div>
                      {responsible && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responsable:</span>
                          <span className="font-medium">
                            {responsible.prenom} {responsible.nom}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date cible:</span>
                        <span className="font-medium">
                          {project.date_cible ? formatDate(project.date_cible) : '-'}
                        </span>
                      </div>
                      {project.date_fin_reelle && (
                        <div className="flex justify-between text-green-600">
                          <span>Terminé le:</span>
                          <span className="font-medium">
                            {formatDate(project.date_fin_reelle)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            {/* Results info */}
            <div className="text-sm text-muted-foreground">
              {t('common.showing')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, projects.length)} {t('common.of')} {projects.length} projets
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{t('common.previous')}</span>
              </Button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                    
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsisBefore && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="min-w-[2.5rem]"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              {/* Mobile: Current page indicator */}
              <div className="sm:hidden text-sm">
                {currentPage} / {totalPages}
              </div>

              {/* Next button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="hidden sm:inline mr-1">{t('common.next')}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </>
      )}

      <AddProjectModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <EditProjectModal 
        projectId={editProjectId} 
        open={!!editProjectId} 
        onOpenChange={(open) => !open && setEditProjectId(null)} 
      />

      <ProjectsExcelExport
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

