import { useState, useEffect } from 'react';
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
import { useTontineStore } from '@/stores/tontineStore';
import { getTontineMembers, type TontineMemberParticipation } from '@/services/tontineService';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface TontinesExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function TontinesExcelExport({ open, onClose }: TontinesExcelExportProps) {
  const { tontines } = useTontineStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [tontineMembers, setTontineMembers] = useState<Map<string, TontineMemberParticipation[]>>(new Map());

  // Fetch all tontine members when modal opens
  useEffect(() => {
    if (open && tontines.length > 0) {
      setIsLoadingData(true);
      const fetchAllMembers = async () => {
        const membersMap = new Map();
        
        for (const tontine of tontines) {
          try {
            const members = await getTontineMembers(tontine.id);
            membersMap.set(tontine.id, members);
          } catch (error) {
            console.error(`Error fetching members for tontine ${tontine.id}:`, error);
            membersMap.set(tontine.id, []);
          }
        }
        
        setTontineMembers(membersMap);
        setIsLoadingData(false);
      };
      
      fetchAllMembers();
    }
  }, [open, tontines]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = tontines.map((tontine, index) => {
        const members = tontineMembers.get(tontine.id) || [];
        const membersList = members.map(m => `${m.prenom} ${m.nom} (${m.nb_parts} part${m.nb_parts > 1 ? 's' : ''})`).join(', ') || 'Aucun';
        const totalExpected = members.reduce((sum, m) => sum + (tontine.montant_cotisation * m.nb_parts), 0);
        
        return {
          '#': index + 1,
          'Nom': tontine.nom,
          'Description': tontine.description || 'N/A',
          'Type': tontine.type,
          'Montant Cotisation': tontine.montant_cotisation,
          'Période': tontine.periode,
          'Date Début': new Date(tontine.date_debut).toLocaleDateString('fr-FR'),
          'Date Fin': tontine.date_fin ? new Date(tontine.date_fin).toLocaleDateString('fr-FR') : 'N/A',
          'Statut': tontine.statut,
          'Nombre de Membres': members.length,
          'Total Attendu par Séance': totalExpected,
          'Membres': membersList,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tontines');

      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 25 }, // Nom
        { wch: 40 }, // Description
        { wch: 12 }, // Type
        { wch: 18 }, // Montant
        { wch: 12 }, // Période
        { wch: 15 }, // Date Début
        { wch: 15 }, // Date Fin
        { wch: 10 }, // Statut
        { wch: 18 }, // Nombre de Membres
        { wch: 22 }, // Total Attendu
        { wch: 60 }, // Membres
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `tontines_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${tontines.length} tontines exportées vers ${fileName}`,
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Aperçu de l'export Excel</DialogTitle>
              <DialogDescription className="mt-2">
                {tontines.length} tontine{tontines.length > 1 ? 's' : ''} prête{tontines.length > 1 ? 's' : ''} à être exportée{tontines.length > 1 ? 's' : ''}
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
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Date Début</TableHead>
                <TableHead>Date Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Membres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tontines.map((tontine, index) => (
                <TableRow key={tontine.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{tontine.nom}</TableCell>
                  <TableCell><Badge variant="outline">{tontine.type}</Badge></TableCell>
                  <TableCell>{formatCurrency(tontine.montant_cotisation)}</TableCell>
                  <TableCell>{tontine.periode}</TableCell>
                  <TableCell>{formatDate(tontine.date_debut)}</TableCell>
                  <TableCell>{formatDate(tontine.date_fin)}</TableCell>
                  <TableCell>
                    <Badge variant={tontine.statut === 'Actif' ? 'default' : 'secondary'}>
                      {tontine.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>{tontine.membres_count || 0}</TableCell>
                </TableRow>
              ))}
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
              disabled={isExporting || isLoadingData}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {isLoadingData ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Chargement des données...
                </>
              ) : isExporting ? (
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
