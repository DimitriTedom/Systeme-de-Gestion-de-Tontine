import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, FileText, Calendar, FileDown, CalendarClock, CalendarDays } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddSessionModal } from '@/components/sessions/AddSessionModal';
import { MeetingSheet } from '@/components/sessions/MeetingSheet';
import { SessionReportViewer } from '@/components/reports/ReportViewers';
import { reportService, SessionReportData } from '@/services/reportService';
import { useToast } from '@/components/ui/toast-provider';

export default function Sessions() {
  const { t } = useTranslation();
  const { sessions, deleteSession } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reportSessionId, setReportSessionId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<SessionReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm(t('members.confirmDelete'))) {
      try {
        await deleteSession(id);
        toast.success('Séance supprimée', {
          description: 'La séance a été supprimée avec succès',
        });
      } catch (error) {
        toast.error('Erreur', {
          description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        });
      }
    }
  };

  const handleGenerateReport = async (sessionId: string) => {
    setIsLoadingReport(true);
    setReportSessionId(parseInt(sessionId));
    try {
      const data = await reportService.getSessionReportData(sessionId);
      setReportData(data);
    } catch (error) {
      console.error('Error loading session report:', error);
      toast.error('Erreur lors du chargement du rapport de séance');
      setReportSessionId(null);
    } finally {
      setIsLoadingReport(false);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('sessions.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('sessions.addSession')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sessions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <InteractiveEmptyState
              title={t('sessions.noSessions')}
              description="Créez votre première séance pour commencer à gérer les contributions et tours de votre tontine."
              icons={[
                <Calendar key="1" className="h-6 w-6" />,
                <CalendarClock key="2" className="h-6 w-6" />,
                <CalendarDays key="3" className="h-6 w-6" />
              ]}
              action={{
                label: t('sessions.addSession'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sessions.sessionNumber')}</TableHead>
                  <TableHead>{t('tontines.name')}</TableHead>
                  <TableHead>{t('sessions.date')}</TableHead>
                  <TableHead>{t('sessions.location')}</TableHead>
                  <TableHead>{t('sessions.attendanceCount')}</TableHead>
                  <TableHead>{t('sessions.totalContributions')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const tontine = getTontineById(session.id_tontine);
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        #{session.numero_seance}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tontine?.nom || 'N/A'}</div>
                          {session.ordre_du_jour && (
                            <div className="text-xs text-muted-foreground">
                              {session.ordre_du_jour}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(new Date(session.date))}</TableCell>
                      <TableCell className="text-sm">{session.lieu}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {session.nombre_presents}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(session.total_cotisations)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.statut === 'terminee' ? 'default' : 'secondary'}
                        >
                          {t(`common.${session.statut}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGenerateReport(session.id)}
                            title="Générer le rapport PDF"
                          >
                            <FileDown className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedSessionId(session.id)}
                            title={t('sessions.viewMeetingSheet')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddSessionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <SessionReportViewer
        open={!!reportSessionId}
        onClose={() => {
          setReportSessionId(null);
          setReportData(null);
        }}
        data={reportData}
        isLoading={isLoadingReport}
      />

      {selectedSessionId && (
        <MeetingSheet
          sessionId={selectedSessionId}
          open={!!selectedSessionId}
          onOpenChange={(open) => !open && setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
