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
  const [showPreview, setShowPreview] = useState(false);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Rapport de Séance N° {data.session.numero_seance}</DialogTitle>
          <DialogDescription>
            {data.tontine.nom_tontine} - {data.session.date_seance ? new Date(data.session.date_seance).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
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
                document={<SessionReportDocument data={data} />}
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
                  <SessionReportDocument data={data} />
                </PDFViewer>
              </div>
            )}

            {/* Summary Info */}
            {!showPreview && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                  <p className="text-sm">{data.session.lieu || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Présents</p>
                  <p className="text-sm">{data.session.nombre_presents}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cotisations</p>
                  <p className="text-sm font-semibold">{data.session.total_cotisations.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pénalités</p>
                  <p className="text-sm font-semibold">{data.session.total_penalites.toLocaleString()} XAF</p>
                </div>
                {data.beneficiary && (
                  <>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Bénéficiaire du Tour</p>
                      <p className="text-sm font-semibold">
                        {data.beneficiary.prenom} {data.beneficiary.nom} - {data.beneficiary.montant_recu.toLocaleString()} XAF
                      </p>
                    </div>
                  </>
                )}
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
