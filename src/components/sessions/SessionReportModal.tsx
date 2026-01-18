import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types locaux pour le rapport de séance (compatibles avec Supabase)
interface SessionForReport {
  date: Date;
  location?: string;
  sessionNumber: number;
  status: 'programmee' | 'en_cours' | 'terminee' | 'annulee';
}

interface TontineForReport {
  name: string;
  type: 'presence' | 'optionnelle';
  contributionAmount: number;
}

interface SessionReportModalProps {
  session: SessionForReport;
  tontine: TontineForReport;
  totalExpected: number;
  totalCollected: number;
  totalPenalties: number;
  attendanceCount: number;
  totalMembers: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionReportModal({
  session,
  tontine,
  totalExpected,
  totalCollected,
  totalPenalties,
  attendanceCount,
  totalMembers,
  open,
  onOpenChange,
}: SessionReportModalProps) {
  const { t } = useTranslation();

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

  const attendanceRate = totalMembers > 0 ? (attendanceCount / totalMembers) * 100 : 0;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('sessions.sessionReport')}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {formatDate(session.date)} - {session.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t('sessions.sessionDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('tontines.name')}:</span>
                <span className="font-medium">{tontine.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('tontines.type')}:</span>
                <Badge variant={tontine.type === 'presence' ? 'default' : 'secondary'}>
                  {t(`tontines.types.${tontine.type}`)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('sessions.status')}:</span>
                <Badge variant={session.status === 'terminee' ? 'default' : 'secondary'}>
                  {t(`sessions.statuses.${session.status}`)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('sessions.totalExpected')}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalExpected)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('sessions.totalCollected')}
                </CardTitle>
                {totalCollected >= totalExpected ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totalCollected)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {collectionRate.toFixed(1)}% {t('sessions.ofExpected')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('sessions.attendance')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attendanceCount} / {totalMembers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {attendanceRate.toFixed(1)}% {t('sessions.present')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('penalties.totalPenalties')}
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalPenalties)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variance */}
          {totalExpected > 0 && (
            <Card className={totalCollected >= totalExpected ? 'bg-green-50' : 'bg-orange-50'}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {totalCollected >= totalExpected 
                      ? t('sessions.surplus') 
                      : t('sessions.deficit')}:
                  </span>
                  <span className={`text-xl font-bold ${
                    totalCollected >= totalExpected ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {formatCurrency(Math.abs(totalCollected - totalExpected))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
