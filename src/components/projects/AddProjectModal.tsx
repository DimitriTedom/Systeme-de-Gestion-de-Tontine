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

const projectSchema = z.object({
  tontineId: z.string().min(1, 'Tontine required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  budget: z.number().min(1, 'Budget must be positive'),
  startDate: z.string().min(1, 'Start date required'),
  targetDate: z.string().optional(),
  responsibleMemberId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const { t } = useTranslation();
  const { addProject } = useProjectStore();
  const { tontines } = useTontineStore();
  const { members } = useMemberStore();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
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
    const startDate = new Date(data.startDate);
    const targetDate = data.targetDate ? new Date(data.targetDate) : undefined;

    addProject({
      tontineId: data.tontineId,
      name: data.name,
      description: data.description,
      budget: data.budget,
      amountRaised: 0,
      startDate,
      targetDate,
      status: 'planned',
      responsibleMemberId: data.responsibleMemberId || undefined,
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
                          {member.firstName} {member.lastName}
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
