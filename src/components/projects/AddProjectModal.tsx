import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/stores/projectStore';
import { useTontineStore } from '@/stores/tontineStore';
import { useMemberStore } from '@/stores/memberStore';
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

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const { t } = useTranslation();
  const { addProject } = useProjectStore();
  const { tontines } = useTontineStore();
  const { members } = useMemberStore();

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

  const onSubmit = (data: ProjectFormData) => {
    const dateDebut = new Date(data.startDate).toISOString().split('T')[0];
    const dateCible = data.targetDate ? new Date(data.targetDate).toISOString().split('T')[0] : null;

    addProject({
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

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.addProject')}</DialogTitle>
          <DialogDescription>
            Créez un nouveau projet communautaire (FIAC)
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projects.startDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
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
