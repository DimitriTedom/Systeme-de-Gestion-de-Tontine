import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/stores/sessionStore';
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

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSessionModal({ open, onOpenChange }: AddSessionModalProps) {
  const { t } = useTranslation();
  const { addSession, getSessionsByTontineId } = useSessionStore();
  const { tontines } = useTontineStore();

  const formSchema = z.object({
    tontineId: z.string().min(1, t('sessions.validation.tontineRequired')),
    date: z.string().min(1, t('sessions.validation.dateRequired')),
    location: z.string().optional(),
    agenda: z.string().optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    if (!data.tontineId || !data.date) return true;
    const tontine = tontines.find(t => t.id === data.tontineId);
    if (!tontine) return true;
    const sessionDate = new Date(data.date);
    const tontineStartDate = new Date(tontine.date_debut);
    sessionDate.setHours(0, 0, 0, 0);
    tontineStartDate.setHours(0, 0, 0, 0);
    return sessionDate >= tontineStartDate;
  }, {
    message: t('sessions.validation.dateAfterTontineStart'),
    path: ['date'],
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tontineId: '',
      date: '',
      location: '',
      agenda: '',
      notes: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    // Calculate session number based on existing sessions for this tontine
    const existingSessions = getSessionsByTontineId(data.tontineId);
    const sessionNumber = existingSessions.length + 1;

    addSession({
      id_tontine: data.tontineId,
      numero_seance: sessionNumber,
      date: data.date,
      lieu: data.location,
      ordre_du_jour: data.agenda,
      notes: data.notes,
      statut: 'programmee',
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.addSession')}</DialogTitle>
          <DialogDescription>{t('sessions.sessionDetails')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tontineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.selectTontine')}</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.location')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Salle de réunion, Yaoundé"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.agenda')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ordre du jour de la session"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.notes')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Notes additionnelles"
                      {...field}
                    />
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
