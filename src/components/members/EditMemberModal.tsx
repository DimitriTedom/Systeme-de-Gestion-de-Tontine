import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useMemberStore } from '@/stores/memberStore';
import { useToast } from '@/components/ui/toast-provider';
import { useState } from 'react';
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

interface EditMemberModalProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberModal({ memberId, open, onOpenChange }: EditMemberModalProps) {
  const { t } = useTranslation();
  const { updateMember, getMemberById, error: storeError } = useMemberStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    firstName: z.string().min(1, t('members.validation.firstNameRequired')),
    lastName: z.string().min(1, t('members.validation.lastNameRequired')),
    email: z
      .string()
      .min(1, t('members.validation.emailRequired'))
      .email(t('members.validation.emailInvalid')),
    phone: z.string().min(1, t('members.validation.phoneRequired')),
    address: z.string().optional(),
    status: z.enum(['Actif', 'Inactif', 'Suspendu']),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      status: 'Actif' as const,
    },
  });

  // Load member data when modal opens
  useEffect(() => {
    if (open && memberId) {
      const member = getMemberById(memberId);
      if (member) {
        form.reset({
          firstName: member.prenom,
          lastName: member.nom,
          email: member.email,
          phone: member.telephone,
          address: member.adresse || '',
          status: member.statut,
        });
      }
    }
  }, [open, memberId, getMemberById, form]);

  const onSubmit = async (data: FormValues) => {
    if (!memberId) return;

    setIsSubmitting(true);
    try {
      await updateMember(memberId, data);
      
      if (storeError) {
        toast.error(t('members.updateError'), {
          description: storeError,
        });
      } else {
        toast.success(t('members.updateSuccess'), {
          description: `${data.firstName} ${data.lastName} ${t('members.hasBeenUpdated')}`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(t('members.updateError'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('members.editMember')}</DialogTitle>
          <DialogDescription>{t('members.memberDetails')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
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
                name="lastName"
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
                      placeholder="jean.dupont@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+237 6 77 88 99 00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Yaoundé, Cameroun" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <SelectItem value="Actif">{t('common.active')}</SelectItem>
                      <SelectItem value="Inactif">{t('common.inactive')}</SelectItem>
                      <SelectItem value="Suspendu">{t('common.suspended')}</SelectItem>
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
