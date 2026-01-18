import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditProjectModalProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectModal({ projectId, open, onOpenChange }: EditProjectModalProps) {
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProjectStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = projectId ? getProjectById(projectId) : null;

  // Schéma utilisant les noms de champs Supabase
  const formSchema = z.object({
    montant_alloue: z.number().min(0, 'Le montant alloué doit être positif'),
    statut: z.enum(['planifie', 'collecte_fonds', 'en_cours', 'termine', 'annule']),
    notes: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      montant_alloue: 0,
      statut: 'planifie',
      notes: '',
    },
  });

  // Update form when project changes
  useEffect(() => {
    if (project) {
      form.reset({
        montant_alloue: project.montant_alloue || 0,
        statut: project.statut,
        notes: project.notes || '',
      });
    }
  }, [project, form]);

  const onSubmit = async (data: FormValues) => {
    if (!projectId) return;

    setIsSubmitting(true);
    try {
      // Update completion date if status is completed
      const updates: {
        montant_alloue: number;
        statut: typeof data.statut;
        notes?: string;
        date_fin_reelle?: string;
      } = {
        montant_alloue: data.montant_alloue,
        statut: data.statut,
        notes: data.notes,
      };

      if (data.statut === 'termine' && !project?.date_fin_reelle) {
        updates.date_fin_reelle = new Date().toISOString().split('T')[0];
      }

      await updateProject(projectId, updates);

      toast.success('Projet mis à jour', {
        description: 'Les modifications ont été enregistrées avec succès',
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project) return null;

  const remainingBudget = project.budget - (form.watch('montant_alloue') || 0);
  const progressPercentage = ((form.watch('montant_alloue') || 0) / project.budget) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Mettre à jour le projet</DialogTitle>
          <DialogDescription>
            {project.nom}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Budget Info */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget total:</span>
                <span className="font-bold">{project.budget.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant alloué actuel:</span>
                <span className="font-semibold text-green-600">
                  {(form.watch('montant_alloue') || 0).toLocaleString()} XAF
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reste à allouer:</span>
                <span className={remainingBudget >= 0 ? 'font-semibold' : 'font-semibold text-red-600'}>
                  {remainingBudget.toLocaleString()} XAF
                </span>
              </div>
              <div className="pt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${progressPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {progressPercentage.toFixed(1)}% du budget
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="montant_alloue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant alloué (XAF)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Montant des fonds actuellement alloués à ce projet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut du projet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planifie">{t('projects.statuses.planned')}</SelectItem>
                      <SelectItem value="collecte_fonds">{t('projects.statuses.fundraising')}</SelectItem>
                      <SelectItem value="en_cours">{t('projects.statuses.in_progress')}</SelectItem>
                      <SelectItem value="termine">{t('projects.statuses.completed')}</SelectItem>
                      <SelectItem value="annule">{t('projects.statuses.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Mettre à jour l'état d'avancement du projet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajouter des notes sur l'avancement du projet..."
                      className="resize-none"
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
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : 'Mettre à jour'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
