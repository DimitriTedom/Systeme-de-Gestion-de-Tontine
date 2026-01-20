import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Download,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTransactionStore, TransactionType } from '@/stores/transactionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import * as XLSX from 'xlsx';
import { TontineBalance } from '@/components/dashboard/TontineBalance';

export default function Transactions() {
  const { t } = useTranslation();
  const { transactions, getTransactionsByTontine } = useTransactionStore();
  const { tontines, fetchTontines } = useTontineStore();
  const { members, getMemberById, fetchMembers } = useMemberStore();
  
  const [selectedTontine, setSelectedTontine] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTontines(), fetchMembers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchTontines, fetchMembers]);

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const tontineMatch = selectedTontine === 'all' || txn.tontineId === selectedTontine;
    const typeMatch = selectedType === 'all' || txn.type === selectedType;
    return tontineMatch && typeMatch;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return Math.abs(b.amount) - Math.abs(a.amount);
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      contribution: 'Cotisation',
      credit_granted: 'Crédit accordé',
      credit_repayment: 'Remboursement crédit',
      penalty: 'Pénalité',
      tour_distribution: 'Distribution tour',
      project_expense: 'Dépense projet',
      initial_funding: 'Financement initial',
      adjustment: 'Ajustement',
    };
    return labels[type];
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      contribution: 'bg-green-100 text-green-800 border-green-300',
      credit_granted: 'bg-red-100 text-red-800 border-red-300',
      credit_repayment: 'bg-green-100 text-green-800 border-green-300',
      penalty: 'bg-green-100 text-green-800 border-green-300',
      tour_distribution: 'bg-red-100 text-red-800 border-red-300',
      project_expense: 'bg-red-100 text-red-800 border-red-300',
      initial_funding: 'bg-blue-100 text-blue-800 border-blue-300',
      adjustment: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[type];
  };

  const handleExport = () => {
    const exportData = sortedTransactions.map((txn, index) => {
      const tontine = tontines.find(t => t.id === txn.tontineId);
      const member = txn.memberId ? getMemberById(txn.memberId) : null;
      
      return {
        '#': index + 1,
        'Date': formatDate(txn.createdAt),
        'Tontine': tontine?.nom || 'N/A',
        'Type': getTransactionTypeLabel(txn.type),
        'Description': txn.description,
        'Membre': member ? `${member.prenom} ${member.nom}` : 'N/A',
        'Montant': txn.amount,
        'Entrée/Sortie': txn.amount > 0 ? 'Entrée' : 'Sortie',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 18 }, // Date
      { wch: 25 }, // Tontine
      { wch: 20 }, // Type
      { wch: 40 }, // Description
      { wch: 25 }, // Membre
      { wch: 15 }, // Montant
      { wch: 12 }, // Entrée/Sortie
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `transactions_${timestamp}.xlsx`);
  };

  // Calculate totals
  const totalIn = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalOut = Math.abs(
    filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Historique des Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi complet de tous les mouvements financiers
          </p>
        </div>
        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Balance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <TontineBalance tontineId={selectedTontine === 'all' ? undefined : selectedTontine} showDetails={true} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/30 dark:hover:shadow-emerald-600/30 transition-all duration-300 border-emerald-200 dark:border-emerald-800">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-transparent dark:from-emerald-950/30 dark:via-green-950/20 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Total Entrées</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Calcul...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                    <CountUp 
                      end={totalIn} 
                      duration={2}
                      separator=" "
                      suffix=" XAF"
                      decimals={0}
                    />
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {filteredTransactions.filter(t => t.amount > 0).length} transaction(s)
                    </p>
                    {totalIn > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Actif
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-red-500/30 dark:hover:shadow-red-600/30 transition-all duration-300 border-red-200 dark:border-red-800">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-transparent dark:from-red-950/30 dark:via-orange-950/20 dark:to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-400/10 dark:bg-red-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                  <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span>Total Sorties</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                  <span className="text-sm text-muted-foreground">Calcul...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                    <CountUp 
                      end={totalOut} 
                      duration={2}
                      separator=" "
                      suffix=" XAF"
                      decimals={0}
                    />
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {filteredTransactions.filter(t => t.amount < 0).length} transaction(s)
                    </p>
                    {totalOut > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Actif
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tontine</label>
            <Select value={selectedTontine} onValueChange={setSelectedTontine}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les tontines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les tontines</SelectItem>
                {tontines.map(tontine => (
                  <SelectItem key={tontine.id} value={tontine.id}>
                    {tontine.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Type de transaction</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="contribution">Cotisations</SelectItem>
                <SelectItem value="credit_granted">Crédits accordés</SelectItem>
                <SelectItem value="credit_repayment">Remboursements</SelectItem>
                <SelectItem value="penalty">Pénalités</SelectItem>
                <SelectItem value="tour_distribution">Tours/Gains</SelectItem>
                <SelectItem value="project_expense">Dépenses projets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Trier par</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'amount')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (récent d'abord)</SelectItem>
                <SelectItem value="amount">Montant (élevé d'abord)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {sortedTransactions.length} Transaction(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tontine</TableHead>
                  <TableHead>Membre</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune transaction trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map((txn) => {
                    const tontine = tontines.find(t => t.id === txn.tontineId);
                    const member = txn.memberId ? getMemberById(txn.memberId) : null;
                    const isIncome = txn.amount > 0;

                    return (
                      <TableRow key={txn.id}>
                        <TableCell className="text-sm">
                          {formatDate(txn.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTransactionTypeColor(txn.type)}>
                            {getTransactionTypeLabel(txn.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {txn.description}
                        </TableCell>
                        <TableCell>{tontine?.nom || '-'}</TableCell>
                        <TableCell>
                          {member ? `${member.prenom} ${member.nom}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isIncome ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(txn.amount)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
