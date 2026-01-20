import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Trophy, Users, HandCoins, Award, Medal, FileSpreadsheet } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { motion } from 'framer-motion';
import { useTourStore, Tour } from '@/stores/tourStore';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AddTourModal } from '@/components/tours/AddTourModal';
import { ToursExcelExport } from '@/components/tours/ToursExcelExport';

export default function Tours() {
  const { t } = useTranslation();
  const { tours, fetchTours, deleteTour, isLoading } = useTourStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  // Calculate statistics
  const totalDistributed = tours.reduce((sum, tour) => sum + tour.amount, 0);
  const uniqueBeneficiaries = new Set(tours.map((t) => t.beneficiaryId)).size;
  const totalTours = tours.length;

  // Group tours by tontine for history view
  const toursByTontine = tours.reduce((acc, tour) => {
    const tontineId = tour.tontineId;
    if (!acc[tontineId]) {
      acc[tontineId] = [];
    }
    acc[tontineId].push(tour);
    return acc;
  }, {} as Record<string, Tour[]>);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('tours.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('tours.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('tours.assignTour')}
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={tours.length === 0}
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-yellow-400/50 dark:hover:shadow-yellow-600/50 transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('tours.totalTours')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-700">
                <Trophy className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{totalTours}</div>
              <p className="text-xs text-muted-foreground">
                {t('tours.toursCompleted')}
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-green-400/50 dark:hover:shadow-green-600/50 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('tours.totalDistributed')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-700">
                <HandCoins className="h-4 w-4 text-green-700 dark:text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalDistributed)}</div>
              <p className="text-xs text-muted-foreground">
                {t('tours.distributedToMembers')}
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-blue-400/50 dark:hover:shadow-blue-600/50 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('tours.beneficiaries')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700">
                <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{uniqueBeneficiaries}</div>
              <p className="text-xs text-muted-foreground">
                {t('tours.uniqueBeneficiaries')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : tours.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <InteractiveEmptyState
              title={t('tours.noTours')}
              description="Attribuez les tours aux bénéficiaires pour organiser la distribution équitable des fonds collectés."
              icons={[
                <Trophy key="1" className="h-6 w-6" />,
                <Award key="2" className="h-6 w-6" />,
                <Medal key="3" className="h-6 w-6" />
              ]}
              action={{
                label: t('tours.assignFirstTour'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('tours.historyTitle')}</CardTitle>
            <CardDescription>{t('tours.historyDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tours.tourNumber')}</TableHead>
                  <TableHead>{t('tours.beneficiary')}</TableHead>
                  <TableHead>{t('tours.session')}</TableHead>
                  <TableHead>{t('nav.tontines')}</TableHead>
                  <TableHead>{t('tours.amount')}</TableHead>
                  <TableHead>{t('tours.date')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => {
                  const beneficiary = getMemberById(tour.beneficiaryId);
                  const session = tour.sessionId ? getSessionById(tour.sessionId) : null;
                  const tontine = getTontineById(tour.tontineId);

                  return (
                    <TableRow key={tour.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{tour.tourNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tour.beneficiaryName || `${beneficiary?.prenom} ${beneficiary?.nom}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {beneficiary?.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session ? `Séance #${session.numero_seance}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.nom || '-'}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(tour.amount)}
                      </TableCell>
                      <TableCell>
                        {tour.date && formatDate(tour.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('common.delete')}
                            onClick={() => {
                              if (confirm(t('tours.confirmDelete'))) {
                                deleteTour(tour.id);
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

      {/* Tour History by Tontine */}
      {Object.keys(toursByTontine).length > 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('tours.byTontine')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(toursByTontine).map(([tontineId, tontineTours]) => {
              const tontine = getTontineById(tontineId);
              const tontineTotal = tontineTours.reduce((sum, t) => sum + t.amount, 0);
              
              return (
                <Card key={tontineId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{tontine?.nom || 'Tontine'}</CardTitle>
                    <CardDescription>
                      {tontineTours.length} {t('tours.toursCompleted')} • {formatCurrency(tontineTotal)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tontineTours.slice(0, 5).map((tour) => {
                        const beneficiary = getMemberById(tour.beneficiaryId);
                        return (
                          <div key={tour.id} className="flex justify-between items-center text-sm">
                            <span>
                              <Badge variant="outline" className="mr-2">#{tour.tourNumber}</Badge>
                              {tour.beneficiaryName || `${beneficiary?.prenom} ${beneficiary?.nom}`}
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(tour.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {tontineTours.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          + {tontineTours.length - 5} {t('tours.moreTours')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <AddTourModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <ToursExcelExport
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
