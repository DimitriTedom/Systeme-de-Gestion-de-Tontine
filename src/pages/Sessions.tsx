import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, FileText, Calendar } from 'lucide-react';
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

export default function Sessions() {
  const { t } = useTranslation();
  const { sessions, deleteSession } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirm(t('members.confirmDelete'))) {
      deleteSession(id);
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
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('sessions.noSessions')}</p>
            </div>
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
                  const tontine = getTontineById(session.tontineId);
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        #{session.sessionNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tontine?.name || 'N/A'}</div>
                          {session.agenda && (
                            <div className="text-xs text-muted-foreground">
                              {session.agenda}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell className="text-sm">{session.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {session.attendanceCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(session.totalContributions)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {t(`common.${session.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
