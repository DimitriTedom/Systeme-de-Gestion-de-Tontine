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
import { createBulkContributions, getSessionAttendance, saveSessionMeeting, type CotisationCreate, type SaveMeetingRecord } from '@/services/sessionService';
import type { AttendanceRecord, PenaltySummary, SessionAttendanceMember } from '@/types';

interface MeetingSheetProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberContribution {
  memberId: number;
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
  const existingContributions = getContributionsBySessionId(sessionId);

  const [members, setMembers] = useState<SessionAttendanceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<Record<number, MemberContribution>>({});
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSummary, setClosingSummary] = useState<PenaltySummary[] | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Default penalty amount for absences (5000 XAF as per MCD)
  const ABSENCE_PENALTY_AMOUNT = 5000;

  // Fetch members with nb_parts from backend
  useEffect(() => {
    const fetchMembers = async () => {
      if (!session?.id) return;
      
      setLoading(true);
      try {
        const attendanceMembers = await getSessionAttendance(session.id);
        setMembers(attendanceMembers);
      } catch (error) {
        console.error('Failed to fetch session attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchMembers();
    }
  }, [session?.id, open]);

  useEffect(() => {
    if (!members.length || isInitialized) return;

    // Initialize contributions from existing data or defaults
    const initialContributions: Record<number, MemberContribution> = {};
    
    members.forEach(member => {
      if (!member) return;
      
      const existing = existingContributions.find(c => String(c.memberId) === String(member.id_membre));
      initialContributions[member.id_membre] = {
        memberId: member.id_membre,
        isPresent: existing ? existing.status === 'completed' : false,
        amount: existing?.amount || member.expected_contribution,
      };
    });

    setContributions(initialContributions);
    setIsInitialized(true);
  }, [members.length, isInitialized, existingContributions]);

  // Reset initialization when sheet is closed
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setContributions({});
    }
  }, [open]);

  const handleAttendanceChange = (memberId: number, isPresent: boolean) => {
    const member = members.find(m => m.id_membre === memberId);
    if (!member) return;

    setContributions(prev => ({
      ...prev,
      [memberId]: {
        memberId: memberId,
        isPresent,
        // If presence tontine and marking present, set expected amount based on nb_parts
        amount: isPresent && tontine?.type === 'presence' 
          ? member.expected_contribution
          : prev[memberId]?.amount || 0,
      },
    }));
  };

  const handleAmountChange = (memberId: number, amount: number) => {
    const cleanAmount = isNaN(amount) ? 0 : amount;
    const member = members.find(m => m.id_membre === memberId);
    
    // Validate based on tontine type
    let error = '';
    if (tontine && contributions[memberId]?.isPresent && member) {
      if (tontine.type === 'presence') {
        // For presence tontines: must be exactly nb_parts * montant_cotisation
        if (cleanAmount !== member.expected_contribution) {
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
        memberId: memberId,
        isPresent: prev[memberId]?.isPresent || false,
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
    
    // Prepare meeting records for the new consolidated endpoint
    const meetingRecords: SaveMeetingRecord[] = members.map(member => ({
      id_membre: parseInt(member.id_membre, 10),
      present: contributions[member.id_membre]?.isPresent || false,
      montant_paye: contributions[member.id_membre]?.isPresent 
        ? contributions[member.id_membre].amount 
        : undefined,
    }));

    try {
      // Save meeting using the new consolidated endpoint
      const result = await saveSessionMeeting(session.id, meetingRecords);
      
      // Update session status
      updateSession(session.id, {
        status: 'completed',
        totalContributions: result.total_contributions,
        totalPenalties: result.total_penalties,
        attendanceCount: calculateAttendanceCount(),
      });

      // Show success message with summary
      const message = `${t('sessions.meetingSaved')}!\n\n` +
        `${t('sessions.contributions')}: ${result.contributions_created}\n` +
        `${t('sessions.penalties')}: ${result.penalties_created.length}\n` +
        `${t('sessions.total')}: ${formatCurrency(result.total_contributions)}`;
      
      alert(message);
      
      // If penalties were created, show them
      if (result.penalties_created.length > 0) {
        setClosingSummary(result.penalties_created);
        setTimeout(() => setClosingSummary(null), 5000);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save meeting:', error);
      alert(t('sessions.meetingSaveFailed'));
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

  if (!session || !tontine) {
    return null;
  }

  const total = calculateTotal();
  const attendanceCount = calculateAttendanceCount();
  const isPresenceTontine = tontine?.type === 'presence';

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
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">{t('common.loading')}...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>{t('sessions.member')}</TableHead>
                      <TableHead className="w-[80px] text-center">
                        {t('sessions.parts')}
                      </TableHead>
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
                      
                      const contrib = contributions[member.id_membre] || {
                        memberId: member.id_membre,
                        isPresent: false,
                        amount: member.expected_contribution,
                      };

                      return (
                        <TableRow key={member.id_membre}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {member.prenom} {member.nom}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{member.nb_parts}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              key={`checkbox-${member.id_membre}-${contrib.isPresent}`}
                              checked={contrib.isPresent}
                              onCheckedChange={(checked) =>
                                handleAttendanceChange(member.id_membre, checked as boolean)
                              }
                              disabled={session.status === 'closed'}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(member.expected_contribution)}
                            </div>
                            {member.nb_parts > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {member.nb_parts} × {formatCurrency(tontine?.contributionAmount || 0)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={contrib.amount}
                              onChange={(e) =>
                                handleAmountChange(member.id_membre, parseFloat(e.target.value))
                              }
                              disabled={!contrib.isPresent || session.status === 'closed'}
                              min={0}
                              className={
                                validationErrors[member.id_membre]
                                  ? 'border-red-500'
                                  : ''
                              }
                            />
                            {validationErrors[member.id_membre] && (
                              <p className="text-xs text-red-500 mt-1">
                                {validationErrors[member.id_membre]}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
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
                  <Button onClick={handleSave} className="bg-primary">
                    <Save className="mr-2 h-4 w-4" />
                    {t('sessions.saveAndClose')}
                  </Button>
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
