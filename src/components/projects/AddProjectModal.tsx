import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
import { useToast } from '@/components/ui/toast-provider';
import { formatErrorForToast } from '@/lib/errorHandler';
import { formatDateToLocal } from '@/lib/utils';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const { t } = useTranslation();
  const { addProject } = useProjectStore();
  const { tontines } = useTontineStore();
  const { members } = useMemberStore();
  const { toast } = useToast();

  // Schema defined inside component to access t() function for i18n
  const projectSchema = z.object({
    tontineId: z.string().min(1, t('projects.validation.tontineRequired')),
    name: z.string().min(3, t('projects.validation.nameRequired')),
    description: z.string().min(10, t('projects.validation.descriptionRequired')),
    budget: z.coerce.number().min(1, t('projects.validation.budgetPositive')),
    startDate: z.string().min(1, t('projects.validation.startDateRequired')),
    targetDate: z.string().optional(),
    responsibleMemberId: z.string().optional(),
  }).refine((data) => {
    if (!data.tontineId || !data.startDate) return true;
    const tontine = tontines.find(t => t.id === data.tontineId);
    if (!tontine) return true;
    const projectStartDate = new Date(data.startDate);
    const tontineStartDate = new Date(tontine.date_debut);
    projectStartDate.setHours(0, 0, 0, 0);
    tontineStartDate.setHours(0, 0, 0, 0);
    return projectStartDate >= tontineStartDate;
  }, {
    message: t('projects.validation.startDateAfterTontine'),
    path: ["startDate"],
  }).refine((data) => {
    if (data.targetDate) {
      const targetDate = new Date(data.targetDate);
      const startDate = new Date(data.startDate);
      targetDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      return targetDate > startDate;
    }
    return true;
  }, {
    message: t('projects.validation.targetDateAfterStart'),
    path: ["targetDate"],
  });

  type ProjectFormData = {
    tontineId: string;
    name: string;
    description: string;
    budget: number;
    startDate: string;
    targetDate?: string;
    responsibleMemberId?: string;
  };

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      tontineId: '',
      name: '',
      description: '',
      budget: 0,
      startDate: '',
      targetDate: '',
      responsibleMemberId: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    // Dates are already in YYYY-MM-DD format from formatDateToLocal
    const dateDebut = data.startDate;
    const dateCible = data.targetDate || null;

    try {
      await addProject({
        id_tontine: data.tontineId,
        id_responsable: data.responsibleMemberId || null,
        nom: data.name,
        description: data.description,
        budget: data.budget,
        montant_alloue: 0,
        date_debut: dateDebut,
        date_cible: dateCible,
        date_fin_reelle: null,
        statut: 'planifie',
      });

      toast.success('Projet créé avec succès', {
        description: `Le projet "${data.name}" a été créé avec un budget de ${data.budget.toLocaleString()} XAF.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = formatErrorForToast(error);
      toast.error(errorMessage.title, {
        description: errorMessage.description,
      });
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('projects.addProject')}
      description="Créez un nouveau projet communautaire (FIAC)"
      className="sm:max-w-[600px]"
    >
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
                      <SelectValue placeholder="Sélectionner une tontine" />
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('projects.name')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Construction École Primaire" />
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
                <FormLabel>{t('projects.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Décrivez le projet en détail..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('projects.budget')} (XAF)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
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
                  <FormLabel>{t('projects.startDate')}</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(formatDateToLocal(date))}
                      placeholder="Sélectionner la date de début"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.targetDate')} (optionnel)</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(formatDateToLocal(date))}
                      placeholder="Sélectionner la date cible"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="responsibleMemberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('projects.responsibleMember')} (optionnel)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre responsable" />
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
