import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useCreditStore } from '@/stores/creditStore';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Credit } from '@/types/database.types';

interface RepayCreditModalProps {
  credit: Credit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepayCreditModal({ credit, open, onOpenChange }: RepayCreditModalProps) {
  const { t } = useTranslation();
  const { repayCredit } = useCreditStore();
  const { toast } = useToast();

  const repaySchema = z.object({
    amount: z.coerce
      .number()
      .min(1, 'Le montant doit être supérieur à 0')
      .max(credit?.solde || 0, `Le montant ne peut pas dépasser ${credit?.solde || 0} XAF`),
  });

  type RepayFormData = z.infer<typeof repaySchema>;

  const form = useForm<RepayFormData>({
    resolver: zodResolver(repaySchema),
    defaultValues: {
      amount: credit?.solde || 0,
    },
  });

  const onSubmit = async (data: RepayFormData) => {
    if (!credit) return;

    try {
      await repayCredit(credit.id, data.amount);
      
      const isFullyPaid = data.amount >= credit.solde;
      
      toast.success(
        isFullyPaid ? 'Crédit remboursé totalement' : 'Remboursement enregistré', 
        {
          description: isFullyPaid 
            ? `Le crédit a été entièrement remboursé (${formatCurrency(data.amount)}).`
            : `Paiement de ${formatCurrency(data.amount)} enregistré. Solde restant: ${formatCurrency(credit.solde - data.amount)}.`,
        }
      );
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur de remboursement', {
        description: error instanceof Error ? error.message : 'Impossible d\'enregistrer le remboursement.',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!credit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rembourser un crédit</DialogTitle>
          <DialogDescription>
            Enregistrez un paiement pour ce crédit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant initial:</span>
            <span className="font-medium">{formatCurrency(credit.montant)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Intérêts ({credit.taux_interet}%):</span>
            <span className="font-medium">
              {formatCurrency(credit.montant * (credit.taux_interet / 100))}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">Total à rembourser:</span>
            <span className="font-medium">{formatCurrency(credit.montant + credit.montant * (credit.taux_interet / 100))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Déjà payé:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(credit.montant_rembourse)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t pt-2">
            <span>Solde restant:</span>
            <span className="text-orange-600">{formatCurrency(credit.solde)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant du remboursement (XAF)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={credit.solde} step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue('amount', credit.solde / 2)}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue('amount', credit.solde)}
              >
                Solde total
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">Rembourser</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
