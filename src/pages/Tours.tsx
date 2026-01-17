import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Trophy, Users, HandCoins } from 'lucide-react';
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
import { AddTourModal } from '@/components/tours/AddTourModal';

export default function Tours() {
  const { t } = useTranslation();
  const { tours, fetchTours, deleteTour, isLoading } = useTourStore();
  const { getMemberById } = useMemberStore();
  const { getSessionById } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('tours.assignTour')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tours.totalTours')}</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTours}</div>
            <p className="text-xs text-muted-foreground">
              {t('tours.toursCompleted')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tours.totalDistributed')}</CardTitle>
            <HandCoins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDistributed)}</div>
            <p className="text-xs text-muted-foreground">
              {t('tours.distributedToMembers')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tours.beneficiaries')}</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{uniqueBeneficiaries}</div>
            <p className="text-xs text-muted-foreground">
              {t('tours.uniqueBeneficiaries')}
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
      ) : tours.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('tours.noTours')}</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('tours.assignFirstTour')}
            </Button>
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
                            {tour.beneficiaryName || `${beneficiary?.firstName} ${beneficiary?.lastName}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {beneficiary?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session ? `Séance #${session.sessionNumber}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.name || '-'}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(tour.amount)}
                      </TableCell>
                      <TableCell>
                        {tour.dateTour && formatDate(tour.dateTour)}
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
                    <CardTitle className="text-lg">{tontine?.name || 'Tontine'}</CardTitle>
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
                              {tour.beneficiaryName || `${beneficiary?.firstName} ${beneficiary?.lastName}`}
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
    </div>
  );
}
