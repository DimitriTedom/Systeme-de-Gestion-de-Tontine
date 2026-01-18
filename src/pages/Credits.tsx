import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Banknote, HandCoins, Wallet } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
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
  const { credits, fetchCredits, deleteCredit, isLoading } = useCreditStore();
  const { getMemberById } = useMemberStore();
  const { getTontineById } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const getStatusColor = (statut: string) => {
    const colors = {
      en_attente: 'pending',
      approuve: 'approved',
      decaisse: 'approved',
      en_cours: 'repaying',
      rembourse: 'completed',
      en_retard: 'defaulted',
      defaut: 'defaulted',
    };
    return colors[statut as keyof typeof colors] || 'secondary';
  };

  const calculateProgress = (montant_rembourse: number, solde: number) => {
    return Math.min(100, (montant_rembourse / solde) * 100);
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

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : credits.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <InteractiveEmptyState
              title={t('credits.noCredits')}
              description="Gérez les prêts accordés aux membres et suivez les remboursements pour maintenir la solidarité financière."
              icons={[
                <Banknote key="1" className="h-6 w-6" />,
                <HandCoins key="2" className="h-6 w-6" />,
                <Wallet key="3" className="h-6 w-6" />
              ]}
              action={{
                label: t('credits.addFirstCredit'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
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
                  const member = getMemberById(credit.id_membre);
                  const tontine = credit.id_tontine ? getTontineById(credit.id_tontine) : null;
                  const balance = credit.solde - credit.montant_rembourse;
                  const progress = calculateProgress(credit.montant_rembourse, credit.solde);

                  return (
                    <TableRow key={credit.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member?.prenom} {member?.nom}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tontine?.nom}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(credit.montant)}
                      </TableCell>
                      <TableCell>{credit.taux_interet}%</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(credit.solde)}
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
                          {formatDate(credit.date_remboursement_prevue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(credit.statut) as any}>
                          {t(`credits.statuses.${credit.statut}`)}
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

