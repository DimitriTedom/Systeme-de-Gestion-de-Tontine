import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { useState, useEffect } from 'react';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RegisterToTontineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  onSuccess?: () => void;
}

export function RegisterToTontineModal({ 
  open, 
  onOpenChange, 
  memberId,
  memberName,
  onSuccess 
}: RegisterToTontineModalProps) {
  const { t } = useTranslation();
  const { registerToTontine } = useMemberStore();
  const { toast } = useToast();
  const { tontines, fetchTontines } = useTontineStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTontineType, setSelectedTontineType] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchTontines();
    }
  }, [open, fetchTontines]);

  const formSchema = z.object({
    tontineId: z.string().min(1, t('members.validation.tontineRequired')),
    nbParts: z.number().min(1, t('members.validation.nbPartsMinimum')),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tontineId: '',
      nbParts: 1,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await registerToTontine(memberId, data.tontineId, data.nbParts);
      
      toast.success(t('members.registerSuccess'), {
        description: t('members.registrationSuccessful'),
      });
      form.reset();
      onOpenChange(false);
      
      // Call onSuccess callback to refresh tontines list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(t('members.registerError'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTontineChange = (tontineId: string) => {
    const selectedTontine = tontines.find((t) => t.id === tontineId);
    if (selectedTontine) {
      setSelectedTontineType(selectedTontine.type);
      
      // If tontine is 'presence', force nbParts to 1
      if (selectedTontine.type.toLowerCase() === 'presence') {
        form.setValue('nbParts', 1);
      }
    }
  };

  const isPresenceTontine = selectedTontineType.toLowerCase() === 'presence';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('members.registerToTontine')}</DialogTitle>
          <DialogDescription>
            {t('members.registerDescription', { name: memberName })}
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTontineChange(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('members.selectTontine')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tontines.map((tontine) => (
                        <SelectItem key={tontine.id} value={tontine.id}>
                          {tontine.name} ({tontine.type})
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
              name="nbParts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('members.nbParts')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      disabled={isPresenceTontine}
                      placeholder="1"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    {isPresenceTontine 
                      ? t('members.presenceTontineNote')
                      : t('members.optionalTontineNote')
                    }
                  </FormDescription>
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
                {isSubmitting ? t('common.saving') : t('members.register')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
