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
import { useTourStore } from '@/stores/tourStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface ToursExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function ToursExcelExport({ open, onClose }: ToursExcelExportProps) {
  const { tours } = useTourStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = tours.map((tour, index) => {
        const beneficiary = getMemberById(tour.beneficiaryId);
        const session = tour.sessionId ? getSessionById(tour.sessionId) : null;
        const tontine = getTontineById(tour.tontineId);
        
        return {
          '#': index + 1,
          'Numéro de Tour': tour.tourNumber,
          'Bénéficiaire': tour.beneficiaryName || (beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : 'N/A'),
          'Email': beneficiary?.email || 'N/A',
          'Téléphone': beneficiary?.telephone || 'N/A',
          'Tontine': tontine?.nom || 'N/A',
          'Type Tontine': tontine?.type || 'N/A',
          'Séance': session ? `#${session.numero_seance}` : 'N/A',
          'Date Séance': session ? new Date(session.date).toLocaleDateString('fr-FR') : 'N/A',
          'Montant': tour.amount,
          'Date Distribution': tour.date ? new Date(tour.date).toLocaleDateString('fr-FR') : 'N/A',
          'Notes': tour.notes || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tours et Gains');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 15 }, // Numéro
        { wch: 25 }, // Bénéficiaire
        { wch: 25 }, // Email
        { wch: 15 }, // Téléphone
        { wch: 25 }, // Tontine
        { wch: 15 }, // Type
        { wch: 12 }, // Séance
        { wch: 15 }, // Date Séance
        { wch: 18 }, // Montant
        { wch: 18 }, // Date Distribution
        { wch: 40 }, // Notes
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `tours_gains_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${tours.length} tours exportés vers ${fileName}`,
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

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {tours.length} tour{tours.length > 1 ? 's' : ''} prêt{tours.length > 1 ? 's' : ''} à être exporté{tours.length > 1 ? 's' : ''}
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
                <TableHead>N° Tour</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Séance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.map((tour, index) => {
                const beneficiary = getMemberById(tour.beneficiaryId);
                const session = tour.sessionId ? getSessionById(tour.sessionId) : null;
                const tontine = getTontineById(tour.tontineId);
                return (
                  <TableRow key={tour.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        #{tour.tourNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tour.beneficiaryName || (beneficiary ? `${beneficiary.prenom} ${beneficiary.nom}` : 'N/A')}
                    </TableCell>
                    <TableCell>{tontine?.nom || 'N/A'}</TableCell>
                    <TableCell>{session ? `Séance #${session.numero_seance}` : '-'}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(tour.amount)}
                    </TableCell>
                    <TableCell>{formatDate(tour.date)}</TableCell>
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
