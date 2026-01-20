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
import { useCreditStore } from '@/stores/creditStore';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface CreditsExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsExcelExport({ open, onClose }: CreditsExcelExportProps) {
  const { credits } = useCreditStore();
  const { getMemberById } = useMemberStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = credits.map((credit, index) => {
        const member = getMemberById(credit.id_membre);
        const tontine = credit.id_tontine ? getTontineById(credit.id_tontine) : null;
        return {
          '#': index + 1,
          'Membre': member ? `${member.prenom} ${member.nom}` : 'N/A',
          'Tontine': tontine?.nom || 'N/A',
          'Montant': credit.montant,
          'Taux Intérêt': `${credit.taux_interet}%`,
          'Montant à Rembourser': credit.solde,
          'Déjà Remboursé': credit.montant_rembourse,
          'Reste à Payer': credit.solde - credit.montant_rembourse,
          'Date Demande': new Date(credit.date_demande).toLocaleDateString('fr-FR'),
          'Date Échéance': new Date(credit.date_remboursement_prevue).toLocaleDateString('fr-FR'),
          'Statut': credit.statut,
          'Objet': credit.objet || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Crédits');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 25 }, // Membre
        { wch: 20 }, // Tontine
        { wch: 15 }, // Montant
        { wch: 12 }, // Taux
        { wch: 18 }, // À Rembourser
        { wch: 18 }, // Déjà Remboursé
        { wch: 18 }, // Reste
        { wch: 15 }, // Date Demande
        { wch: 15 }, // Date Échéance
        { wch: 15 }, // Statut
        { wch: 30 }, // Objet
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `credits_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${credits.length} crédits exportés vers ${fileName}`,
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
    const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const getStatusColor = (statut: string) => {
    const colors = {
      en_attente: 'pending',
      approuve: 'approved',
      decaisse: 'approved',
      en_cours: 'repaying',
      rembourse: 'completed',
      en_retard: 'defaulted',
      defaut: 'defaulted',
    };
    return colors[statut as keyof typeof colors] || 'secondary';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {credits.length} crédit{credits.length > 1 ? 's' : ''} prêt{credits.length > 1 ? 's' : ''} à être exporté{credits.length > 1 ? 's' : ''}
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
                <TableHead>Montant</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>À Rembourser</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Date Échéance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit, index) => {
                const member = getMemberById(credit.id_membre);
                const tontine = credit.id_tontine ? getTontineById(credit.id_tontine) : null;
                const balance = credit.solde - credit.montant_rembourse;
                return (
                  <TableRow key={credit.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{member ? `${member.prenom} ${member.nom}` : 'N/A'}</TableCell>
                    <TableCell>{tontine?.nom || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(credit.montant)}</TableCell>
                    <TableCell>{credit.taux_interet}%</TableCell>
                    <TableCell>{formatCurrency(credit.solde)}</TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>{formatDate(credit.date_remboursement_prevue)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(credit.statut) as any}>
                        {credit.statut}
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
