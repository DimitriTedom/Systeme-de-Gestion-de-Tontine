import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Users, CreditCard, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useSessionStore } from '@/stores/sessionStore';
import { useContributionStore } from '@/stores/contributionStore';
import { useCreditStore } from '@/stores/creditStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { AGReportViewer } from '@/components/reports/ReportViewers';
import { reportService, AGSynthesisReport } from '@/services/reportService';
import { useToast } from '@/components/ui/toast-provider';
import { TontineBalance } from '@/components/dashboard/TontineBalance';
import { getGreeting, getTimeEmoji } from '@/lib/greetings';

export default function Dashboard() {
  const { t } = useTranslation();
  const { sessions, fetchSessions } = useSessionStore();
  const { contributions, fetchContributions } = useContributionStore();
  const { credits, fetchCredits } = useCreditStore();
  const { penalties, fetchPenalties } = usePenaltyStore();
  const { members, fetchMembers } = useMemberStore();
  const { tontines, fetchTontinesWithStats } = useTontineStore();
  const { toast } = useToast();
  const [showAGReport, setShowAGReport] = useState(false);
  const [agReportData, setAgReportData] = useState<AGSynthesisReport | null>(null);
  const [isLoadingAGReport, setIsLoadingAGReport] = useState(false);
  const [showAllBalances, setShowAllBalances] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchSessions(),
          fetchContributions(),
          fetchCredits(),
          fetchPenalties(),
          fetchMembers(),
          fetchTontinesWithStats(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadData();
  }, [fetchSessions, fetchContributions, fetchCredits, fetchPenalties, fetchMembers, fetchTontinesWithStats]);

  const handleGenerateAGReport = async () => {
    setIsLoadingAGReport(true);
    setShowAGReport(true);
    try {
      const data = await reportService.getAGSynthesisReport();
      setAgReportData(data);
    } catch (error) {
      console.error('Error loading AG synthesis report:', error);
      toast.error(t('dashboard.agReportError'));
      setShowAGReport(false);
    } finally {
      setIsLoadingAGReport(false);
    }
  };

  // Calculate total cash in hand - Real money flow tracking
  // Money IN
  const totalContributions = contributions
    .filter(c => c.statut === 'complete') // Only count completed contributions
    .reduce((sum, c) => sum + c.montant, 0);
  
  const totalPenaltiesPaid = penalties
    .filter(p => p.statut === 'paye' || p.statut === 'partiellement_paye')
    .reduce((sum, p) => sum + (p.montant_paye || p.montant), 0);
  
  const totalCreditRepayments = credits
    .reduce((sum, c) => sum + (c.montant_rembourse || 0), 0);
  
  // Money OUT
  const totalCreditsGranted = credits
    .filter(c => c.statut === 'decaisse' || c.statut === 'en_cours')
    .reduce((sum, c) => sum + c.montant, 0);
  
  // Calculate cash in hand
  const totalMoneyIn = totalContributions + totalPenaltiesPaid + totalCreditRepayments;
  const totalMoneyOut = totalCreditsGranted;
  const totalCashInHand = totalMoneyIn - totalMoneyOut;

  // Calculate contribution trends (last 6 sessions)
  const contributionTrends = sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6)
    .map((session) => ({
      name: `Session ${session.numero_seance}`,
      contributions: session.total_cotisations,
      penalties: session.total_penalites,
      attendance: session.nombre_presents,
    }));

  // Calculate credit status
  const creditsOnTrack = credits.filter(c => {
    if (c.statut === 'rembourse') return true;
    if (c.statut === 'en_cours') {
      const dueDate = new Date(c.date_remboursement_prevue);
      const disbursementDate = c.date_decaissement ? new Date(c.date_decaissement) : new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const repaymentAmount = c.montant + (c.montant * c.taux_interet / 100);
      const progressPercentage = (c.montant_rembourse / repaymentAmount) * 100;
      const totalDays = Math.ceil((dueDate.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - daysUntilDue;
      const expectedProgress = (daysPassed / totalDays) * 100;
      return progressPercentage >= expectedProgress * 0.8; // 80% of expected progress
    }
    return false;
  }).length;

  const creditsLate = credits.filter(c => {
    if (c.statut === 'defaut') return true;
    if (c.statut === 'en_cours') {
      const dueDate = new Date(c.date_remboursement_prevue);
      const disbursementDate = c.date_decaissement ? new Date(c.date_decaissement) : new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) return true; // Past due date
      const repaymentAmount = c.montant + (c.montant * c.taux_interet / 100);
      const progressPercentage = (c.montant_rembourse / repaymentAmount) * 100;
      const totalDays = Math.ceil((dueDate.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - daysUntilDue;
      const expectedProgress = (daysPassed / totalDays) * 100;
      return progressPercentage < expectedProgress * 0.8;
    }
    return false;
  }).length;

  const creditStatusData = [
    { name: 'On Track', value: creditsOnTrack, color: '#22c55e' },
    { name: 'Late', value: creditsLate, color: '#ef4444' },
  ];

  // Penalties data
  const pendingPenalties = penalties.filter(p => p.statut === 'non_paye').length;
  const paidPenalties = penalties.filter(p => p.statut === 'paye').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            {getGreeting()} <span className="text-3xl">{getTimeEmoji()}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={handleGenerateAGReport} variant="outline" className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.exportAGSynthesis')}</span>
            <span className="sm:hidden">{t('dashboard.exportAG')}</span>
          </Button>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03, y: -6 }}
        >
          <Card className="relative glass-card border-emerald-200 dark:border-emerald-900 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/50 dark:hover:shadow-emerald-600/50 transition-all duration-300">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Animated orb */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-400/10 dark:bg-emerald-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            {/* Pulse effect for important metric */}
            {totalCashInHand > 0 && (
              <div className="absolute top-4 right-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">{t('dashboard.cashInHand')}</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 via-emerald-200 to-green-100 dark:from-emerald-900 dark:via-emerald-800 dark:to-green-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
                <CountUp 
                  end={totalCashInHand} 
                  duration={2.5}
                  separator=" "
                  suffix=" XAF"
                  decimals={0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {totalContributions > 0 || totalCreditsGranted > 0 
                  ? t('dashboard.moneyInOut', { moneyIn: formatCurrency(totalMoneyIn), moneyOut: formatCurrency(totalMoneyOut) })
                  : t('dashboard.noTransactions')}
              </p>
              {/* Mini trend chart with enhanced styling */}
              <div className="mt-4 h-14 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={contributionTrends.slice(-4)}>
                    <defs>
                      <linearGradient id="colorContribution" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="contributions"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#colorContribution)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03, y: -6 }}
        >
          <Card className="relative glass-card overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-blue-600/30 transition-all duration-300 border-blue-200 dark:border-blue-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeMembers')}</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 via-blue-200 to-sky-100 dark:from-blue-900 dark:via-blue-800 dark:to-sky-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 dark:from-blue-400 dark:to-sky-400 bg-clip-text text-transparent">
                <CountUp 
                  end={members.filter(m => m.statut === 'Actif').length} 
                  duration={2}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('dashboard.outOf', { total: members.length })}
              </p>
              {/* Mini bar chart with gradient */}
              <div className="mt-4 h-14 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Actifs', value: members.filter(m => m.statut === 'Actif').length },
                    { name: 'Inactifs', value: members.filter(m => m.statut === 'Inactif').length },
                  ]}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <Bar dataKey="value" fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03, y: -6 }}
        >
          <Card className="relative glass-card border-amber-200 dark:border-amber-900 overflow-hidden group hover:shadow-2xl hover:shadow-amber-500/40 dark:hover:shadow-amber-600/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeCredits')}</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-100 dark:from-amber-900 dark:via-amber-800 dark:to-yellow-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                <CountUp
                  end={credits.filter(c => c.statut === 'en_cours').length}
                  duration={2}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('dashboard.onTrack', { onTrack: creditsOnTrack, late: creditsLate })}
              </p>
              {/* Status indicators */}
              <div className="flex gap-2 mt-4">
                {creditsOnTrack > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    {creditsOnTrack} à jour
                  </span>
                )}
                {creditsLate > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                    {creditsLate} retard
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03, y: -6 }}
        >
          <Card className="relative glass-card border-red-200 dark:border-red-900 overflow-hidden group hover:shadow-2xl hover:shadow-red-500/40 dark:hover:shadow-red-600/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-400/10 dark:bg-red-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            {/* Alert pulse for pending penalties */}
            {pendingPenalties > 0 && (
              <div className="absolute top-4 right-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">{t('dashboard.penalties')}</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 via-red-200 to-orange-100 dark:from-red-900 dark:via-red-800 dark:to-orange-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                <CountUp
                  end={pendingPenalties}
                  duration={2}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('dashboard.paidOf', { paid: paidPenalties, total: penalties.length })}
              </p>
              {/* Progress bar */}
              {penalties.length > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(paidPenalties / penalties.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {Math.round((paidPenalties / penalties.length) * 100)}% payées
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tontine Balances - NEW */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TontineBalance showDetails={true} />
          {(showAllBalances ? tontines : tontines.slice(0, 2)).map((tontine, index) => (
            <motion.div
              key={tontine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <TontineBalance tontineId={tontine.id} showDetails={true} />
            </motion.div>
          ))}
        </div>
        
        {/* View More Button */}
        {tontines.length > 2 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAllBalances(!showAllBalances)}
              className="gap-2"
            >
              {showAllBalances ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Voir plus ({tontines.length - 2} tontine{tontines.length - 2 > 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
          {/* Contribution Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tendance des Cotisations</CardTitle>
            <CardDescription>
              Évolution des 6 dernières sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contributionTrends.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Aucune session enregistrée</p>
                  <p className="text-xs mt-1">Les données apparaîtront après la création de sessions</p>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={contributionTrends}>
                <defs>
                  <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPenalties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stroke="hsl(160 84% 39%)"
                  strokeWidth={3}
                  fill="url(#colorContributions)"
                  name="Cotisations"
                />
                <Area
                  type="monotone"
                  dataKey="penalties"
                  stroke="hsl(0 84% 60%)"
                  strokeWidth={3}
                  fill="url(#colorPenalties)"
                  name="Pénalités"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Credit Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Statut des Crédits</CardTitle>
            <CardDescription>
              Répartition des crédits actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {credits.filter(c => c.statut === 'en_cours').length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Aucun crédit actif</p>
                  <p className="text-xs mt-1">Les statistiques apparaîtront après l'octroi de crédits</p>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={creditStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {creditStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Présence aux Sessions</CardTitle>
            <CardDescription>
              Taux de participation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contributionTrends.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Aucune donnée de présence</p>
                  <p className="text-xs mt-1">Créez des sessions pour suivre la présence</p>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contributionTrends}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                <Bar 
                  dataKey="attendance" 
                  fill="url(#colorAttendance)" 
                  name="Présents"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tontines Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tontines Actives</CardTitle>
            <CardDescription>
              État des tontines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tontines.filter(t => t.statut === 'Actif').slice(0, 5).map((tontine) => (
                <div key={tontine.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{tontine.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {tontine.membres_count || 0} membres • {formatCurrency(tontine.montant_cotisation)}
                    </p>
                  </div>
                  <Badge 
                    variant={tontine.type === 'presence' ? 'default' : 'secondary'}
                    className={tontine.type === 'presence' ? 'bg-emerald-600' : ''}
                  >
                    {t(`tontines.types.${tontine.type}`)}
                  </Badge>
                </div>
              ))}
              {tontines.filter(t => t.statut === 'Actif').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune tontine active
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications moved to header bell */}
      </div>

      <AGReportViewer
        open={showAGReport}
        onClose={() => {
          setShowAGReport(false);
          setAgReportData(null);
        }}
        data={agReportData}
        isLoading={isLoadingAGReport}
      />
    </motion.div>
  );
}
