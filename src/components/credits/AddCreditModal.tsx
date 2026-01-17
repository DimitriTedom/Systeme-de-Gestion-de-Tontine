import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useCreditStore } from '@/stores/creditStore';
import { useMemberStore } from '@/stores/memberStore';
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

interface AddCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCreditModal({ open, onOpenChange }: AddCreditModalProps) {
  const { t } = useTranslation();
  const { addCredit } = useCreditStore();
  const { members } = useMemberStore();
  const { tontines } = useTontineStore();

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

  const onSubmit = (data: CreditFormData) => {
    const dueDate = new Date(data.dueDate);
    const disbursementDate = new Date();
    
    // Calculate repayment amount with interest
    const interestAmount = (data.amount * data.interestRate) / 100;
    const repaymentAmount = data.amount + interestAmount;

    addCredit({
      tontineId: data.tontineId,
      memberId: data.memberId,
      amount: data.amount,
      interestRate: data.interestRate,
      disbursementDate,
      dueDate,
      repaymentAmount,
      amountPaid: 0,
      status: 'pending',
      purpose: data.purpose,
    });

    form.reset();
    onOpenChange(false);
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
                    <Input type="date" {...field} />
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
