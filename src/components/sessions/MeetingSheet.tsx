import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { useContributionStore } from '@/stores/contributionStore';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MeetingSheetProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberContribution {
  memberId: string;
  isPresent: boolean;
  amount: number;
}

export function MeetingSheet({ sessionId, open, onOpenChange }: MeetingSheetProps) {
  const { t } = useTranslation();
  const { getSessionById, updateSession } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const { getContributionsBySessionId, bulkUpsertContributions } = useContributionStore();
  const { addPenalty, getPenaltiesBySessionId } = usePenaltyStore();

  const session = getSessionById(sessionId);
  const tontine = session ? getTontineById(session.tontineId) : null;
  const members = tontine?.memberIds.map(id => getMemberById(id)).filter(Boolean) || [];
  const existingContributions = getContributionsBySessionId(sessionId);
  const existingPenalties = getPenaltiesBySessionId(sessionId);

  const [contributions, setContributions] = useState<Record<string, MemberContribution>>({});
  
  // Default penalty amount for absences (5000 XAF as per MCD)
  const ABSENCE_PENALTY_AMOUNT = 5000;

  useEffect(() => {
    if (!members.length) return;

    // Initialize contributions from existing data or defaults
    const initialContributions: Record<string, MemberContribution> = {};
    
    members.forEach(member => {
      if (!member) return;
      
      const existing = existingContributions.find(c => c.memberId === member.id);
      initialContributions[member.id] = {
        memberId: member.id,
        isPresent: existing ? existing.status === 'completed' : false,
        amount: existing?.amount || (tontine?.contributionAmount || 0),
      };
    });

    setContributions(initialContributions);
  }, [sessionId, members.length]);

  if (!session || !tontine) {
    return null;
  }

  const handleAttendanceChange = (memberId: string, isPresent: boolean) => {
    setContributions(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        isPresent,
        // If presence tontine and marking present, set default amount
        amount: isPresent && tontine.type === 'presence' 
          ? tontine.contributionAmount 
          : prev[memberId]?.amount || 0,
      },
    }));
  };

  const handleAmountChange = (memberId: string, amount: number) => {
    setContributions(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        amount: isNaN(amount) ? 0 : amount,
      },
    }));
  };

  const calculateTotal = () => {
    return Object.values(contributions).reduce((sum, contrib) => {
      return sum + (contrib.isPresent ? contrib.amount : 0);
    }, 0);
  };

  const calculateAttendanceCount = () => {
    return Object.values(contributions).filter(c => c.isPresent).length;
  };

  const handleSave = () => {
    // Prepare contributions data
    const contributionsData = Object.values(contributions)
      .filter(c => c.isPresent)
      .map(c => ({
        sessionId: session.id,
        memberId: c.memberId,
        tontineId: tontine.id,
        amount: c.amount,
        expectedAmount: tontine.contributionAmount,
        paymentDate: session.date,
        paymentMethod: 'cash' as const,
        status: c.amount >= tontine.contributionAmount ? 'completed' as const : 'partial' as const,
      }));

    // Save contributions
    bulkUpsertContributions(contributionsData);

    // Handle penalties for absent members
    const absentMemberIds = Object.entries(contributions)
      .filter(([_, contrib]) => !contrib.isPresent)
      .map(([memberId, _]) => memberId);

    // Create penalties for absent members (if not already penalized)
    absentMemberIds.forEach(memberId => {
      const alreadyPenalized = existingPenalties.some(
        p => p.memberId === memberId && p.penaltyType === 'absence'
      );

      if (!alreadyPenalized) {
        addPenalty({
          sessionId: session.id,
          memberId,
          tontineId: tontine.id,
          amount: ABSENCE_PENALTY_AMOUNT,
          reason: t('penalties.autoPenalty'),
          penaltyType: 'absence',
          status: 'pending',
        });
      }
    });

    // Calculate total penalties
    const totalPenalties = absentMemberIds.length * ABSENCE_PENALTY_AMOUNT;

    // Update session totals
    updateSession(session.id, {
      totalContributions: calculateTotal(),
      totalPenalties,
      attendanceCount: calculateAttendanceCount(),
      status: 'completed',
    });

    onOpenChange(false);
  };

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
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const total = calculateTotal();
  const attendanceCount = calculateAttendanceCount();
  const isPresenceTontine = tontine.type === 'presence';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{t('sessions.meetingSheet')}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">{tontine.name}</span>
                <Badge variant={isPresenceTontine ? "default" : "secondary"}>
                  {t(`tontines.types.${tontine.type}`)}
                </Badge>
              </div>
              <div className="text-sm">
                <div><strong>{t('sessions.sessionNumber')}:</strong> #{session.sessionNumber}</div>
                <div><strong>{t('sessions.date')}:</strong> {formatDate(session.date)}</div>
                {session.location && (
                  <div><strong>{t('sessions.location')}:</strong> {session.location}</div>
                )}
                {session.agenda && (
                  <div><strong>{t('sessions.agenda')}:</strong> {session.agenda}</div>
                )}
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isPresenceTontine && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ {t('sessions.contributionRequired')}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('sessions.attendance')} & {t('sessions.contribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('sessions.member')}</TableHead>
                    <TableHead className="w-[100px] text-center">
                      {t('sessions.attendance')}
                    </TableHead>
                    <TableHead className="w-[150px]">
                      {t('sessions.expectedAmount')}
                    </TableHead>
                    <TableHead className="w-[200px]">
                      {t('sessions.actualAmount')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, index) => {
                    if (!member) return null;
                    
                    const contrib = contributions[member.id] || {
                      memberId: member.id,
                      isPresent: false,
                      amount: tontine.contributionAmount,
                    };

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={contrib.isPresent}
                            onCheckedChange={(checked) =>
                              handleAttendanceChange(member.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(tontine.contributionAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={contrib.amount}
                            onChange={(e) =>
                              handleAmountChange(member.id, parseFloat(e.target.value))
                            }
                            disabled={!contrib.isPresent}
                            min={0}
                            className={
                              contrib.isPresent &&
                              isPresenceTontine &&
                              contrib.amount < tontine.contributionAmount
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {contrib.isPresent &&
                            isPresenceTontine &&
                            contrib.amount < tontine.contributionAmount && (
                              <p className="text-xs text-red-500 mt-1">
                                Montant requis: {formatCurrency(tontine.contributionAmount)}
                              </p>
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">{t('sessions.attendanceCount')}:</span>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {attendanceCount} / {members.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>{t('sessions.totalCollected')}:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
