import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { X, Wallet, Users, Calendar, DollarSign, Clock, TrendingUp, Loader2, Mail } from 'lucide-react';
import { useTontineStore } from '@/stores/tontineStore';
import { getTontineMembers, type TontineMemberParticipation } from '@/services/tontineService';
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

interface TontineDetailsSheetProps {
  tontineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TontineDetailsSheet({
  tontineId,
  open,
  onOpenChange,
}: TontineDetailsSheetProps) {
  const { t } = useTranslation();
  const { tontines } = useTontineStore();
  const [tontineMembers, setTontineMembers] = useState<TontineMemberParticipation[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const tontine = tontines.find((t) => t.id === tontineId);

  // Fetch tontine members when modal opens
  useEffect(() => {
    if (open && tontineId) {
      setIsLoadingMembers(true);
      getTontineMembers(tontineId)
        .then((data) => {
          setTontineMembers(data);
        })
        .catch((error) => {
          console.error('Error fetching tontine members:', error);
        })
        .finally(() => {
          setIsLoadingMembers(false);
        });
    }
  }, [open, tontineId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateValue: string | Date) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (!tontine) {
    return null;
  }

  const totalExpectedPerSession = tontineMembers.reduce(
    (sum, member) => sum + (tontine.montant_cotisation * member.nb_parts),
    0
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{t('tontines.tontineDetails')}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Informations complètes de la tontine
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{tontine.nom}</h3>
                  {tontine.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {tontine.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge variant={tontine.statut === 'Actif' ? 'default' : 'secondary'}>
                      {t(`common.${tontine.statut}`)}
                    </Badge>
                    <Badge variant="outline">
                      {t(`tontines.types.${tontine.type}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle className="text-lg">Informations Financières</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t('tontines.contributionAmount')}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(tontine.montant_cotisation)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total Attendu par Séance
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(totalExpectedPerSession)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('tontines.frequency')}
                  </p>
                  <p className="font-medium capitalize">
                    {t(`tontines.frequencies.${tontine.periode}`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle className="text-lg">Membres</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : tontineMembers && tontineMembers.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <p className="text-3xl font-bold">{tontineMembers.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tontineMembers.length === 1 ? 'Membre inscrit' : 'Membres inscrits'}
                      </p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                      <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tontineMembers.map((member) => (
                      <div 
                        key={member.id_membre} 
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm">
                            {getInitials(member.prenom, member.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.prenom} {member.nom}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {member.nb_parts} {member.nb_parts > 1 ? 'parts' : 'part'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(tontine.montant_cotisation * member.nb_parts)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun membre inscrit à cette tontine
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle className="text-lg">Période</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('tontines.startDate')}
                  </p>
                  <p className="font-medium">{formatDate(tontine.date_debut)}</p>
                </div>
              </div>
              {tontine.date_fin && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('tontines.endDate')}
                      </p>
                      <p className="font-medium">{formatDate(tontine.date_fin)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {tontine.type === 'presence' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Type de Tontine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Présence:</strong> Cette tontine requiert la présence obligatoire 
                    des membres à chaque séance. Les cotisations doivent être effectuées lors 
                    de la réunion.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
