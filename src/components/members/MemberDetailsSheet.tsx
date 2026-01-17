import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, Loader2, DollarSign } from 'lucide-react';
import { useMemberStore } from '@/stores/memberStore';
import { reportService, type MemberFinancialReport } from '@/services/reportService';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MemberDetailsSheetProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDetailsSheet({
  memberId,
  open,
  onOpenChange,
}: MemberDetailsSheetProps) {
  const { t } = useTranslation();
  const { members } = useMemberStore();
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);
  const [financialData, setFinancialData] = useState<MemberFinancialReport | null>(null);

  const member = members.find((m) => m.id === memberId);

  // Fetch financial data when modal opens
  useEffect(() => {
    if (open && memberId) {
      setIsLoadingFinancial(true);
      reportService
        .getMemberFinancialReport(memberId)
        .then((data) => {
          setFinancialData(data);
        })
        .catch((error) => {
          console.error('Error fetching financial data:', error);
          // Don't show error toast, just log it
        })
        .finally(() => {
          setIsLoadingFinancial(false);
        });
    }
  }, [open, memberId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (!member) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{t('members.memberDetails')}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Informations complètes du membre
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                    {getInitials(member.firstName, member.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">ID: {member.id}</p>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {t(`common.${member.status}`)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('members.email')}</p>
                  <p className="font-medium">{member.email || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('members.phone')}</p>
                  <p className="font-medium">{member.phone || 'N/A'}</p>
                </div>
              </div>
              {member.address && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('members.address')}</p>
                      <p className="font-medium">{member.address}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.dateOfBirth && (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('members.dateOfBirth')}</p>
                      <p className="font-medium">{formatDate(member.dateOfBirth)}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('members.joinedDate')}</p>
                  <p className="font-medium">{formatDate(member.joinedDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle className="text-lg">Résumé Financier</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFinancial ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : financialData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Cotisé</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(financialData.total_cotise)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Crédits Empruntés</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(financialData.total_emprunte)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pénalités</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(financialData.total_penalites)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Gagné</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(financialData.total_gagne)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Données financières non disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
