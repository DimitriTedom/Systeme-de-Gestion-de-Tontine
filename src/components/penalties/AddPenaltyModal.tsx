import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { usePenaltyStore } from '@/stores/penaltyStore';
import { useMemberStore } from '@/stores/memberStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTontineStore } from '@/stores/tontineStore';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface AddPenaltyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPenaltyModal({ open, onOpenChange }: AddPenaltyModalProps) {
  const { t } = useTranslation();
  const { addPenalty } = usePenaltyStore();
  const { toast } = useToast();
  const { members } = useMemberStore();
  const { sessions } = useSessionStore();
  const { tontines } = useTontineStore();

  const penaltySchema = z.object({
    id_tontine: z.string().min(1, t('penalties.validation.tontineRequired')),
    id_seance: z.string().min(1, t('penalties.validation.sessionRequired')),
    id_membre: z.string().min(1, t('penalties.validation.memberRequired')),
    montant: z.coerce.number().min(1, t('penalties.validation.amountPositive')),
    type_penalite: z.string().min(1, t('penalties.validation.typeRequired')),
    raison: z.string().min(1, t('penalties.validation.reasonRequired')),
  });

  type PenaltyFormData = {
    id_tontine: string;
    id_seance: string;
    id_membre: string;
    montant: number;
    type_penalite: string;
    raison: string;
  };

  const form = useForm<PenaltyFormData>({
    resolver: zodResolver(penaltySchema) as any,
    defaultValues: {
      id_tontine: '',
      id_seance: '',
      id_membre: '',
      montant: 0,
      type_penalite: '',
      raison: '',
    },
  });

  const selectedTontineId = form.watch('id_tontine');
  
  // Filter sessions by selected tontine
  const filteredSessions = sessions.filter(
    (session) => session.id_tontine === selectedTontineId
  );

  // Get members of the selected tontine
  const selectedTontine = tontines.find((t) => t.id === selectedTontineId);
  const tontineMembers = members.filter(
    (member) => selectedTontine?.participations?.some((p: { id_membre: string }) => p.id_membre === member.id)
  );

  const onSubmit = async (data: PenaltyFormData) => {
    try {
      await addPenalty({
        id_tontine: data.id_tontine,
        id_seance: data.id_seance,
        id_membre: data.id_membre,
        montant: data.montant,
        type_penalite: data.type_penalite as 'absence' | 'retard_cotisation' | 'mauvaise_conduite' | 'autre',
        raison: data.raison,
        statut: 'non_paye',
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('penalties.addPenalty')}
      description={t('penalties.addPenaltyDescription')}
      className="sm:max-w-[500px]"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="id_tontine"
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
            name="id_seance"
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
                        Séance #{session.numero_seance} - {new Date(session.date).toLocaleDateString('fr-FR')}
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
            name="id_membre"
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
            name="type_penalite"
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
                    <SelectItem value="retard_cotisation">{t('penalties.types.lateContribution')}</SelectItem>
                    <SelectItem value="mauvaise_conduite">{t('penalties.types.misconduct')}</SelectItem>
                    <SelectItem value="autre">{t('penalties.types.other')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="montant"
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
            name="raison"
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

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="w-full sm:w-auto">{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveModal>
  );
}
