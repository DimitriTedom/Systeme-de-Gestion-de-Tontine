import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, Lock, FileText } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { useContributionStore } from '@/stores/contributionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SessionReportModal } from './SessionReportModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBulkContributions, type CotisationCreate } from '@/services/sessionService';
import type { AttendanceRecord, PenaltySummary } from '@/types';

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
  const { getSessionById, updateSession, closeSession } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { getMemberById } = useMemberStore();
  const { getContributionsBySessionId, bulkUpsertContributions } = useContributionStore();

  const session = getSessionById(sessionId);
  const tontine = session ? getTontineById(session.tontineId) : null;
  const members = tontine?.memberIds.map(id => getMemberById(id)).filter(Boolean) || [];
  const existingContributions = getContributionsBySessionId(sessionId);

  const [contributions, setContributions] = useState<Record<string, MemberContribution>>({});
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSummary, setClosingSummary] = useState<PenaltySummary[] | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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
    const cleanAmount = isNaN(amount) ? 0 : amount;
    
    // Validate based on tontine type
    let error = '';
    if (tontine && contributions[memberId]?.isPresent) {
      if (tontine.type === 'presence') {
        // For presence tontines: must be exactly nb_parts * montant_cotisation
        // Since we don't have nb_parts in this mock, we use contributionAmount
        if (cleanAmount !== tontine.contributionAmount) {
          error = t('sessions.validation.presenceMustBeExact');
        }
      } else if (tontine.type === 'optional') {
        // For optional tontines: can be 0 or any multiple of base montant_cotisation
        if (cleanAmount > 0 && cleanAmount % tontine.contributionAmount !== 0) {
          error = t('sessions.validation.optionalMustBeMultiple');
        }
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [memberId]: error,
    }));
    
    setContributions(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        amount: cleanAmount,
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

  const handleSave = async () => {
    if (!session || !tontine) return;
    
    // Check for validation errors
    const hasErrors = Object.values(validationErrors).some(err => err !== '');
    if (hasErrors) {
      alert(t('sessions.validation.fixErrors'));
      return;
    }
    
    // Prepare contributions for bulk save
    const contributionsData: CotisationCreate[] = Object.values(contributions)
      .filter(c => c.isPresent && c.amount > 0)
      .map(c => ({
        montant: c.amount,
        date_paiement: session.date instanceof Date 
          ? session.date.toISOString().split('T')[0]
          : session.date,
        id_membre: parseInt(c.memberId, 10),
        id_seance: parseInt(session.id, 10),
      }));

    try {
      // Bulk save contributions to backend
      if (contributionsData.length > 0) {
        await createBulkContributions(contributionsData);
      }

      // Update local store
      const localContributions = Object.values(contributions)
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

      bulkUpsertContributions(localContributions);

      // Update session totals
      updateSession(session.id, {
        totalContributions: calculateTotal(),
        attendanceCount: calculateAttendanceCount(),
      });

      alert(t('sessions.contributionsSaved'));
    } catch (error) {
      console.error('Failed to save contributions:', error);
      alert(t('sessions.contributionsSaveFailed'));
    }
  };

  const handleCloseSession = async () => {
    if (!session || !tontine) return;
    
    setShowCloseDialog(true);
  };

  const confirmCloseSession = async () => {
    if (!session || !tontine) return;

    try {
      // Prepare attendance records
      const attendance: AttendanceRecord[] = Object.values(contributions).map(c => ({
        id_membre: c.memberId,
        present: c.isPresent,
        montant: c.isPresent ? c.amount : undefined,
      }));

      // Call close session endpoint
      const result = await closeSession(session.id, {
        attendance,
        montant_penalite_absence: ABSENCE_PENALTY_AMOUNT,
      });

      // Show penalty summary
      setClosingSummary(result.penalties_created);
      setShowCloseDialog(false);
      
      // Close the meeting sheet after showing summary
      setTimeout(() => {
        setClosingSummary(null);
        onOpenChange(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to close session:', error);
      alert(t('sessions.closeSessionFailed'));
      setShowCloseDialog(false);
    }
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
                            disabled={session.status === 'closed'}
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
                            disabled={!contrib.isPresent || session.status === 'closed'}
                            min={0}
                            className={
                              validationErrors[member.id]
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {validationErrors[member.id] && (
                            <p className="text-xs text-red-500 mt-1">
                              {validationErrors[member.id]}
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

          {session.status === 'closed' && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                {t('sessions.sessionClosed')}
              </AlertDescription>
            </Alert>
          )}

          {closingSummary && closingSummary.length > 0 && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription>
                <div className="font-semibold mb-2">
                  {t('sessions.penaltiesCreated')}:
                </div>
                <ul className="space-y-1">
                  {closingSummary.map((penalty, idx) => (
                    <li key={idx} className="text-sm">
                      {penalty.nom} {penalty.prenom}: {formatCurrency(penalty.montant)} ({penalty.raison})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowReportModal(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('sessions.viewReport')}
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              
              {session.status !== 'closed' && (
                <>
                  <Button onClick={handleSave} variant="secondary">
                    <Save className="mr-2 h-4 w-4" />
                    {t('sessions.saveContributions')}
                  </Button>
                  
                  {tontine.type === 'presence' && (
                    <Button onClick={handleCloseSession}>
                      <Lock className="mr-2 h-4 w-4" />
                      {t('sessions.closeSession')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Close Session Confirmation Dialog */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('sessions.confirmCloseSession')}</DialogTitle>
              <DialogDescription>
                {t('sessions.closeSessionWarning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={confirmCloseSession}>
                {t('sessions.confirmClose')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Session Report Modal */}
        <SessionReportModal
          session={session}
          tontine={tontine}
          totalExpected={members.length * tontine.contributionAmount}
          totalCollected={total}
          totalPenalties={session.totalPenalties}
          attendanceCount={attendanceCount}
          totalMembers={members.length}
          open={showReportModal}
          onOpenChange={setShowReportModal}
        />
      </SheetContent>
    </Sheet>
  );
}
