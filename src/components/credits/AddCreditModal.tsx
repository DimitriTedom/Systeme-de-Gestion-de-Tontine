import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useCreditStore } from '@/stores/creditStore';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useToast } from '@/components/ui/toast-provider';
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
import { DatePicker } from '@/components/ui/date-picker';

interface AddCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCreditModal({ open, onOpenChange }: AddCreditModalProps) {
  const { t } = useTranslation();
  const { addCredit } = useCreditStore();
  const { members } = useMemberStore();
  const { tontines } = useTontineStore();
  const { toast } = useToast();

  const creditSchema = z.object({
    tontineId: z.string().min(1, t('credits.validation.tontineRequired')),
    memberId: z.string().min(1, t('credits.validation.memberRequired')),
    amount: z.coerce.number().min(1, t('credits.validation.amountPositive')),
    interestRate: z.coerce.number().min(0, t('credits.validation.interestPositive')),
    dueDate: z.string().min(1, t('credits.validation.dueDateRequired')),
    purpose: z.string().optional(),
  }).refine((data) => {
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate > today;
  }, {
    message: t('credits.validation.dueDateFuture'),
    path: ["dueDate"],
  });

  type CreditFormData = {
    tontineId: string;
    memberId: string;
    amount: number;
    interestRate: number;
    dueDate: string;
    purpose?: string;
  };

  const form = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema) as any,
    defaultValues: {
      tontineId: '',
      memberId: '',
      amount: 0,
      interestRate: 5,
      dueDate: '',
      purpose: '',
    },
  });

  const onSubmit = async (data: CreditFormData) => {
    // Calculate repayment amount with interest
    const interestAmount = (data.amount * data.interestRate) / 100;
    const repaymentAmount = data.amount + interestAmount;

    try {
      await addCredit({
        id_tontine: data.tontineId,
        id_membre: data.memberId,
        montant: data.amount,
        solde: repaymentAmount,
        taux_interet: data.interestRate,
        date_remboursement_prevue: data.dueDate,
        montant_rembourse: 0,
        statut: 'en_attente',
        objet: data.purpose || null,
      });

      toast.success('Crédit créé avec succès', {
        description: `Le crédit de ${data.amount.toLocaleString()} XAF a été créé et est en attente d'approbation.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Afficher une notification d'erreur
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du crédit';
      
      toast.error('Impossible de créer le crédit', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('credits.requestCredit')}</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour demander un crédit
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
                        <SelectValue placeholder={t('sessions.selectTontine')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tontines.map((tontine) => (
                        <SelectItem key={tontine.id} value={tontine.id}>
                          {tontine.nom}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un membre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.prenom} {member.nom}
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('credits.amount')} (XAF)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('credits.interestRate')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('credits.dueDate')}</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      placeholder="Sélectionner la date d'échéance"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('credits.purpose')} (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Achat de matériel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
