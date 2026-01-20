import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useMemberStore } from '@/stores/memberStore';
import { useToast } from '@/components/ui/toast-provider';
import { formatErrorForToast } from '@/lib/errorHandler';
import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberModal({ open, onOpenChange }: AddMemberModalProps) {
  const { t } = useTranslation();
  const { addMember } = useMemberStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    prenom: z.string().min(1, t('members.validation.firstNameRequired')),
    nom: z.string().min(1, t('members.validation.lastNameRequired')),
    email: z
      .string()
      .min(1, t('members.validation.emailRequired'))
      .email(t('members.validation.emailInvalid')),
    telephone: z.string().min(1, t('members.validation.phoneRequired')),
    adresse: z.string().optional(),
    commune: z.string().optional(),
    statut: z.enum(['Actif', 'Inactif', 'Suspendu']),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      commune: '',
      statut: 'Actif' as const,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await addMember({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse || null,
        commune: data.commune || null,
        statut: data.statut,
      });
      
      toast.success(t('members.addSuccess'), {
        description: `${data.prenom} ${data.nom} ${t('members.hasBeenAdded')}`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const { title, description } = formatErrorForToast(error);
      toast.error(title, {
        description: description || t('common.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('members.addMember')}
      description={t('members.addMemberDescription')}
      className="sm:max-w-[525px]"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.firstName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.lastName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('members.email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="jean.dupont@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('members.phone')}</FormLabel>
                <FormControl>
                  <Input placeholder="+237 6XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Rue Principale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commune"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.commune')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Yaoundé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="statut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('members.status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('members.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Actif">{t('common.Actif')}</SelectItem>
                    <SelectItem value="Inactif">{t('common.Inactif')}</SelectItem>
                    <SelectItem value="Suspendu">{t('common.Suspendu')}</SelectItem>
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
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('common.loading') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveModal>
  );
}
