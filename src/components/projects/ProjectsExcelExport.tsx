import { useState } from 'react';
import { FileSpreadsheet, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface ProjectsExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectsExcelExport({ open, onClose }: ProjectsExcelExportProps) {
  const { projects } = useProjectStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = projects.map((project, index) => {
        const tontine = getTontineById(project.id_tontine);
        const responsible = project.id_responsable ? getMemberById(project.id_responsable) : null;
        const progress = Math.min(100, (project.montant_alloue / project.budget) * 100);
        return {
          '#': index + 1,
          'Nom': project.nom,
          'Description': project.description || 'N/A',
          'Tontine': tontine?.nom || 'N/A',
          'Budget': project.budget,
          'Montant Alloué': project.montant_alloue,
          'Reste': project.budget - project.montant_alloue,
          'Progression': `${progress.toFixed(0)}%`,
          'Responsable': responsible ? `${responsible.prenom} ${responsible.nom}` : 'N/A',
          'Date Cible': project.date_cible ? new Date(project.date_cible).toLocaleDateString('fr-FR') : 'N/A',
          'Date Fin': project.date_fin_reelle ? new Date(project.date_fin_reelle).toLocaleDateString('fr-FR') : 'N/A',
          'Statut': project.statut,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Projets');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 25 }, // Nom
        { wch: 40 }, // Description
        { wch: 20 }, // Tontine
        { wch: 15 }, // Budget
        { wch: 18 }, // Alloué
        { wch: 15 }, // Reste
        { wch: 12 }, // Progression
        { wch: 25 }, // Responsable
        { wch: 15 }, // Date Cible
        { wch: 15 }, // Date Fin
        { wch: 15 }, // Statut
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `projets_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${projects.length} projets exportés vers ${fileName}`,
      });

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur d\'export', {
        description: 'Impossible d\'exporter les données',
      });
    } finally {
      setIsExporting(false);
    }
  };

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
      termine: 'outline',
      annule: 'destructive',
    };
    return colors[status] || 'secondary';
  };

  const calculateProgress = (amountRaised: number, budget: number) => {
    return Math.min(100, (amountRaised / budget) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {projects.length} projet{projects.length > 1 ? 's' : ''} prêt{projects.length > 1 ? 's' : ''} à être exporté{projects.length > 1 ? 's' : ''}
              </DialogDescription>
            </div>
            {/* <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg mt-4">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Alloué</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Date Cible</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project, index) => {
                const tontine = getTontineById(project.id_tontine);
                const responsible = project.id_responsable ? getMemberById(project.id_responsable) : null;
                const progress = calculateProgress(project.montant_alloue, project.budget);
                const remaining = project.budget - project.montant_alloue;
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{project.nom}</TableCell>
                    <TableCell>{tontine?.nom || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(project.budget)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(project.montant_alloue)}</TableCell>
                    <TableCell className="text-orange-600">{formatCurrency(remaining)}</TableCell>
                    <TableCell>{progress.toFixed(0)}%</TableCell>
                    <TableCell>{responsible ? `${responsible.prenom} ${responsible.nom}` : 'N/A'}</TableCell>
                    <TableCell>{formatDate(project.date_cible)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusColor(project.statut)}
                        className={project.statut === 'termine' ? 'bg-green-600 text-white border-green-600' : ''}
                      >
                        {project.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            Format: Excel (.xlsx)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter vers Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
