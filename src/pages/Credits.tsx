import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Banknote, HandCoins, Wallet, DollarSign, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { useCreditStore } from '@/stores/creditStore';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useToast } from '@/components/ui/toast-provider';
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
import { RepayCreditModal } from '@/components/credits/RepayCreditModal';
import type { Credit } from '@/types/database.types';

export default function Credits() {
  const { t } = useTranslation();
  const { 
    credits, 
    fetchCredits, 
    deleteCredit, 
    approveCredit, 
    disburseCredit,
    updateOverdueCredits,
    isLoading 
  } = useCreditStore();
  const { getMemberById } = useMemberStore();
  const { getTontineById } = useTontineStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCreditForRepay, setSelectedCreditForRepay] = useState<Credit | null>(null);

  useEffect(() => {
    fetchCredits();
    // Mettre à jour les crédits en retard au chargement
    updateOverdueCredits();
  }, [fetchCredits, updateOverdueCredits]);

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

  const handleApproveCredit = async (creditId: string) => {
    try {
      await approveCredit(creditId);
      toast.success('Crédit approuvé', {
        description: 'Le crédit a été approuvé avec succès.',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible d\'approuver le crédit.',
      });
    }
  };

  const handleDisburseCredit = async (creditId: string) => {
    try {
      await disburseCredit(creditId);
      toast.success('Crédit décaissé', {
        description: 'Le crédit a été décaissé avec succès.',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de décaisser le crédit.',
      });
    }
  };

  const handleUpdateOverdueCredits = async () => {
    try {
      const result = await updateOverdueCredits();
      if (result.count > 0) {
        toast.warning('Crédits en retard mis à jour', {
          description: `${result.count} crédit(s) ont été marqués comme en retard.`,
        });
      } else {
        toast.success('Tout est à jour', {
          description: 'Aucun crédit en retard détecté.',
        });
      }
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de mettre à jour les crédits.',
      });
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce crédit?')) {
      try {
        await deleteCredit(creditId);
        toast.success('Crédit supprimé', {
          description: 'Le crédit a été supprimé avec succès.',
        });
      } catch (error) {
        toast.error('Erreur', {
          description: 'Impossible de supprimer le crédit.',
        });
      }
    }
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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleUpdateOverdueCredits} 
            variant="outline"
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            MAJ Retards
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-initial">
            <Plus className="mr-2 h-4 w-4" />
            {t('credits.addCredit')}
          </Button>
        </div>
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('sessions.member')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">{t('nav.tontines')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('credits.amount')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">{t('credits.interestRate')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">{t('credits.repaymentAmount')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('credits.balance')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">{t('credits.dueDate')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('credits.status')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('common.actions')}</TableHead>
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
                          <div className="font-medium whitespace-nowrap">
                            {member?.prenom} {member?.nom}
                          </div>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            {member?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tontine?.nom}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatCurrency(credit.montant)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{credit.taux_interet}%</TableCell>
                      <TableCell className="font-medium hidden sm:table-cell whitespace-nowrap">
                        {formatCurrency(credit.solde)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-orange-600 whitespace-nowrap">
                            {formatCurrency(balance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {progress.toFixed(0)}% payé
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm whitespace-nowrap">
                          {formatDate(credit.date_remboursement_prevue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(credit.statut) as any}>
                          {t(`credits.statuses.${credit.statut}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* Approuver */}
                          {credit.statut === 'en_attente' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Approuver"
                              onClick={() => handleApproveCredit(credit.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          
                          {/* Décaisser */}
                          {credit.statut === 'approuve' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Décaisser"
                              onClick={() => handleDisburseCredit(credit.id)}
                            >
                              <Send className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          
                          {/* Rembourser */}
                          {['en_cours', 'en_retard'].includes(credit.statut) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Rembourser"
                              onClick={() => setSelectedCreditForRepay(credit)}
                            >
                              <DollarSign className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          
                          {/* Supprimer */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t('common.delete')}
                            onClick={() => handleDeleteCredit(credit.id)}
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AddCreditModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <RepayCreditModal
        credit={selectedCreditForRepay}
        open={!!selectedCreditForRepay}
        onOpenChange={(open) => !open && setSelectedCreditForRepay(null)}
      />
    </div>
  );
}

