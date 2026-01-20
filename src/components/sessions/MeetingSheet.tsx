import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Lock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
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
import type { MembreSeance, PenaltySummary } from '@/types/database.types';

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

interface SaveResult {
  success: boolean;
  message: string;
  contributionsCreated: number;
  penaltiesCreated: PenaltySummary[];
  totalContributions: number;
}

export function MeetingSheet({ sessionId, open, onOpenChange }: MeetingSheetProps) {
  const { t } = useTranslation();
  const { 
    getSessionById, 
    updateSession, 
    closeSession, 
    getSessionMembers, 
    recordAttendanceAndContribution 
  } = useSessionStore();
  const { getTontineById } = useTontineStore();
  const { getContributionsBySessionId } = useContributionStore();

  const session = getSessionById(sessionId);
  const tontine = session ? getTontineById(session.id_tontine) : null;
  const existingContributions = getContributionsBySessionId(sessionId);

  const [members, setMembers] = useState<MembreSeance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contributions, setContributions] = useState<Record<number, MemberContribution>>({});
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSummary, setClosingSummary] = useState<PenaltySummary[] | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  
  // Default penalty amount for absences (5000 XAF as per MCD)
  const ABSENCE_PENALTY_AMOUNT = 5000;

  // Fetch members with nb_parts from Supabase RPC
  const fetchMembers = useCallback(async () => {
    if (!session?.id) return;
    
    setLoading(true);
    try {
      const attendanceMembers = await getSessionMembers(session.id);
      setMembers(attendanceMembers);
    } catch (error) {
      console.error('Failed to fetch session members:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.id, getSessionMembers]);

  useEffect(() => {
    if (open && session?.id) {
      fetchMembers();
    }
  }, [open, session?.id, fetchMembers]);

  // Initialize contributions from existing data or defaults
  useEffect(() => {
    if (!members.length || isInitialized) return;

    const initialContributions: Record<number, MemberContribution> = {};
    
    members.forEach(member => {
      if (!member) return;
      
      const existing = existingContributions.find(c => String(c.id_membre) === String(member.id_membre));
      initialContributions[member.id_membre] = {
        memberId: member.id_membre,
        isPresent: existing ? existing.statut === 'complete' : (member.deja_cotise || false),
        amount: existing?.montant || member.montant_cotise || member.expected_contribution,
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
      setSaveResult(null);
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
        if (cleanAmount !== member.expected_contribution) {
          error = t('sessions.validation.presenceMustBeExact');
        }
      } else if (tontine.type === 'optionnelle') {
        if (cleanAmount > 0 && cleanAmount % tontine.montant_cotisation !== 0) {
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

    setSaving(true);
    
    try {
      let contributionsCreated = 0;
      const penaltiesCreated: PenaltySummary[] = [];

      // Save each member's attendance and contribution via RPC
      for (const member of members) {
        const contrib = contributions[member.id_membre];
        if (!contrib) continue;

        await recordAttendanceAndContribution(
          session.id,
          String(member.id_membre),
          contrib.isPresent,
          contrib.isPresent ? contrib.amount : undefined
        );
        
        contributionsCreated++;
      }

      // Update session status locally
      updateSession(session.id, {
        statut: 'en_cours',
        total_cotisations: calculateTotal(),
        nombre_presents: calculateAttendanceCount(),
      });

      setSaveResult({
        success: true,
        message: t('sessions.meetingSaved'),
        contributionsCreated,
        penaltiesCreated,
        totalContributions: calculateTotal(),
      });

      // Refresh members data
      await fetchMembers();
    } catch (error) {
      console.error('Failed to save meeting:', error);
      setSaveResult({
        success: false,
        message: t('sessions.meetingSaveFailed'),
        contributionsCreated: 0,
        penaltiesCreated: [],
        totalContributions: 0,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session || !tontine) return;
    setShowCloseDialog(true);
  };

  const confirmCloseSession = async () => {
    if (!session || !tontine) return;

    setSaving(true);
    try {
      // Call the close session via store
      const result = await closeSession(session.id);

      if (result) {
        // Transform result to PenaltySummary format
        const penalties: PenaltySummary[] = result.penalites_creees?.map((p) => ({
          nom: p.nom,
          prenom: p.prenom,
          montant: p.montant,
          raison: p.raison,
        })) || [];

        setClosingSummary(penalties);
        
        // Update local session state
        updateSession(session.id, {
          statut: 'terminee',
          total_cotisations: result.total_cotisations,
          total_penalites: result.total_penalites,
          nombre_presents: calculateAttendanceCount(),
        });
      }

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
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  if (!session || !tontine) {
    return null;
  }

  const total = calculateTotal();
  const attendanceCount = calculateAttendanceCount();
  const isPresenceTontine = tontine?.type === 'presence';
  const isSessionClosed = session.statut === 'terminee';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle>{t('sessions.meetingSheet')}</SheetTitle>
          <SheetDescription>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">{tontine.nom}</span>
                <Badge variant={isPresenceTontine ? "default" : "secondary"}>
                  {t(`tontines.types.${tontine.type}`)}
                </Badge>
              </div>
              <div className="text-sm">
                <div><strong>{t('sessions.sessionNumber')}:</strong> #{session.numero_seance}</div>
                <div><strong>{t('sessions.date')}:</strong> {formatDate(session.date)}</div>
                {session.lieu && (
                  <div><strong>{t('sessions.location')}:</strong> {session.lieu}</div>
                )}
                {session.ordre_du_jour && (
                  <div><strong>{t('sessions.agenda')}:</strong> {session.ordre_du_jour}</div>
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

          {/* Save Result Alert */}
          {saveResult && (
            <Alert variant={saveResult.success ? "default" : "destructive"}>
              {saveResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-semibold">{saveResult.message}</div>
                {saveResult.success && (
                  <div className="text-sm mt-1">
                    {t('sessions.contributions')}: {saveResult.contributionsCreated} | {t('sessions.total')}: {formatCurrency(saveResult.totalContributions)}
                  </div>
                )}
              </AlertDescription>
            </Alert>
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
              ) : members.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  {t('sessions.noMembers')}
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
                      <TableHead className="w-[100px] text-center">
                        {t('sessions.status')}
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
                              disabled={isSessionClosed || saving}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(member.expected_contribution)}
                            </div>
                            {member.nb_parts > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {member.nb_parts} × {formatCurrency(tontine?.montant_cotisation || 0)}
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
                              disabled={!contrib.isPresent || isSessionClosed || saving}
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
                          <TableCell className="text-center">
                            {member.deja_cotise ? (
                              <Badge variant="default" className="bg-emerald-600">
                                {t('sessions.paid')}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {t('sessions.pending')}
                              </Badge>
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

          {isSessionClosed && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                {t('sessions.sessionClosed')}
              </AlertDescription>
            </Alert>
          )}

          {closingSummary && closingSummary.length > 0 && (
            <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
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
              
              {!isSessionClosed && (
                <>
                  <Button 
                    onClick={handleSave} 
                    className="bg-primary"
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? t('common.saving') : t('sessions.saveProgress')}
                  </Button>
                  <Button 
                    onClick={handleCloseSession} 
                    variant="destructive"
                    disabled={saving}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {t('sessions.closeSession')}
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
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                {t('sessions.closeSessionSummary')}:
              </p>
              <ul className="text-sm space-y-1">
                <li>✓ {t('sessions.presentMembers')}: {attendanceCount}</li>
                <li>✓ {t('sessions.absentMembers')}: {members.length - attendanceCount}</li>
                <li>✓ {t('sessions.totalContributions')}: {formatCurrency(total)}</li>
                <li>⚠️ {t('sessions.penaltyPerAbsence')}: {formatCurrency(ABSENCE_PENALTY_AMOUNT)}</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCloseDialog(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={confirmCloseSession} disabled={saving} variant="destructive">
                {saving ? t('common.loading') : t('sessions.confirmClose')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Session Report Modal */}
        <SessionReportModal
          session={{
            date: new Date(session.date),
            sessionNumber: session.numero_seance,
            location: session.lieu || '',
            status: session.statut,
          }}
          tontine={{
            name: tontine.nom,
            type: tontine.type,
            contributionAmount: tontine.montant_cotisation,
          }}
          totalExpected={members.reduce((sum, m) => sum + m.expected_contribution, 0)}
          totalCollected={total}
          totalPenalties={session.total_penalites || 0}
          attendanceCount={attendanceCount}
          totalMembers={members.length}
          open={showReportModal}
          onOpenChange={setShowReportModal}
        />
      </SheetContent>
    </Sheet>
  );
}
