import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
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

interface AddTontineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTontineModal({ open, onOpenChange }: AddTontineModalProps) {
  const { t } = useTranslation();
  const { addTontine } = useTontineStore();

  const formSchema = z.object({
    name: z
      .string()
      .min(1, t('tontines.validation.nameRequired'))
      .min(3, t('tontines.validation.nameMin')),
    description: z.string().optional(),
    type: z.enum(['presence', 'optional']),
    contributionAmount: z.number().positive(t('tontines.validation.amountPositive')),
    frequency: z.enum(['weekly', 'biweekly', 'monthly']),
    startDate: z.string().min(1, t('tontines.validation.startDateRequired')),
    endDate: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'presence' as const,
      contributionAmount: 0,
      frequency: 'monthly' as const,
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    addTontine({
      ...data,
      contributionAmount: Number(data.contributionAmount),
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: 'active',
      memberIds: [],
      adminId: '1', // TODO: Replace with actual admin ID from auth
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('tontines.addTontine')}</DialogTitle>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tontines.description')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tontine mensuelle pour..."
                      {...field}
                    />
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
