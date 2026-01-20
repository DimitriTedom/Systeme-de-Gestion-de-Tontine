import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTontineStore } from '@/stores/tontineStore';
import { useContributionStore } from '@/stores/contributionStore';
import { useCreditStore } from '@/stores/creditStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useTourStore } from '@/stores/tourStore';
import { useProjectStore } from '@/stores/projectStore';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

interface TontineBalanceProps {
  tontineId?: string; // If not provided, shows total for all tontines
  showDetails?: boolean;
}

export function TontineBalance({ tontineId, showDetails = false }: TontineBalanceProps) {
  const { tontines } = useTontineStore();
  const { contributions } = useContributionStore();
  const { credits } = useCreditStore();
  const { penalties } = usePenaltyStore();
  const { tours } = useTourStore();
  const { projects } = useProjectStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate balance from real data
  const calculateBalance = (filterTontineId?: string) => {
    // Money IN
    const totalContributions = contributions
      .filter(c => !filterTontineId || c.id_tontine === filterTontineId)
      .reduce((sum, c) => sum + (c.montant || 0), 0);

    const totalPenalties = penalties
      .filter(p => !filterTontineId || p.id_tontine === filterTontineId)
      .filter(p => p.statut === 'paye' || p.statut === 'partiellement_paye')
      .reduce((sum, p) => sum + (p.montant_paye || p.montant || 0), 0);

    const totalCreditRepayments = credits
      .filter(c => !filterTontineId || c.id_tontine === filterTontineId)
      .reduce((sum, c) => sum + (c.montant_rembourse || 0), 0);

    // Money OUT
    const totalCreditsGranted = credits
      .filter(c => !filterTontineId || c.id_tontine === filterTontineId)
      .filter(c => c.statut === 'decaisse' || c.statut === 'en_cours' || c.statut === 'en_retard' || c.statut === 'defaut')
      .reduce((sum, c) => sum + (c.montant || 0), 0);

    const totalToursDistributed = tours
      .filter(t => !filterTontineId || t.tontineId === filterTontineId)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalProjectExpenses = projects
      .filter(p => !filterTontineId || p.id_tontine === filterTontineId)
      .reduce((sum, p) => sum + (p.montant_alloue || 0), 0);

    const moneyIn = totalContributions + totalPenalties + totalCreditRepayments;
    const moneyOut = totalCreditsGranted + totalToursDistributed + totalProjectExpenses;

    return {
      balance: moneyIn - moneyOut,
      totalIn: moneyIn,
      totalOut: moneyOut,
    };
  };

  // Calculate balance(s)
  let balance = 0;
  let tontineName = 'Toutes les Tontines';
  let totalIn = 0;
  let totalOut = 0;

  if (tontineId) {
    const result = calculateBalance(tontineId);
    balance = result.balance;
    totalIn = result.totalIn;
    totalOut = result.totalOut;
    const tontine = tontines.find(t => t.id === tontineId);
    tontineName = tontine?.nom || 'Tontine';
  } else {
    // Total for all tontines
    const result = calculateBalance();
    balance = result.balance;
    totalIn = result.totalIn;
    totalOut = result.totalOut;
  }

  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-l-4 ${isNegative ? 'border-l-red-500' : 'border-l-green-500'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tontineName}
            </CardTitle>
            <Wallet className={`h-4 w-4 ${isNegative ? 'text-red-500' : 'text-green-500'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Balance */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                  <CountUp
                    end={balance}
                    duration={1.5}
                    separator=" "
                    suffix=" XAF"
                    decimals={0}
                  />
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Solde disponible
              </p>
            </div>

            {/* Details */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>Entrées</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(totalIn)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span>Sorties</span>
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(totalOut)}
                  </p>
                </div>
              </div>
            )}

            {/* Warning if balance is low */}
            {balance < 10000 && balance >= 0 && (
              <Badge variant="outline" className="w-full justify-center text-xs border-yellow-500 text-yellow-600">
                ⚠️ Solde faible
              </Badge>
            )}
            {isNegative && (
              <Badge variant="destructive" className="w-full justify-center text-xs">
                ⛔ Solde négatif !
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
