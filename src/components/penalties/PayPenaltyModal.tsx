import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-provider';
import { usePenaltyStore } from '@/stores/penaltyStore';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';
import type { Penalite } from '@/types/database.types';

interface PayPenaltyModalProps {
  penalty: Penalite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayPenaltyModal({ penalty, open, onOpenChange }: PayPenaltyModalProps) {
  const { t } = useTranslation();
  const { payPenalty } = usePenaltyStore();
  const { getMemberById } = useMemberStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const member = penalty ? getMemberById(penalty.id_membre) : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const montantRestant = penalty ? penalty.montant - (penalty.montant_paye || 0) : 0;
  const montantPaye = penalty?.montant_paye || 0;
  const progressPercentage = penalty ? (montantPaye / penalty.montant) * 100 : 0;

  const paymentSchema = z.object({
    montant: z.coerce
      .number()
      .min(1, 'Le montant doit être supérieur à 0')
      .max(montantRestant, `Le montant ne peut pas dépasser ${formatCurrency(montantRestant)}`),
  });

  type PaymentFormData = z.infer<typeof paymentSchema>;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      montant: montantRestant,
    },
  });

  // Reset form when penalty changes
  useEffect(() => {
    if (penalty) {
      const remaining = penalty.montant - (penalty.montant_paye || 0);
      form.reset({ montant: remaining });
    }
  }, [penalty, form]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!penalty) return;

    setIsSubmitting(true);
    try {
      const result = await payPenalty(penalty.id, data.montant);

      if (result.remaining === 0) {
        toast.success('Pénalité entièrement payée', {
          description: `${formatCurrency(data.montant)} payé. La pénalité est maintenant soldée.`,
        });
      } else {
        toast.success('Paiement partiel enregistré', {
          description: `${formatCurrency(data.montant)} payé. Reste à payer: ${formatCurrency(result.remaining)}`,
        });
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Erreur lors du paiement',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFull = () => {
    form.setValue('montant', montantRestant);
  };

  const handlePayHalf = () => {
    form.setValue('montant', Math.round(montantRestant / 2));
  };

  if (!penalty) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payer une pénalité</DialogTitle>
          <DialogDescription>
            Enregistrez un paiement partiel ou total pour cette pénalité
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info membre */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">
                  {member?.prenom} {member?.nom}
                </div>
                <div className="text-sm text-muted-foreground">
                  {penalty.raison}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Progression du paiement */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression du paiement</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payé: {formatCurrency(montantPaye)}</span>
              <span>Restant: {formatCurrency(montantRestant)}</span>
            </div>
          </div>

          {/* Montant total */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Montant total</div>
              <div className="text-lg font-bold">{formatCurrency(penalty.montant)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">À payer</div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(montantRestant)}
              </div>
            </div>
          </div>

          {/* Formulaire de paiement */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="montant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant du paiement</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Entrez le montant"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum: {formatCurrency(montantRestant)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Boutons rapides */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePayHalf}
                  disabled={isSubmitting || montantRestant < 2}
                >
                  Moitié ({formatCurrency(Math.round(montantRestant / 2))})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePayFull}
                  disabled={isSubmitting}
                >
                  Solde complet ({formatCurrency(montantRestant)})
                </Button>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Traitement...' : 'Enregistrer le paiement'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
