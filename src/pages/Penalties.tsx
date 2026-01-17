import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddPenaltyModal } from '@/components/penalties/AddPenaltyModal';

export default function Penalties() {
  const { t } = useTranslation();
  const { penalties, fetchPenalties, markAsPaid, deletePenalty, isLoading, getPendingPenalties, getPaidPenalties } = usePenaltyStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchPenalties();
  }, [fetchPenalties]);

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
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'waived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPenaltyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      absence: 'Absence',
      late_contribution: 'Retard de cotisation',
      misconduct: 'Mauvaise conduite',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const pendingPenalties = getPendingPenalties();
  const paidPenalties = getPaidPenalties();
  const totalPending = pendingPenalties.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paidPenalties.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('penalties.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('penalties.description')}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('penalties.addPenalty')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('penalties.totalPenalties')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{penalties.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPending + totalPaid)} au total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('penalties.pending')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPenalties.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPending)} à recouvrer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('penalties.paid')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidPenalties.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPaid)} recouvrées
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : penalties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('penalties.noPenalties')}</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('penalties.addFirstPenalty')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('penalties.listTitle')}</CardTitle>
            <CardDescription>{t('penalties.listDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sessions.member')}</TableHead>
                  <TableHead>{t('penalties.session')}</TableHead>
                  <TableHead>{t('nav.tontines')}</TableHead>
                  <TableHead>{t('penalties.type')}</TableHead>
                  <TableHead>{t('penalties.amount')}</TableHead>
                  <TableHead>{t('penalties.reason')}</TableHead>
                  <TableHead>{t('penalties.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.map((penalty) => {
                  const member = getMemberById(penalty.memberId);
                  const session = penalty.sessionId ? getSessionById(penalty.sessionId) : null;
                  const tontine = getTontineById(penalty.tontineId);

                  return (
                    <TableRow key={penalty.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member?.firstName} {member?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session ? `Séance #${session.sessionNumber}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {penalty.createdAt && formatDate(penalty.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPenaltyTypeLabel(penalty.penaltyType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-orange-600">
                        {formatCurrency(penalty.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={penalty.reason}>
                          {penalty.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(penalty.status) as any}>
                          {t(`penalties.statuses.${penalty.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {penalty.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsPaid(penalty.id)}
                              title={t('penalties.markAsPaid')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('penalties.pay')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('common.delete')}
                            onClick={() => {
                              if (confirm(t('penalties.confirmDelete'))) {
                                deletePenalty(penalty.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddPenaltyModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
