import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { useState, useEffect } from 'react';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
import { ResponsiveModal } from '@/components/ui/responsive-modal';

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
      // Rule 1: Vérifier que le prochain tour est celui du premier membre
      // (On ne peut rejoindre qu'au début d'un cycle)
      const { data: toursData, error: toursError } = await supabase
        .from('tour')
        .select('id, numero, id_beneficiaire')
        .eq('id_tontine', data.tontineId)
        .order('numero', { ascending: true });

      if (toursError) throw toursError;

      // Récupérer les membres de la tontine par ordre d'inscription
      const { data: participantsData, error: participantsError } = await supabase
        .from('participe')
        .select('id_membre, created_at')
        .eq('id_tontine', data.tontineId)
        .order('created_at', { ascending: true });

      if (participantsError) throw participantsError;

      // Si des tours ont déjà été distribués, vérifier qu'on est au début du cycle
      if (toursData && toursData.length > 0 && participantsData && participantsData.length > 0) {
        const firstMemberId = participantsData[0].id_membre;
        const toursCount = toursData.length;
        const membersCount = participantsData.length;
        
        // Le prochain tour devrait être: (toursCount % membersCount) + 1
        const nextTourIndex = toursCount % membersCount;
        
        // Si nextTourIndex !== 0, on n'est pas au début du cycle
        if (nextTourIndex !== 0) {
          throw new Error('Vous ne pouvez rejoindre cette tontine qu\'au début d\'un nouveau cycle. Le prochain tour n\'est pas celui du premier membre.');
        }
      }

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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('members.registerToTontine')}
      description={t('members.registerDescription', { name: memberName })}
      className="sm:max-w-[500px]"
    >
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
                        {tontine.nom} ({tontine.type})
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

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('common.saving') : t('members.register')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveModal>
  );
}
