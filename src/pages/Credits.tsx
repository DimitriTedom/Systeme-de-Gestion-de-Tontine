import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Banknote, HandCoins, Wallet, DollarSign, CheckCircle2, Send, RefreshCw, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AddCreditModal } from '@/components/credits/AddCreditModal';
import { RepayCreditModal } from '@/components/credits/RepayCreditModal';
import { CreditsExcelExport } from '@/components/credits/CreditsExcelExport';
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(credits.length / itemsPerPage);
  const paginatedCredits = credits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="flex-1 sm:flex-initial"
            disabled={credits.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-blue-400/50 dark:hover:shadow-blue-600/50 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('credits.totalCredits')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700">
                <Banknote className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{credits.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(credits.reduce((sum, c) => sum + c.montant, 0))} total
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-yellow-400/50 dark:hover:shadow-yellow-600/50 transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('credits.pending')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-700">
                <DollarSign className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{credits.filter(c => c.statut === 'en_attente').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                En attente d'approbation
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
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-orange-400/50 dark:hover:shadow-orange-600/50 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('credits.active')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-700">
                <HandCoins className="h-4 w-4 text-orange-700 dark:text-orange-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{credits.filter(c => c.statut === 'en_cours').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Crédits en cours
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-green-400/50 dark:hover:shadow-green-600/50 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('credits.completed')}</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{credits.filter(c => c.statut === 'rembourse').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Remboursés intégralement
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
                {paginatedCredits.map((credit) => {
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  {/* Results info */}
                  <div className="text-sm text-muted-foreground">
                    {t('common.showing')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, credits.length)} {t('common.of')} {credits.length} crédits
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">{t('common.previous')}</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className="min-w-[2.5rem]"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Mobile: Current page indicator */}
                    <div className="sm:hidden text-sm">
                      {currentPage} / {totalPages}
                    </div>

                    {/* Next button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">{t('common.next')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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

      <CreditsExcelExport
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

