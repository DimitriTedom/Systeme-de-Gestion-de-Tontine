import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AddProjectModal } from '@/components/projects/AddProjectModal';

export default function Projects() {
  const { t } = useTranslation();
  const { projects, deleteProject } = useProjectStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      planned: 'secondary',
      fundraising: 'default',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive',
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
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">{t('projects.noProjects')}</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('projects.addFirstProject')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const tontine = getTontineById(project.tontineId);
            const responsible = project.responsibleMemberId 
              ? getMemberById(project.responsibleMemberId) 
              : null;
            const progress = calculateProgress(project.amountRaised, project.budget);
            const remaining = project.budget - project.amountRaised;

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant={getStatusColor(project.status)}>
                        {t(`projects.statuses.${project.status}`)}
                      </Badge>
                    </div>
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
                        {formatCurrency(project.amountRaised)}
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
                      <span className="font-medium">{tontine?.name}</span>
                    </div>
                    {responsible && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Responsable:</span>
                        <span className="font-medium">
                          {responsible.firstName} {responsible.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date cible:</span>
                      <span className="font-medium">
                        {project.targetDate ? formatDate(project.targetDate) : '-'}
                      </span>
                    </div>
                    {project.completionDate && (
                      <div className="flex justify-between text-green-600">
                        <span>Terminé le:</span>
                        <span className="font-medium">
                          {formatDate(project.completionDate)}
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
    </div>
  );
}

