import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Wallet, Search, ChevronLeft, ChevronRight, Eye, Coins, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast-provider';
import { useTontineStore } from '@/stores/tontineStore';
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
import { AddTontineModal } from '@/components/tontines/AddTontineModal';
import { EditTontineModal } from '@/components/tontines/EditTontineModal';
import { TontineDetailsSheet } from '@/components/tontines/TontineDetailsSheet';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';

export default function Tontines() {
  const { t } = useTranslation();
  const { tontines, isLoading, error, fetchTontines, deleteTontine } = useTontineStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTontineId, setEditTontineId] = useState<string | null>(null);
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch tontines when component mounts
  useEffect(() => {
    fetchTontines();
  }, [fetchTontines]);

  // Filter tontines based on search query
  const filteredTontines = useMemo(() => {
    if (!searchQuery.trim()) return tontines;
    
    const query = searchQuery.toLowerCase();
    return tontines.filter((tontine) => {
      return (
        tontine.nom.toLowerCase().includes(query) ||
        tontine.description?.toLowerCase().includes(query) ||
        tontine.type.toLowerCase().includes(query) ||
        tontine.periode.toLowerCase().includes(query)
      );
    });
  }, [tontines, searchQuery]);

  // Paginate filtered tontines
  const paginatedTontines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTontines.slice(startIndex, endIndex);
  }, [filteredTontines, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTontines.length / itemsPerPage);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t('members.confirmDelete'))) {
      try {
        await deleteTontine(id);
        toast.success(t('tontines.tontineDeleted'), {
          description: `${name} ${t('members.hasBeenDeleted')}`,
        });
      } catch (error) {
        toast.error(t('common.error'), {
          description: error instanceof Error ? error.message : t('common.unknownError'),
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <h1 className="text-2xl sm:text-3xl font-bold">{t('tontines.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {filteredTontines.length} {filteredTontines.length === 1 ? 'tontine' : 'tontines'}
            {searchQuery && ` (${tontines.length} total)`}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30">
            <Plus className="mr-2 h-4 w-4" />
            {t('tontines.addTontine')}
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
              placeholder={t('common.search') + ' tontines...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle>{t('tontines.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{t('common.error')}: {error}</p>
              <Button onClick={fetchTontines} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </div>
          ) : filteredTontines.length === 0 ? (
            <InteractiveEmptyState
              title={searchQuery ? 'No tontines found' : t('tontines.noTontines')}
              description={searchQuery ? 'Try adjusting your search query' : 'Commencez par créer votre première tontine pour démarrer la gestion collective.'}
              icons={[
                <Wallet key="1" className="h-6 w-6" />,
                <Coins key="2" className="h-6 w-6" />,
                <PiggyBank key="3" className="h-6 w-6" />
              ]}
              action={searchQuery ? undefined : {
                label: t('tontines.addTontine'),
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setIsAddModalOpen(true)
              }}
            />
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tontines.name')}</TableHead>
                  <TableHead>{t('tontines.type')}</TableHead>
                  <TableHead>{t('tontines.contributionAmount')}</TableHead>
                  <TableHead>{t('tontines.frequency')}</TableHead>
                  <TableHead>{t('tontines.members')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTontines.map((tontine, index) => (
                  <motion.tr
                    key={tontine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div>{tontine.nom}</div>
                        {tontine.description && (
                          <div className="text-xs text-muted-foreground">
                            {tontine.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`tontines.types.${tontine.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(tontine.montant_cotisation)}
                    </TableCell>
                    <TableCell>
                      {t(`tontines.frequencies.${tontine.periode}`)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tontine.membres_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tontine.statut === 'Actif' ? 'default' : 'secondary'}
                      >
                        {t(`common.${tontine.statut}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedTontineId(tontine.id)}
                          title={t('tontines.tontineDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditTontineId(tontine.id)}
                          title={t('tontines.editTontine')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tontine.id, tontine.nom)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTontines.length)} of {filteredTontines.length} tontines
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      <AddTontineModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <EditTontineModal
        tontineId={editTontineId}
        open={!!editTontineId}
        onOpenChange={(open) => !open && setEditTontineId(null)}
      />

      <TontineDetailsSheet
        tontineId={selectedTontineId}
        open={!!selectedTontineId}
        onOpenChange={(open) => !open && setSelectedTontineId(null)}
      />
    </motion.div>
  );
}
