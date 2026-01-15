import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Eye } from 'lucide-react';
import { useCreditStore } from '@/stores/creditStore';
import { useMemberStore } from '@/stores/memberStore';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCreditModal } from '@/components/credits/AddCreditModal';

export default function Credits() {
  const { t } = useTranslation();
  const { credits, deleteCredit } = useCreditStore();
  const { getMemberById } = useMemberStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'pending',
      approved: 'approved',
      disbursed: 'approved',
      repaying: 'repaying',
      completed: 'completed',
      defaulted: 'defaulted',
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const calculateProgress = (amountPaid: number, repaymentAmount: number) => {
    return Math.min(100, (amountPaid / repaymentAmount) * 100);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('credits.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gérez les demandes de crédit des membres
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('credits.addCredit')}
        </Button>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">{t('credits.noCredits')}</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('credits.addFirstCredit')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des crédits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sessions.member')}</TableHead>
                  <TableHead>{t('nav.tontines')}</TableHead>
                  <TableHead>{t('credits.amount')}</TableHead>
                  <TableHead>{t('credits.interestRate')}</TableHead>
                  <TableHead>{t('credits.repaymentAmount')}</TableHead>
                  <TableHead>{t('credits.balance')}</TableHead>
                  <TableHead>{t('credits.dueDate')}</TableHead>
                  <TableHead>{t('credits.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((credit) => {
                  const member = getMemberById(credit.memberId);
                  const tontine = getTontineById(credit.tontineId);
                  const balance = credit.repaymentAmount - credit.amountPaid;
                  const progress = calculateProgress(credit.amountPaid, credit.repaymentAmount);

                  return (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member?.firstName} {member?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.name}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(credit.amount)}
                      </TableCell>
                      <TableCell>{credit.interestRate}%</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(credit.repaymentAmount)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-orange-600">
                            {formatCurrency(balance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {progress.toFixed(0)}% payé
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(credit.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(credit.status)}>
                          {t(`credits.statuses.${credit.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('common.delete')}
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce crédit?')) {
                                deleteCredit(credit.id);
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

      <AddCreditModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}

