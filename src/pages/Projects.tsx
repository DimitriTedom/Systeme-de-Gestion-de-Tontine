import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Briefcase, Edit, FolderKanban, Target } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import { EditProjectModal } from '@/components/projects/EditProjectModal';

export default function Projects() {
  const { t } = useTranslation();
  const { projects, deleteProject } = useProjectStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

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

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      planifie: 'secondary',
      collecte_fonds: 'default',
      en_cours: 'default',
      termine: 'default',
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
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('projects.addProject')}
        </Button>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const tontine = getTontineById(project.id_tontine);
            const responsible = project.id_responsable 
              ? getMemberById(project.id_responsable) 
              : null;
            const progress = calculateProgress(project.montant_alloue, project.budget);
            const remaining = project.budget - project.montant_alloue;

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{project.nom}</CardTitle>
                      <Badge variant={getStatusColor(project.statut)}>
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
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer ce projet?')) {
                            deleteProject(project.id);
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
            );
          })}
        </div>
      )}

      <AddProjectModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <EditProjectModal 
        projectId={editProjectId} 
        open={!!editProjectId} 
        onOpenChange={(open) => !open && setEditProjectId(null)} 
      />
    </div>
  );
}

