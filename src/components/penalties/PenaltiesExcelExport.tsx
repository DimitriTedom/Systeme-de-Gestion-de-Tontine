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
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface PenaltiesExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function PenaltiesExcelExport({ open, onClose }: PenaltiesExcelExportProps) {
  const { penalties } = usePenaltyStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = penalties.map((penalty, index) => {
        const member = getMemberById(penalty.id_membre);
        const session = penalty.id_seance ? getSessionById(penalty.id_seance) : null;
        const tontine = penalty.id_tontine ? getTontineById(penalty.id_tontine) : null;
        return {
          '#': index + 1,
          'Membre': member ? `${member.prenom} ${member.nom}` : 'N/A',
          'Tontine': tontine?.nom || 'N/A',
          'Séance': session?.numero_seance || 'N/A',
          'Type': penalty.type_penalite,
          'Montant': penalty.montant,
          'Montant Payé': penalty.montant_paye || 0,
          'Reste à Payer': penalty.montant - (penalty.montant_paye || 0),
          'Motif': penalty.raison || 'N/A',
          'Date': new Date(penalty.date).toLocaleDateString('fr-FR'),
          'Statut': penalty.statut,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pénalités');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 25 }, // Membre
        { wch: 20 }, // Tontine
        { wch: 10 }, // Séance
        { wch: 20 }, // Type
        { wch: 15 }, // Montant
        { wch: 15 }, // Payé
        { wch: 15 }, // Reste
        { wch: 40 }, // Motif
        { wch: 15 }, // Date
        { wch: 15 }, // Statut
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `penalites_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${penalties.length} pénalités exportées vers ${fileName}`,
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

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye':
        return 'success';
      case 'non_paye':
        return 'warning';
      case 'partiellement_paye':
        return 'default';
      case 'annule':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {penalties.length} pénalité{penalties.length > 1 ? 's' : ''} prête{penalties.length > 1 ? 's' : ''} à être exportée{penalties.length > 1 ? 's' : ''}
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
                <TableHead>Membre</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penalties.map((penalty, index) => {
                const member = getMemberById(penalty.id_membre);
                const tontine = penalty.id_tontine ? getTontineById(penalty.id_tontine) : null;
                const balance = penalty.montant - (penalty.montant_paye || 0);
                return (
                  <TableRow key={penalty.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{member ? `${member.prenom} ${member.nom}` : 'N/A'}</TableCell>
                    <TableCell>{tontine?.nom || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{penalty.type_penalite}</Badge></TableCell>
                    <TableCell>{formatCurrency(penalty.montant)}</TableCell>
                    <TableCell>{formatCurrency(penalty.montant_paye || 0)}</TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>{formatDate(penalty.date)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(penalty.statut) as any}>
                        {penalty.statut}
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
