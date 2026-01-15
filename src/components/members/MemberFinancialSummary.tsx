import { useTranslation } from 'react-i18next';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useContributionStore } from '@/stores/contributionStore';
import { useCreditStore } from '@/stores/creditStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemberFinancialSummaryProps {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberFinancialSummary({
  memberId,
  open,
  onOpenChange,
}: MemberFinancialSummaryProps) {
  const { t } = useTranslation();
  const { contributions } = useContributionStore();
  const { credits } = useCreditStore();
  const { penalties } = usePenaltyStore();
  const { getTontineById } = useTontineStore();

  // Get member's contributions
  const memberContributions = contributions.filter(c => c.memberId === memberId);
  const totalContributed = memberContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpected = memberContributions.reduce((sum, c) => sum + c.expectedAmount, 0);
  const completionRate = totalExpected > 0 ? (totalContributed / totalExpected) * 100 : 0;

  // Get member's credits
  const memberCredits = credits.filter(c => c.memberId === memberId);
  const activeCredits = memberCredits.filter(
    c => c.status === 'repaying' || c.status === 'disbursed'
  );

  // Get member's penalties
  const memberPenalties = penalties.filter(p => p.memberId === memberId);
  const pendingPenalties = memberPenalties.filter(p => p.status === 'pending');
  const paidPenalties = memberPenalties.filter(p => p.status === 'paid');
  const totalPenaltiesAmount = memberPenalties.reduce((sum, p) => sum + p.amount, 0);
  const paidPenaltiesAmount = paidPenalties.reduce((sum, p) => sum + p.amount, 0);

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
    }).format(date);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{t('members.financialSummary')}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Vue complète de la situation financière du membre
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('members.totalContributed')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalContributed)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={completionRate} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {completionRate.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('members.activeCredits')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCredits.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(
                    activeCredits.reduce((sum, c) => sum + (c.repaymentAmount - c.amountPaid), 0)
                  )} à rembourser
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {t('members.penaltiesStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPenalties.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(totalPenaltiesAmount - paidPenaltiesAmount)} en attente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contributions Detail */}
          <Card>
            <CardHeader>
              <CardTitle>{t('members.contributionStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {memberContributions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune cotisation enregistrée
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tontine</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberContributions.slice(0, 5).map((contribution) => {
                      const tontine = getTontineById(contribution.tontineId);
                      return (
                        <TableRow key={contribution.id}>
                          <TableCell>{formatDate(contribution.paymentDate)}</TableCell>
                          <TableCell>{tontine?.name}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(contribution.amount)}
                            {contribution.amount < contribution.expectedAmount && (
                              <span className="text-xs text-orange-500 ml-2">
                                (Attendu: {formatCurrency(contribution.expectedAmount)})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                contribution.status === 'completed'
                                  ? 'default'
                                  : contribution.status === 'partial'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {contribution.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {contribution.status === 'partial' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {t(`sessions.${contribution.status}`) || contribution.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Credits Detail */}
          <Card>
            <CardHeader>
              <CardTitle>{t('members.activeCredits')}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeCredits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun crédit actif
                </p>
              ) : (
                <div className="space-y-4">
                  {activeCredits.map((credit) => {
                    const progress = (credit.amountPaid / credit.repaymentAmount) * 100;
                    const remaining = credit.repaymentAmount - credit.amountPaid;
                    return (
                      <div key={credit.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{formatCurrency(credit.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {credit.interestRate}% • Échéance: {formatDate(credit.dueDate)}
                            </p>
                          </div>
                          <Badge variant={credit.status === 'repaying' ? 'default' : 'secondary'}>
                            {t(`credits.statuses.${credit.status}`)}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Payé: {formatCurrency(credit.amountPaid)}</span>
                            <span>Reste: {formatCurrency(remaining)}</span>
                          </div>
                        </div>
                        {credit.purpose && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Objet: {credit.purpose}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Penalties Detail */}
          <Card>
            <CardHeader>
              <CardTitle>{t('members.penaltiesStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {memberPenalties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune pénalité enregistrée
                </p>
              ) : (
                <div className="space-y-3">
                  {memberPenalties.map((penalty) => (
                    <div
                      key={penalty.id}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{penalty.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`penalties.types.${penalty.penaltyType}`)} •{' '}
                          {formatDate(penalty.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(penalty.amount)}</p>
                        <Badge
                          variant={
                            penalty.status === 'paid'
                              ? 'default'
                              : penalty.status === 'waived'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="mt-1"
                        >
                          {t(`penalties.statuses.${penalty.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
