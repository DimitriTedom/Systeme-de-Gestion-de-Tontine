import { useState } from 'react';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, Eye } from 'lucide-react';
import { SessionReportDocument, AGSynthesisDocument } from '../../services/pdfGenerator';
import { SessionReportData, AGSynthesisReport } from '@/services/reportService';

interface SessionReportViewerProps {
  open: boolean;
  onClose: () => void;
  data: SessionReportData | null;
  isLoading: boolean;
}

export function SessionReportViewer({ open, onClose, data, isLoading }: SessionReportViewerProps) {
  const [showPreview, setShowPreview] = useState(true); // Show preview by default

  if (!data) return null;

  const handlePrint = async () => {
    const blob = await pdf(<SessionReportDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  };

  const filename = `Rapport_Seance_${data.session.numero_seance}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rapport de Séance N° {data.session.numero_seance}</DialogTitle>
          <DialogDescription>
            {data.tontine.nom_tontine} - {data.session.date_seance ? new Date(data.session.date_seance).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Génération du rapport en cours...</p>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap border-b pb-4">
              <Button
                variant={showPreview ? "default" : "outline"}
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Masquer Aperçu' : 'Afficher Aperçu'}
              </Button>

              <PDFDownloadLink
                document={<SessionReportDocument data={data} />}
                fileName={filename}
                className="inline-flex"
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading} className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Télécharger PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>

              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>

              <Button variant="ghost" onClick={onClose} className="ml-auto">
                Fermer
              </Button>
            </div>

            {/* PDF Preview */}
            {showPreview && (
              <div className="border rounded-lg overflow-hidden flex-1 bg-gray-100" style={{ minHeight: '600px' }}>
                <PDFViewer width="100%" height="100%" showToolbar={true}>
                  <SessionReportDocument data={data} />
                </PDFViewer>
              </div>
            )}

            {/* Summary Info */}
            {!showPreview && (
              <div className="space-y-4 overflow-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Lieu</p>
                    <p className="text-sm font-semibold">{data.session.lieu || 'Non spécifié'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Présents</p>
                    <p className="text-sm font-semibold">{data.session.nombre_presents} membres</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Cotisations</p>
                    <p className="text-lg font-bold text-emerald-700">{data.session.total_cotisations.toLocaleString()} XAF</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Pénalités</p>
                    <p className="text-lg font-bold text-orange-600">{data.session.total_penalites.toLocaleString()} XAF</p>
                  </div>
                  {data.beneficiary && (
                    <>
                      <div className="col-span-2 space-y-1">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Bénéficiaire du Tour</p>
                        <p className="text-sm font-semibold">
                          {data.beneficiary.prenom} {data.beneficiary.nom}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {data.beneficiary.montant_recu.toLocaleString()} XAF
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Contributions</p>
                    <p className="text-2xl font-bold text-emerald-600">{data.contributions.length}</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Pénalités</p>
                    <p className="text-2xl font-bold text-orange-600">{data.penalties.length}</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Absences</p>
                    <p className="text-2xl font-bold text-red-600">{data.absences.length}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Astuce :</strong> Cliquez sur "Afficher Aperçu" pour voir le rapport PDF complet avant de le télécharger ou l'imprimer.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AGReportViewerProps {
  open: boolean;
  onClose: () => void;
  data: AGSynthesisReport | null;
  isLoading: boolean;
}

export function AGReportViewer({ open, onClose, data, isLoading }: AGReportViewerProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!data) return null;

  const handlePrint = async () => {
    const blob = await pdf(<AGSynthesisDocument data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  };

  const filename = `Synthese_AG_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Synthèse Assemblée Générale</DialogTitle>
          <DialogDescription>
            Rapport complet - Généré le {new Date().toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showPreview ? "default" : "outline"}
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Masquer Aperçu' : 'Aperçu'}
              </Button>

              <PDFDownloadLink
                document={<AGSynthesisDocument data={data} />}
                fileName={filename}
                className="inline-flex"
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Télécharger PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>

              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>

            {/* PDF Preview */}
            {showPreview && (
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <PDFViewer width="100%" height="100%" showToolbar={true}>
                  <AGSynthesisDocument data={data} />
                </PDFViewer>
              </div>
            )}

            {/* Summary Info */}
            {!showPreview && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Caisse en Main</p>
                  <p className="text-lg font-bold text-primary">{data.dashboard.cash_in_hand.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cotisations</p>
                  <p className="text-lg font-semibold">{data.dashboard.total_contributions.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membres Actifs</p>
                  <p className="text-sm">{data.dashboard.active_members} / {data.dashboard.total_members}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crédits en cours</p>
                  <p className="text-sm">{data.dashboard.total_credits_remaining.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Projets</p>
                  <p className="text-sm">{data.projects.list.length} projet(s) - {data.projects.total_allocated.toLocaleString()} XAF alloués</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Caisse de Secours</p>
                  <p className="text-sm">{data.emergency_fund.amount.toLocaleString()} XAF ({data.emergency_fund.percentage.toFixed(1)}%)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
