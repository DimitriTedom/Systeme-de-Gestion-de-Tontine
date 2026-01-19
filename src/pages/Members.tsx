import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, Users as UsersIcon, Search, FileSpreadsheet, UserPlus, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemberStore } from '@/stores/memberStore';
import { useToast } from '@/components/ui/toast-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { EditMemberModal } from '@/components/members/EditMemberModal';
import { MemberDetailsSheet } from '@/components/members/MemberDetailsSheet';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { MemberFinancialExport } from '@/components/reports/MemberFinancialExport';

export default function Members() {
  const { t } = useTranslation();
  const { members, isLoading, error, fetchMembers, deleteMember } = useMemberStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [exportMemberId, setExportMemberId] = useState<number | null>(null);
  const [exportMemberName, setExportMemberName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch members when component mounts
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      return (
        member.prenom.toLowerCase().includes(query) ||
        member.nom.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.telephone?.toLowerCase().includes(query) ||
        member.adresse?.toLowerCase().includes(query)
      );
    });
  }, [members, searchQuery]);

  // Paginate filtered members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t('members.confirmDelete'))) {
      try {
        await deleteMember(id);
        toast.success(t('members.deleteSuccess'), {
          description: `${name} ${t('members.hasBeenDeleted')}`,
        });
      } catch (error) {
        toast.error(t('members.deleteError'), {
          description: error instanceof Error ? error.message : t('common.unknownError'),
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            {searchQuery && ` (${members.length} total)`}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800">
            <Plus className="mr-2 h-4 w-4" />
            {t('members.addMember')}
          </Button>
        </motion.div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('common.search') + ' members...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle>{t('members.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{t('common.error')}: {error}</p>
              <Button onClick={fetchMembers} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <InteractiveEmptyState
              title={searchQuery ? 'No members found' : t('members.noMembers')}
              description={searchQuery ? 'Try adjusting your search query' : 'Commencez par ajouter votre premier membre pour créer votre communauté de tontine.'}
              icons={[
                <UsersIcon key="1" className="h-6 w-6" />,
                <UserPlus key="2" className="h-6 w-6" />,
                <UsersRound key="3" className="h-6 w-6" />
              ]}
              action={searchQuery ? undefined : {
                label: t('members.addMember'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">{t('members.firstName')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('members.lastName')}</TableHead>
                        <TableHead className="whitespace-nowrap hidden sm:table-cell">{t('members.email')}</TableHead>
                        <TableHead className="whitespace-nowrap hidden md:table-cell">{t('members.phone')}</TableHead>
                        <TableHead className="whitespace-nowrap">{t('common.status')}</TableHead>
                        <TableHead className="text-right whitespace-nowrap">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {paginatedMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="font-medium whitespace-nowrap">{member.prenom}</TableCell>
                    <TableCell className="whitespace-nowrap">{member.nom}</TableCell>
                    <TableCell className="hidden sm:table-cell">{member.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.telephone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.statut === 'Actif' ? 'default' : 'secondary'}
                      >
                        {t(`common.${member.statut}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => {
                            setExportMemberId(parseInt(member.id));
                            setExportMemberName(`${member.prenom} ${member.nom}`);
                          }}
                          title="Export Excel"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => setSelectedMemberId(member.id)}
                          title={t('members.memberDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => setEditMemberId(member.id)}
                          title={t('members.editMember')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9"
                          onClick={() => handleDelete(member.id, `${member.prenom} ${member.nom}`)}
                          title={t('members.confirmDelete')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <EditMemberModal
        memberId={editMemberId}
        open={!!editMemberId}
        onOpenChange={(open) => !open && setEditMemberId(null)}
      />

      <MemberDetailsSheet
        memberId={selectedMemberId}
        open={!!selectedMemberId}
        onOpenChange={(open) => !open && setSelectedMemberId(null)}
      />

      <MemberFinancialExport
        open={!!exportMemberId}
        onClose={() => {
          setExportMemberId(null);
          setExportMemberName('');
        }}
        memberId={exportMemberId || 0}
        memberName={exportMemberName}
      />
    </motion.div>
  );
}
