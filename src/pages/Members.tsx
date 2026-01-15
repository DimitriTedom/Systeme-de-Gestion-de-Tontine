import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Eye, Users as UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemberStore } from '@/stores/memberStore';
import { Button } from '@/components/ui/button';
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
import { MemberFinancialSummary } from '@/components/members/MemberFinancialSummary';
import { EmptyState } from '@/components/EmptyState';

export default function Members() {
  const { t } = useTranslation();
  const { members, deleteMember } = useMemberStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirm(t('members.confirmDelete'))) {
      deleteMember(id);
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
            {members.length} {members.length === 1 ? 'member' : 'members'}
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

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle>{t('members.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={t('members.noMembers')}
              description="Commencez par ajouter votre premier membre pour créer votre communauté de tontine."
              actionLabel={t('members.addMember')}
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('members.firstName')}</TableHead>
                  <TableHead>{t('members.lastName')}</TableHead>
                  <TableHead>{t('members.email')}</TableHead>
                  <TableHead>{t('members.phone')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="font-medium">{member.firstName}</TableCell>
                    <TableCell>{member.lastName}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                      >
                        {t(`common.${member.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedMemberId(member.id)}
                          title={t('members.viewFinancialSummary')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title={t('members.editMember')}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
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
          )}
        </CardContent>
      </Card>

      <AddMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {selectedMemberId && (
        <MemberFinancialSummary
          memberId={selectedMemberId}
          open={!!selectedMemberId}
          onOpenChange={(open) => !open && setSelectedMemberId(null)}
        />
      )}
    </motion.div>
  );
}
