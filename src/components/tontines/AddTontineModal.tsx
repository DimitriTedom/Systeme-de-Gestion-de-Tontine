import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { formatErrorForToast } from '@/lib/errorHandler';
import { useTontineStore } from '@/stores/tontineStore';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface AddTontineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTontineModal({ open, onOpenChange }: AddTontineModalProps) {
  const { t } = useTranslation();
  const { addTontine } = useTontineStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    name: z
      .string()
      .min(1, t('tontines.validation.nameRequired'))
      .min(3, t('tontines.validation.nameMin')),
    type: z.enum(['presence', 'optional']),
    contributionAmount: z.number().positive(t('tontines.validation.amountPositive')),
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    startDate: z.string().min(1, t('tontines.validation.startDateRequired')),
    endDate: z.string().optional(),
  }).refine((data) => {
    if (data.endDate && data.startDate) {
      const endDate = new Date(data.endDate);
      const startDate = new Date(data.startDate);
      endDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      return endDate > startDate;
    }
    return true;
  }, {
    message: t('tontines.validation.endDateAfterStart'),
    path: ['endDate'],
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'presence' as const,
      contributionAmount: 0,
      frequency: 'monthly' as const,
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const frequencyMap: Record<'weekly' | 'biweekly' | 'monthly', 'hebdomadaire' | 'bimensuelle' | 'mensuelle'> = {
        weekly: 'hebdomadaire',
        biweekly: 'bimensuelle',
        monthly: 'mensuelle',
      };

      const typeMap: Record<'presence' | 'optional', 'presence' | 'optionnelle'> = {
        presence: 'presence',
        optional: 'optionnelle',
      };

      await addTontine({
        nom: data.name,
        type: typeMap[data.type],
        montant_cotisation: Number(data.contributionAmount),
        date_debut: data.startDate,
        date_fin: data.endDate || undefined,
        periode: frequencyMap[data.frequency],
        statut: 'Actif',
      });
      toast.success(t('tontines.tontineAdded'), {
        description: `${data.name} ${t('members.hasBeenAdded')}`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = formatErrorForToast(error);
      toast.error(errorMessage.title, {
        description: errorMessage.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('tontines.addTontine')}
      description={t('tontines.tontineDetails')}
      className="sm:max-w-[525px]"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tontines.name')}</FormLabel>
                <FormControl>
                  <Input placeholder="Tontine des Enseignants" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tontines.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('tontines.type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="presence">
                        {t('tontines.types.presence')}
                      </SelectItem>
                      <SelectItem value="optional">
                        {t('tontines.types.optional')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tontines.frequency')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('tontines.frequency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">
                        {t('tontines.frequencies.weekly')}
                      </SelectItem>
                      <SelectItem value="biweekly">
                        {t('tontines.frequencies.biweekly')}
                      </SelectItem>
                      <SelectItem value="monthly">
                        {t('tontines.frequencies.monthly')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contributionAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('tontines.contributionAmount')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tontines.startDate')}</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      placeholder="Sélectionner la date de début"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('tontines.endDate')} 
                    <span className="text-muted-foreground text-xs ml-1">({t('common.optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      placeholder="Sélectionner la date de fin"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveModal>
  );
}
