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
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface SessionsExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function SessionsExcelExport({ open, onClose }: SessionsExcelExportProps) {
  const { sessions } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = sessions.map((session, index) => {
        const tontine = getTontineById(session.id_tontine);
        return {
          '#': index + 1,
          'Numéro Séance': session.numero_seance,
          'Tontine': tontine?.nom || 'N/A',
          'Date': new Date(session.date).toLocaleDateString('fr-FR'),
          'Lieu': session.lieu || 'N/A',
          'Ordre du Jour': session.ordre_du_jour || 'N/A',
          'Total Cotisations': session.total_cotisations || 0,
          'Total Pénalités': session.total_penalites || 0,
          'Participants': session.nombre_presents || 0,
          'Statut': session.statut,
          'Notes': session.notes || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Séances');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 15 }, // Numéro
        { wch: 25 }, // Tontine
        { wch: 15 }, // Date
        { wch: 25 }, // Lieu
        { wch: 40 }, // Ordre du Jour
        { wch: 18 }, // Total Cotisations
        { wch: 18 }, // Total Pénalités
        { wch: 15 }, // Participants
        { wch: 12 }, // Statut
        { wch: 50 }, // Notes
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `seances_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${sessions.length} séances exportées vers ${fileName}`,
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {sessions.length} séance{sessions.length > 1 ? 's' : ''} prête{sessions.length > 1 ? 's' : ''} à être exportée{sessions.length > 1 ? 's' : ''}
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
                <TableHead>N° Séance</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Cotisations</TableHead>
                <TableHead>Pénalités</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => {
                const tontine = getTontineById(session.id_tontine);
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{session.numero_seance}</TableCell>
                    <TableCell>{tontine?.nom || 'N/A'}</TableCell>
                    <TableCell>{formatDate(new Date(session.date))}</TableCell>
                    <TableCell>{session.lieu || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(session.total_cotisations || 0)}</TableCell>
                    <TableCell>{formatCurrency(session.total_penalites || 0)}</TableCell>
                    <TableCell>{session.nombre_presents || 0}</TableCell>
                    <TableCell>
                      <Badge variant={session.statut === 'terminee' ? 'default' : 'secondary'}>
                        {session.statut}
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
