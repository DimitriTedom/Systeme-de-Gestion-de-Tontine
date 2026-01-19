import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { useContributionStore } from '@/stores/contributionStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePenaltyStore } from '@/stores/penaltyStore';

interface Activity {
  id: string;
  type: 'contribution' | 'member' | 'session' | 'penalty';
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
  memberName?: string;
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { contributions } = useContributionStore();
  const { members } = useMemberStore();
  const { sessions } = useSessionStore();
  const { penalties } = usePenaltyStore();

  useEffect(() => {
    const recentActivities: Activity[] = [];

    // Get recent contributions
    contributions
      .slice()
      .sort((a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
      .slice(0, 3)
      .forEach(contrib => {
        const member = members.find(m => m.id === contrib.id_membre);
        if (member) {
          recentActivities.push({
            id: `contrib-${contrib.id}`,
            type: 'contribution',
            message: `a payé ${new Intl.NumberFormat('fr-FR').format(contrib.montant)} XAF`,
            timestamp: new Date(contrib.date_paiement),
            icon: <DollarSign className="h-4 w-4" />,
            color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
            memberName: `${member.nom} ${member.prenom}`,
          });
        }
      });

    // Get recent members
    members
      .slice()
      .sort((a, b) => new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime())
      .slice(0, 2)
      .forEach(member => {
        recentActivities.push({
          id: `member-${member.id}`,
          type: 'member',
          message: `a rejoint la tontine`,
          timestamp: new Date(member.date_inscription),
          icon: <Users className="h-4 w-4" />,
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
          memberName: `${member.nom} ${member.prenom}`,
        });
      });

    // Get recent sessions
    sessions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
      .forEach(session => {
        recentActivities.push({
          id: `session-${session.id}`,
          type: 'session',
          message: `Séance #${session.numero_seance} complétée`,
          timestamp: new Date(session.date),
          icon: <Calendar className="h-4 w-4" />,
          color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
        });
      });

    // Get recent penalties
    penalties
      .filter(p => p.statut === 'paye')
      .slice()
      .sort((a, b) => new Date(b.date_paiement || 0).getTime() - new Date(a.date_paiement || 0).getTime())
      .slice(0, 1)
      .forEach(penalty => {
        const member = members.find(m => m.id === penalty.id_membre);
        if (member) {
          recentActivities.push({
            id: `penalty-${penalty.id}`,
            type: 'penalty',
            message: `pénalité payée (${new Intl.NumberFormat('fr-FR').format(penalty.montant)} XAF)`,
            timestamp: new Date(penalty.date_paiement || penalty.date),
            icon: <AlertTriangle className="h-4 w-4" />,
            color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
            memberName: `${member.nom} ${member.prenom}`,
          });
        }
      });

    // Sort by timestamp and take top 5
    const sortedActivities = recentActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    setActivities(sortedActivities);
  }, [contributions, members, sessions, penalties]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Activité Récente
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En direct
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground text-center py-4"
            >
              Aucune activité récente
            </motion.p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {activity.memberName ? (
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        {getInitials(activity.memberName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`p-2 rounded-full ${activity.color}`}>
                      {activity.icon}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {activity.memberName && (
                        <span className="font-semibold">{activity.memberName}</span>
                      )}{' '}
                      <span className="text-muted-foreground">{activity.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>

                  <div className={`p-1.5 rounded-md ${activity.color}`}>
                    {activity.icon}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Trust indicators */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synchronisé</span>
          </div>
          <span>{members.length} membres actifs</span>
        </div>
      </CardContent>
    </Card>
  );
}
