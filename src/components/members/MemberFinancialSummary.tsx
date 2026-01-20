import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { reportService, type MemberFinancialReport } from '@/services/reportService';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MemberFinancialSummaryProps {
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberFinancialSummary({
  memberId,
  open,
  onOpenChange,
}: MemberFinancialSummaryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<MemberFinancialReport | null>(null);

  // Fetch financial data when modal opens
  useEffect(() => {
    if (open && memberId) {
      setIsLoading(true);
      reportService
        .getMemberFinancialReport(memberId)
        .then((data) => {
          setFinancialData(data);
        })
        .catch((error) => {
          toast.error(t('common.error'), {
            description: error instanceof Error ? error.message : t('common.unknownError'),
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, memberId, t]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle>{t('members.financialSummary')}</SheetTitle>
          <SheetDescription>
            Vue complète de la situation financière du membre
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : financialData ? (
          <div className="mt-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Cotisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(financialData.total_cotise)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Crédits Empruntés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(financialData.total_emprunte)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Pénalités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(financialData.total_penalites)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Gagné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(financialData.total_gagne)}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            {t('common.error')}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
