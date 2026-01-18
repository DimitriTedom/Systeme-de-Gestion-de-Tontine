import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { reportService, DetailedMemberFinancialReport } from '@/services/reportService';
import { generateMemberFinancialExcel, downloadExcelFile } from '@/services/excelGenerator';
import { useToast } from '@/components/ui/toast-provider';

interface MemberFinancialExportProps {
  open: boolean;
  onClose: () => void;
  memberId: number;
  memberName: string;
}

export function MemberFinancialExport({ open, onClose, memberId, memberName }: MemberFinancialExportProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<DetailedMemberFinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      // Fetch data if not already loaded
      let data = reportData;
      if (!data) {
        setIsLoading(true);
        data = await reportService.getDetailedMemberFinancialReport(String(memberId));
        setReportData(data);
        setIsLoading(false);
      }

      // Generate Excel
      const excelBlob = await generateMemberFinancialExcel(data);
      
      // Download file
      const filename = `Situation_Financiere_${memberName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadExcelFile(excelBlob, filename);
      
      toast.success('Rapport Excel généré avec succès !');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Erreur lors de la génération du rapport Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadPreviewData = async () => {
    if (reportData) return;
    
    setIsLoading(true);
    try {
      const data = await reportService.getDetailedMemberFinancialReport(String(memberId));
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when dialog opens
  useState(() => {
    if (open) {
      loadPreviewData();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Situation Financière - {memberName}
          </DialogTitle>
          <DialogDescription>
            Export détaillé en format Excel avec mise en forme professionnelle
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Total Cotisations</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.total_contributions.toLocaleString()} XAF
                </p>
              </div>
              
              {reportData.total_debts > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Total Dettes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reportData.total_debts.toLocaleString()} XAF
                  </p>
                </div>
              )}
              
              {reportData.total_penalties > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">Pénalités en attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reportData.total_penalties.toLocaleString()} XAF
                  </p>
                </div>
              )}
              
              <div className={`p-4 border rounded-lg ${
                reportData.net_balance >= 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  reportData.net_balance >= 0 ? 'text-blue-900' : 'text-red-900'
                }`}>
                  Solde Net
                </p>
                <p className={`text-2xl font-bold ${
                  reportData.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {reportData.net_balance.toLocaleString()} XAF
                </p>
              </div>
            </div>

            {/* Details Preview */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contenu du rapport Excel :</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>Section Cotisations :</strong> {reportData.contributions.length} entrée(s) avec dates, tontines et modes de paiement
                  </li>
                  {reportData.credits.length > 0 && (
                    <li>
                      <strong>Section Crédits :</strong> {reportData.credits.length} crédit(s) en cours avec détails des échéances
                    </li>
                  )}
                  {reportData.penalties.length > 0 && (
                    <li>
                      <strong>Section Pénalités :</strong> {reportData.penalties.length} pénalité(s) avec raisons et statuts
                    </li>
                  )}
                  <li>
                    <strong>Calcul automatique :</strong> Solde net = Cotisations - Dettes - Pénalités
                  </li>
                  <li>
                    <strong>Formatage professionnel :</strong> Colonnes colorées (vert pour revenus, rouge pour dettes), montants en XAF, colonnes auto-ajustées
                  </li>
                </ul>
              </div>

              {/* Recent Contributions Preview */}
              {reportData.contributions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Dernières cotisations (aperçu) :</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tontine</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.contributions.slice(0, 5).map((contrib, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-xs">
                              {new Date(contrib.date).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-3 py-2 text-xs">{contrib.tontine}</td>
                            <td className="px-3 py-2 text-xs text-right font-medium">
                              {contrib.montant.toLocaleString()} XAF
                            </td>
                          </tr>
                        ))}
                        {reportData.contributions.length > 5 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-xs text-center text-gray-500">
                              ... et {reportData.contributions.length - 5} autre(s)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button 
                onClick={handleGenerateExcel} 
                disabled={isGenerating}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Télécharger Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
