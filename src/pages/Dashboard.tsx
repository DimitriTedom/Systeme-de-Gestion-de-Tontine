import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Users, CreditCard, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
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
} from 'recharts';
import { useSessionStore } from '@/stores/sessionStore';
import { useContributionStore } from '@/stores/contributionStore';
import { useCreditStore } from '@/stores/creditStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { AGReportViewer } from '@/components/reports/ReportViewers';
import { reportService, AGSynthesisReport } from '@/services/reportService';
import { useToast } from '@/components/ui/toast-provider';

export default function Dashboard() {
  const { t } = useTranslation();
  const { sessions } = useSessionStore();
  const { contributions } = useContributionStore();
  const { credits } = useCreditStore();
  const { penalties } = usePenaltyStore();
  const { members } = useMemberStore();
  const { tontines } = useTontineStore();
  const { toast } = useToast();
  const [showAGReport, setShowAGReport] = useState(false);
  const [agReportData, setAgReportData] = useState<AGSynthesisReport | null>(null);
  const [isLoadingAGReport, setIsLoadingAGReport] = useState(false);

  const handleGenerateAGReport = async () => {
    setIsLoadingAGReport(true);
    setShowAGReport(true);
    try {
      const data = await reportService.getAGSynthesisReport();
      setAgReportData(data);
    } catch (error) {
      console.error('Error loading AG synthesis report:', error);
      toast.error('Erreur lors du chargement de la synthèse AG');
      setShowAGReport(false);
    } finally {
      setIsLoadingAGReport(false);
    }
  };

  // Calculate total cash in hand
  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalCreditsGranted = credits
    .filter(c => c.status === 'disbursed' || c.status === 'repaying')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalCashInHand = totalContributions - totalCreditsGranted;

  // Calculate contribution trends (last 6 sessions)
  const contributionTrends = sessions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)
    .map((session) => ({
      name: `Session ${session.sessionNumber}`,
      contributions: session.totalContributions,
      penalties: session.totalPenalties,
      attendance: session.attendanceCount,
    }));

  // Calculate credit status
  const creditsOnTrack = credits.filter(c => {
    if (c.status === 'completed') return true;
    if (c.status === 'repaying') {
      const daysUntilDue = Math.ceil((c.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const progressPercentage = (c.amountPaid / c.repaymentAmount) * 100;
      const totalDays = Math.ceil((c.dueDate.getTime() - c.disbursementDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - daysUntilDue;
      const expectedProgress = (daysPassed / totalDays) * 100;
      return progressPercentage >= expectedProgress * 0.8; // 80% of expected progress
    }
    return false;
  }).length;

  const creditsLate = credits.filter(c => {
    if (c.status === 'defaulted') return true;
    if (c.status === 'repaying') {
      const daysUntilDue = Math.ceil((c.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) return true; // Past due date
      const progressPercentage = (c.amountPaid / c.repaymentAmount) * 100;
      const totalDays = Math.ceil((c.dueDate.getTime() - c.disbursementDate.getTime()) / (1000 * 60 * 60 * 24));
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
  const pendingPenalties = penalties.filter(p => p.status === 'pending').length;
  const paidPenalties = penalties.filter(p => p.status === 'paid').length;

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
          <h1 className="text-2xl sm:text-3xl font-bold">{t('nav.dashboard')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Vue d'ensemble de la gestion de tontine
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={handleGenerateAGReport} variant="outline" className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Exporter Synthèse AG</span>
            <span className="sm:hidden">Export AG</span>
          </Button>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-emerald-200 dark:border-emerald-900 overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Cash en Caisse</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalCashInHand)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cotisations - Crédits accordés
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card overflow-hidden group hover:shadow-lg hover:shadow-slate-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sur {members.length} membres totaux
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-amber-200 dark:border-amber-900 overflow-hidden group hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Crédits Actifs</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800">
                <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {credits.filter(c => c.status === 'repaying').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {creditsOnTrack} en bonne voie, {creditsLate} en retard
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-red-200 dark:border-red-900 overflow-hidden group hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Pénalités</CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{pendingPenalties}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidPenalties} payées sur {penalties.length} totales
              </p>
            </CardContent>
          </Card>
        </motion.div>
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
              {tontines.filter(t => t.status === 'active').slice(0, 5).map((tontine) => (
                <div key={tontine.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{tontine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tontine.membersCount || 0} membres • {formatCurrency(tontine.contributionAmount)}
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
              {tontines.filter(t => t.status === 'active').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune tontine active
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
