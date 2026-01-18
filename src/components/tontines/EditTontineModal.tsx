import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { useTontineStore } from '@/stores/tontineStore';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditTontineModalProps {
  tontineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTontineModal({ tontineId, open, onOpenChange }: EditTontineModalProps) {
  const { t } = useTranslation();
  const { getTontineById, updateTontine } = useTontineStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    name: z
      .string()
      .min(1, t('tontines.validation.nameRequired'))
      .min(3, t('tontines.validation.nameMin')),
    type: z.enum(['presence', 'optionnelle']),
    contributionAmount: z.number().positive(t('tontines.validation.amountPositive')),
    frequency: z.enum(['hebdomadaire', 'bimensuelle', 'mensuelle']),
    startDate: z.string().min(1, t('tontines.validation.startDateRequired')),
    endDate: z.string().optional(),
    status: z.enum(['Actif', 'Terminée', 'Annulée']),
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
      frequency: 'mensuelle' as const,
      startDate: '',
      endDate: '',
      status: 'Actif' as const,
    },
  });

  // Load tontine data when modal opens
  useEffect(() => {
    if (open && tontineId) {
      const tontine = getTontineById(tontineId);
      if (tontine) {
        // Format dates properly
        let startDateStr = '';
        if (tontine.date_debut) {
          startDateStr = typeof tontine.date_debut === 'string' 
            ? tontine.date_debut.split('T')[0]
            : String(tontine.date_debut).split('T')[0];
        }
        
        let endDateStr = '';
        if (tontine.date_fin) {
          endDateStr = typeof tontine.date_fin === 'string' 
            ? tontine.date_fin.split('T')[0]
            : String(tontine.date_fin).split('T')[0];
        }

        // Reset form with all tontine data
        form.reset({
          name: tontine.nom || '',
          type: tontine.type || 'presence',
          contributionAmount: tontine.montant_cotisation || 0,
          frequency: tontine.periode || 'mensuelle',
          startDate: startDateStr,
          endDate: endDateStr,
          status: tontine.statut || 'Actif',
        });
      }
    } else if (!open) {
      // Reset form when modal closes
      form.reset({
        name: '',
        type: 'presence' as const,
        contributionAmount: 0,
        frequency: 'mensuelle' as const,
        startDate: '',
        endDate: '',
        status: 'Actif' as const,
      });
    }
  }, [open, tontineId, getTontineById, form]);

  const onSubmit = async (data: FormValues) => {
    if (!tontineId) return;

    setIsSubmitting(true);
    try {
      await updateTontine(tontineId, {
        nom: data.name,
        type: data.type,
        montant_cotisation: Number(data.contributionAmount),
        periode: data.frequency,
        date_debut: data.startDate,
        date_fin: data.endDate || null,
        statut: data.status,
      });
      toast.success(t('tontines.tontineUpdated'), {
        description: `${data.name} ${t('members.hasBeenUpdated')}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(t('common.error'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={tontineId || 'new'}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('tontines.editTontine')}</DialogTitle>
          <DialogDescription>{t('tontines.tontineDetails')}</DialogDescription>
        </DialogHeader>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tontines.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tontines.type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presence">
                          {t('tontines.types.presence')}
                        </SelectItem>
                        <SelectItem value="optionnelle">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tontines.frequency')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hebdomadaire">
                          {t('tontines.frequencies.weekly')}
                        </SelectItem>
                        <SelectItem value="bimensuelle">
                          {t('tontines.frequencies.biweekly')}
                        </SelectItem>
                        <SelectItem value="mensuelle">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tontines.startDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>{t('tontines.endDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Actif">
                        {t('common.active')}
                      </SelectItem>
                      <SelectItem value="Terminée">
                        {t('common.completed')}
                      </SelectItem>
                      <SelectItem value="Annulée">
                        {t('common.cancelled')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
