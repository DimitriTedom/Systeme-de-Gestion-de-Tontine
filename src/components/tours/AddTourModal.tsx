import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTourStore, EligibleBeneficiary } from '@/stores/tourStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trophy, AlertCircle } from 'lucide-react';

interface AddTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTourModal({ open, onOpenChange }: AddTourModalProps) {
  const { t } = useTranslation();
  const { addTour, getEligibleBeneficiaries, getNextTourNumber, getSessionTotalContributions } = useTourStore();
  const { members } = useMemberStore();
  const { sessions } = useSessionStore();
  const { tontines } = useTontineStore();

  const [eligibleBeneficiaries, setEligibleBeneficiaries] = useState<EligibleBeneficiary[]>([]);
  const [nextTourNumber, setNextTourNumber] = useState<number>(1);
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0);
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);

  const tourSchema = z.object({
    tontineId: z.string().min(1, t('tours.validation.tontineRequired')),
    sessionId: z.string().min(1, t('tours.validation.sessionRequired')),
    beneficiaryId: z.string().min(1, t('tours.validation.beneficiaryRequired')),
    amount: z.coerce.number().min(1, t('tours.validation.amountPositive')),
  });

  type TourFormData = {
    tontineId: string;
    sessionId: string;
    beneficiaryId: string;
    amount: number;
  };

  const form = useForm<TourFormData>({
    resolver: zodResolver(tourSchema) as any,
    defaultValues: {
      tontineId: '',
      sessionId: '',
      beneficiaryId: '',
      amount: 0,
    },
  });

  const selectedTontineId = form.watch('tontineId');
  const selectedSessionId = form.watch('sessionId');

  // Filter sessions by selected tontine (only completed/closed sessions)
  const filteredSessions = sessions.filter(
    (session) => session.tontineId === selectedTontineId && 
                 (session.status === 'completed' || session.status === 'closed')
  );

  // Load eligible beneficiaries when tontine changes
  useEffect(() => {
    if (selectedTontineId) {
      setIsLoadingEligible(true);
      Promise.all([
        getEligibleBeneficiaries(selectedTontineId),
        getNextTourNumber(selectedTontineId),
      ]).then(([eligible, nextNum]) => {
        setEligibleBeneficiaries(eligible);
        setNextTourNumber(nextNum);
        setIsLoadingEligible(false);
      });
    } else {
      setEligibleBeneficiaries([]);
      setNextTourNumber(1);
    }
  }, [selectedTontineId, getEligibleBeneficiaries, getNextTourNumber]);

  // Load suggested amount from session contributions
  useEffect(() => {
    if (selectedSessionId) {
      getSessionTotalContributions(selectedSessionId).then((total) => {
        setSuggestedAmount(total);
        form.setValue('amount', total);
      });
    }
  }, [selectedSessionId, getSessionTotalContributions, form]);

  const onSubmit = async (data: TourFormData) => {
    try {
      await addTour({
        tontineId: data.tontineId,
        sessionId: data.sessionId,
        beneficiaryId: data.beneficiaryId,
        tourNumber: nextTourNumber,
        amount: data.amount,
        dateTour: new Date(),
      });

      toast.success(t('tours.addSuccess'), {
        description: t('tours.tourAssigned'),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign tour:', error);
      toast.error(t('tours.addError'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      });
    }
  };

  // Get members for the selected tontine (fallback if API doesn't return eligible)
  const selectedTontine = tontines.find((t) => t.id === selectedTontineId);
  const tontineMembers = members.filter(
    (member) => selectedTontine?.memberIds?.includes(member.id)
  );

  // Use eligible beneficiaries from API, or fallback to tontine members
  const beneficiaryOptions = eligibleBeneficiaries.length > 0 
    ? eligibleBeneficiaries 
    : tontineMembers.map(m => ({
        id: m.id,
        nom: m.lastName,
        prenom: m.firstName,
        hasReceivedTour: false,
      }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('tours.assignTour')}
          </DialogTitle>
          <DialogDescription>
            {t('tours.assignTourDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tour Number Badge */}
            {selectedTontineId && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{t('tours.nextTour')}:</span>
                <Badge variant="secondary" className="font-mono text-lg">
                  #{nextTourNumber}
                </Badge>
              </div>
            )}

            <FormField
              control={form.control}
              name="tontineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nav.tontines')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('tours.selectTontine')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tontines.map((tontine) => (
                        <SelectItem key={tontine.id} value={tontine.id}>
                          {tontine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tours.session')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedTontineId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('tours.selectSession')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSessions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t('tours.noClosedSessions')}
                        </div>
                      ) : (
                        filteredSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            Séance #{session.sessionNumber} - {new Date(session.date).toLocaleDateString('fr-FR')}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('tours.sessionNote')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="beneficiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tours.beneficiary')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedTontineId || isLoadingEligible}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingEligible ? t('common.loading') : t('tours.selectBeneficiary')
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {beneficiaryOptions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t('tours.noEligibleMembers')}
                        </div>
                      ) : (
                        beneficiaryOptions.map((member) => (
                          <SelectItem 
                            key={member.id} 
                            value={member.id}
                            disabled={member.hasReceivedTour}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{member.prenom} {member.nom}</span>
                              {member.hasReceivedTour && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('tours.alreadyReceived')}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {eligibleBeneficiaries.filter(b => !b.hasReceivedTour).length} {t('tours.eligibleMembers')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tours.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100000"
                      {...field}
                    />
                  </FormControl>
                  {suggestedAmount > 0 && (
                    <FormDescription>
                      {t('tours.suggestedAmount')}: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XAF',
                        minimumFractionDigits: 0,
                      }).format(suggestedAmount)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                <Trophy className="mr-2 h-4 w-4" />
                {t('tours.assignTour')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
