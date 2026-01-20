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
import { useMemberStore } from '@/stores/memberStore';
import { reportService, type MemberFinancialReport } from '@/services/reportService';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/toast-provider';

interface MembersExcelExportProps {
  open: boolean;
  onClose: () => void;
}

export function MembersExcelExport({ open, onClose }: MembersExcelExportProps) {
  const { members } = useMemberStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [memberDetails, setMemberDetails] = useState<Map<string, { financial: MemberFinancialReport | null, tontines: any[] }>>(new Map());

  // Fetch all member details when modal opens
  useEffect(() => {
    if (open && members.length > 0) {
      setIsLoadingData(true);
      const fetchAllData = async () => {
        const detailsMap = new Map();
        
        for (const member of members) {
          try {
            // Fetch financial data
            const financial = await reportService.getMemberFinancialReport(member.id).catch(() => null);
            
            // Fetch member tontines
            const { data: tontinesData } = await supabase
              .from('participe')
              .select(`
                id_tontine,
                nb_parts,
                statut,
                tontine:id_tontine (
                  nom,
                  type,
                  montant_cotisation,
                  periode,
                  statut
                )
              `)
              .eq('id_membre', member.id)
              .eq('statut', 'actif');
            
            const tontines = (tontinesData || []).map((p: any) => ({
              nom: p.tontine?.nom || '',
              type: p.tontine?.type || '',
              montant_cotisation: p.tontine?.montant_cotisation || 0,
              periode: p.tontine?.periode || '',
              nb_parts: p.nb_parts,
            }));
            
            detailsMap.set(member.id, { financial, tontines });
          } catch (error) {
            console.error(`Error fetching data for member ${member.id}:`, error);
            detailsMap.set(member.id, { financial: null, tontines: [] });
          }
        }
        
        setMemberDetails(detailsMap);
        setIsLoadingData(false);
      };
      
      fetchAllData();
    }
  }, [open, members]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Prepare data for Excel
      const exportData = members.map((member, index) => {
        const details = memberDetails.get(member.id) || { financial: null, tontines: [] };
        const tontinesList = details.tontines.map(t => `${t.nom} (${t.nb_parts} part${t.nb_parts > 1 ? 's' : ''})`).join(', ') || 'Aucune';
        
        return {
          '#': index + 1,
          'Prénom': member.prenom,
          'Nom': member.nom,
          'Email': member.email || 'N/A',
          'Téléphone': member.telephone || 'N/A',
          'Adresse': member.adresse || 'N/A',
          'Date d\'inscription': member.date_inscription 
            ? new Date(member.date_inscription).toLocaleDateString('fr-FR')
            : 'N/A',
          'Statut': member.statut,
          'Nombre de Tontines': details.tontines.length,
          'Tontines': tontinesList,
          'Total Cotisé': details.financial?.total_cotise || 0,
          'Crédits Empruntés': details.financial?.total_emprunte || 0,
          'Pénalités': details.financial?.total_penalites || 0,
          'Total Gagné': details.financial?.total_gagne || 0,
        };
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Membres');

      // Auto-size columns
      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 15 }, // Prénom
        { wch: 15 }, // Nom
        { wch: 25 }, // Email
        { wch: 15 }, // Téléphone
        { wch: 30 }, // Adresse
        { wch: 20 }, // Date d'inscription
        { wch: 10 }, // Statut
        { wch: 15 }, // Nombre de Tontines
        { wch: 50 }, // Tontines
        { wch: 15 }, // Total Cotisé
        { wch: 18 }, // Crédits Empruntés
        { wch: 12 }, // Pénalités
        { wch: 15 }, // Total Gagné
      ];

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `membres_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);

      toast.success('Export réussi', {
        description: `${members.length} membres exportés vers ${fileName}`,
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
                {members.length} membre{members.length > 1 ? 's' : ''} prêt{members.length > 1 ? 's' : ''} à être exporté{members.length > 1 ? 's' : ''}
              </DialogDescription>
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </DialogHeader>

        {/* Preview Table */}
        <div className="flex-1 overflow-auto border rounded-lg mt-4">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, index) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{member.prenom}</TableCell>
                  <TableCell>{member.nom}</TableCell>
                  <TableCell className="text-sm">{member.email || 'N/A'}</TableCell>
                  <TableCell>{member.telephone || 'N/A'}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{member.adresse || 'N/A'}</TableCell>
                  <TableCell>{formatDate(member.date_inscription)}</TableCell>
                  <TableCell>
                    <Badge variant={member.statut === 'Actif' ? 'default' : 'secondary'}>
                      {member.statut}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actions */}
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
