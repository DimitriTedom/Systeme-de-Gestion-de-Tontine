import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  Calendar,
  DollarSign,
  Users,
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

export function NotificationBell() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { contributions } = useContributionStore();
  const { members } = useMemberStore();
  const { sessions } = useSessionStore();
  const { penalties } = usePenaltyStore();

  useEffect(() => {
    const recentActivities: Activity[] = [];

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

    const sortedActivities = recentActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);

    setActivities(sortedActivities);
  }, [contributions, members, sessions, penalties]);

  const unreadCount = useMemo(() => activities.length, [activities.length]);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full border border-border bg-background/60"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Badge variant="secondary" className="text-xs">
            {unreadCount} récentes
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[360px] overflow-y-auto">
          {activities.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-2 px-2 py-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                >
                  {activity.memberName ? (
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        {getInitials(activity.memberName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={cn('p-2 rounded-full', activity.color)}>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>

                  <div className={cn('p-1.5 rounded-md', activity.color)}>
                    {activity.icon}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
