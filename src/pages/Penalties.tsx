import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, CheckCircle, AlertTriangle, ShieldAlert, Ban, DollarSign, X, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Penalite } from '@/types/database.types';
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
import { PayPenaltyModal } from '@/components/penalties/PayPenaltyModal';
import { PenaltiesExcelExport } from '@/components/penalties/PenaltiesExcelExport';

export default function Penalties() {
  const { t } = useTranslation();
  const { penalties, fetchPenalties, markAsPaid, cancelPenalty, deletePenalty, isLoading, getPendingPenalties, getPaidPenalties } = usePenaltyStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPenaltyForPayment, setSelectedPenaltyForPayment] = useState<Penalite | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paye':
        return 'success';
      case 'non_paye':
        return 'warning';
      case 'partiellement_paye':
        return 'default';
      case 'annule':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'paye': 'Payée',
      'non_paye': 'En attente',
      'partiellement_paye': 'Partiellement payée',
      'annule': 'Annulée',
    };
    return labels[status] || status;
  };

  const getPenaltyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      absence: 'Absence',
      retard_cotisation: 'Retard de cotisation',
      mauvaise_conduite: 'Mauvaise conduite',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const pendingPenalties = getPendingPenalties();
  const paidPenalties = getPaidPenalties();
  const totalPending = pendingPenalties.reduce((sum, p) => sum + p.montant, 0);
  const totalPaid = paidPenalties.reduce((sum, p) => sum + p.montant, 0);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('penalties.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('penalties.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('penalties.addPenalty')}
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={penalties.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-slate-400/50 dark:hover:shadow-slate-600/50 transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('penalties.totalPenalties')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                <AlertTriangle className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{penalties.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalPending + totalPaid)} au total
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-orange-400/50 dark:hover:shadow-orange-600/50 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('penalties.pending')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-700">
                <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{pendingPenalties.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalPending)} à recouvrer
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-green-400/50 dark:hover:shadow-green-600/50 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('penalties.paid')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-700">
                <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{paidPenalties.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalPaid)} recouvrées
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : penalties.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <InteractiveEmptyState
              title={t('penalties.noPenalties')}
              description="Enregistrez les pénalités pour les absences ou retards afin de maintenir la discipline au sein de la tontine."
              icons={[
                <AlertTriangle key="1" className="h-6 w-6" />,
                <ShieldAlert key="2" className="h-6 w-6" />,
                <Ban key="3" className="h-6 w-6" />
              ]}
              action={{
                label: t('penalties.addFirstPenalty'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
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
                  const member = getMemberById(penalty.id_membre);
                  const session = penalty.id_seance ? getSessionById(penalty.id_seance) : null;
                  const tontine = penalty.id_tontine ? getTontineById(penalty.id_tontine) : null;

                  return (
                    <TableRow key={penalty.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member?.prenom} {member?.nom}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member?.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session ? `Séance #${session.numero_seance}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {penalty.created_at && formatDate(penalty.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.nom || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPenaltyTypeLabel(penalty.type_penalite)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-orange-600">
                        <div>
                          <div>{formatCurrency(penalty.montant)}</div>
                          {penalty.montant_paye > 0 && (
                            <div className="text-xs text-green-600">
                              Payé: {formatCurrency(penalty.montant_paye)}
                            </div>
                          )}
                          {penalty.statut === 'partiellement_paye' && (
                            <div className="text-xs text-orange-600">
                              Reste: {formatCurrency(penalty.montant - penalty.montant_paye)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={penalty.raison}>
                          {penalty.raison}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(penalty.statut) as "default" | "secondary" | "destructive" | "outline"}>
                          {getStatusLabel(penalty.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {(penalty.statut === 'non_paye' || penalty.statut === 'partiellement_paye') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPenaltyForPayment(penalty)}
                              title="Payer la pénalité"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Payer
                            </Button>
                          )}
                          {(penalty.statut === 'non_paye' || penalty.statut === 'partiellement_paye') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (confirm('Êtes-vous sûr de vouloir annuler cette pénalité ?')) {
                                  try {
                                    await cancelPenalty(penalty.id);
                                    toast.success('Pénalité annulée', {
                                      description: 'La pénalité a été annulée avec succès',
                                    });
                                  } catch (error) {
                                    toast.error('Erreur', {
                                      description: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
                                    });
                                  }
                                }
                              }}
                              title="Annuler la pénalité"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('common.delete')}
                            onClick={async () => {
                              if (confirm(t('penalties.confirmDelete'))) {
                                try {
                                  await deletePenalty(penalty.id);
                                  toast.success('Pénalité supprimée', {
                                    description: `La pénalité de ${formatCurrency(penalty.montant)} a été supprimée`,
                                  });
                                } catch (error) {
                                  toast.error('Erreur', {
                                    description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
                                  });
                                }
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

      <PayPenaltyModal
        penalty={selectedPenaltyForPayment}
        open={selectedPenaltyForPayment !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPenaltyForPayment(null);
        }}
      />

      <PenaltiesExcelExport
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
