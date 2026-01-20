import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Loader2, DollarSign, Plus, Users } from 'lucide-react';
import { useMemberStore } from '@/stores/memberStore';
import { useTontineStore } from '@/stores/tontineStore';
import { supabase } from '@/lib/supabase';
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
import { RegisterToTontineModal } from './RegisterToTontineModal';

interface MemberDetailsSheetProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberTontine {
  id_tontine: string;
  nom: string;
  type: string;
  montant_cotisation: number;
  periode: string;
  nb_parts: number;
  statut_participation: string;
  statut_tontine: string;
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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [memberTontines, setMemberTontines] = useState<MemberTontine[]>([]);
  const [isLoadingTontines, setIsLoadingTontines] = useState(false);

  const member = members.find((m) => m.id === memberId);

  // Function to fetch member tontines from participe table
  const fetchMemberTontines = async () => {
    if (!memberId) return;
    
    setIsLoadingTontines(true);
    try {
      const { data, error } = await supabase
        .from('participe')
        .select(`
          id_tontine,
          nb_parts,
          statut,
          tontine:id_tontine (
            id,
            nom,
            type,
            montant_cotisation,
            periode,
            statut
          )
        `)
        .eq('id_membre', memberId)
        .eq('statut', 'actif');

      if (error) throw error;

      // Transformer les données pour l'affichage
      const tontines = (data || []).map((p: any) => ({
        id_tontine: p.id_tontine,
        nom: p.tontine?.nom || '',
        type: p.tontine?.type || '',
        montant_cotisation: p.tontine?.montant_cotisation || 0,
        periode: p.tontine?.periode || '',
        nb_parts: p.nb_parts,
        statut_participation: p.statut,
        statut_tontine: p.tontine?.statut || '',
      }));

      setMemberTontines(tontines);
    } catch (error) {
      console.error('Error fetching member tontines:', error);
      setMemberTontines([]);
    } finally {
      setIsLoadingTontines(false);
    }
  };

  // Fetch member's tontines when modal opens
  useEffect(() => {
    if (open && memberId) {
      fetchMemberTontines();
    }
  }, [open, memberId]);

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

  const getInitials = (prenom: string, nom: string) => {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle>{t('members.memberDetails')}</SheetTitle>
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
                    {getInitials(member.prenom, member.nom)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {member.prenom} {member.nom}
                  </h3>
                  <p className="text-sm text-muted-foreground">ID: {member.id}</p>
                  <Badge
                    variant={member.statut === 'Actif' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {t(`common.${member.statut}`)}
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
                  <p className="font-medium">{member.telephone || 'N/A'}</p>
                </div>
              </div>
              {member.adresse && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('members.address')}</p>
                      <p className="font-medium">{member.adresse}</p>
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
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('members.joinedDate')}</p>
                  <p className="font-medium">{formatDate(member.date_inscription)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Tontines Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle className="text-lg">{t('members.myTontines')}</CardTitle>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('members.registerToTontine')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTontines ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : memberTontines && memberTontines.length > 0 ? (
                <div className="space-y-2">
                  {memberTontines.map((tontine) => {
                    return (
                      <div 
                        key={tontine.id_tontine} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{tontine.nom}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {tontine.type === 'presence' ? 'Présence' : 'Optionnelle'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(tontine.montant_cotisation)} / {tontine.periode}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tontine.nb_parts} {tontine.nb_parts > 1 ? 'parts' : 'part'}
                            </Badge>
                            <Badge 
                              variant={tontine.statut_tontine === 'Actif' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {tontine.statut_tontine}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('members.noTontines')}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('members.joinFirstTontine')}
                  </Button>
                </div>
              )}
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

      {/* Register to Tontine Modal */}
      {member && (
        <RegisterToTontineModal
          open={isRegisterModalOpen}
          onOpenChange={setIsRegisterModalOpen}
          memberId={member.id}
          memberName={`${member.prenom} ${member.nom}`}
          onSuccess={fetchMemberTontines}
        />
      )}
    </Sheet>
  );
}
