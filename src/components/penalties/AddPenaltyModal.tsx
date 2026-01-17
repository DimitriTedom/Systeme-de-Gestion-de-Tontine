import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddPenaltyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPenaltyModal({ open, onOpenChange }: AddPenaltyModalProps) {
  const { t } = useTranslation();
  const { addPenalty } = usePenaltyStore();
  const { members } = useMemberStore();
  const { sessions } = useSessionStore();
  const { tontines } = useTontineStore();

  const penaltySchema = z.object({
    tontineId: z.string().min(1, t('penalties.validation.tontineRequired')),
    sessionId: z.string().min(1, t('penalties.validation.sessionRequired')),
    memberId: z.string().min(1, t('penalties.validation.memberRequired')),
    amount: z.coerce.number().min(1, t('penalties.validation.amountPositive')),
    penaltyType: z.string().min(1, t('penalties.validation.typeRequired')),
    reason: z.string().min(1, t('penalties.validation.reasonRequired')),
  });

  type PenaltyFormData = {
    tontineId: string;
    sessionId: string;
    memberId: string;
    amount: number;
    penaltyType: string;
    reason: string;
  };

  const form = useForm<PenaltyFormData>({
    resolver: zodResolver(penaltySchema) as any,
    defaultValues: {
      tontineId: '',
      sessionId: '',
      memberId: '',
      amount: 0,
      penaltyType: '',
      reason: '',
    },
  });

  const selectedTontineId = form.watch('tontineId');
  
  // Filter sessions by selected tontine
  const filteredSessions = sessions.filter(
    (session) => session.tontineId === selectedTontineId
  );

  // Get members of the selected tontine
  const selectedTontine = tontines.find((t) => t.id === selectedTontineId);
  const tontineMembers = members.filter(
    (member) => selectedTontine?.memberIds?.includes(member.id)
  );

  const onSubmit = async (data: PenaltyFormData) => {
    try {
      await addPenalty({
        tontineId: data.tontineId,
        sessionId: data.sessionId,
        memberId: data.memberId,
        amount: data.amount,
        penaltyType: data.penaltyType as 'late_contribution' | 'absence' | 'misconduct' | 'other',
        reason: data.reason,
        status: 'pending',
        createdAt: new Date(),
      });

      toast.success(t('penalties.addSuccess'), {
        description: t('penalties.penaltyCreated'),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add penalty:', error);
      toast.error(t('penalties.addError'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('penalties.addPenalty')}</DialogTitle>
          <DialogDescription>
            {t('penalties.addPenaltyDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tontineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nav.tontines')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('penalties.selectTontine')} />
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
                  <FormLabel>{t('penalties.session')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedTontineId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('penalties.selectSession')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          Séance #{session.sessionNumber} - {new Date(session.date).toLocaleDateString('fr-FR')}
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
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.member')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedTontineId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('penalties.selectMember')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(tontineMembers.length > 0 ? tontineMembers : members).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
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
              name="penaltyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('penalties.type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('penalties.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="absence">{t('penalties.types.absence')}</SelectItem>
                      <SelectItem value="late_contribution">{t('penalties.types.lateContribution')}</SelectItem>
                      <SelectItem value="misconduct">{t('penalties.types.misconduct')}</SelectItem>
                      <SelectItem value="other">{t('penalties.types.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('penalties.amount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('penalties.reason')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('penalties.reasonPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('penalties.addPenalty')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
