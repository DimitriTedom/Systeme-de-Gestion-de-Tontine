import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Wallet, Search, Eye, Coins, PiggyBank, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AddTontineModal } from '@/components/tontines/AddTontineModal';
import { EditTontineModal } from '@/components/tontines/EditTontineModal';
import { TontineDetailsSheet } from '@/components/tontines/TontineDetailsSheet';
import { TontinesExcelExport } from '@/components/tontines/TontinesExcelExport';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';

export default function Tontines() {
  const { t } = useTranslation();
  const { tontines, isLoading, error, fetchTontinesWithStats, deleteTontine } = useTontineStore();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTontineId, setEditTontineId] = useState<string | null>(null);
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch tontines when component mounts
  useEffect(() => {
    fetchTontinesWithStats();
  }, [fetchTontinesWithStats]);

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
          className='flex gap-3'
        >
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30">
            <Plus className="mr-2 h-4 w-4" />
            {t('tontines.addTontine')}
          </Button>
          <Button 
            onClick={() => setIsExportModalOpen(true)} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={tontines.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter Excel
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
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{t('common.error')}: {error}</p>
              <Button onClick={fetchTontinesWithStats} variant="outline" className="mt-4">
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('tontines.name')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">{t('tontines.type')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('tontines.contributionAmount')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">{t('tontines.frequency')}</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">{t('tontines.members')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('common.status')}</TableHead>
                      <TableHead className="text-right whitespace-nowrap">{t('common.actions')}</TableHead>
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
                            <div className="whitespace-nowrap">{tontine.nom}</div>
                            {tontine.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {tontine.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            {t(`tontines.types.${tontine.type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatCurrency(tontine.montant_cotisation)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {t(`tontines.frequencies.${tontine.periode}`)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
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
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 sm:h-9 sm:w-9"
                              onClick={() => setSelectedTontineId(tontine.id)}
                              title={t('tontines.tontineDetails')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 sm:h-9 sm:w-9"
                              onClick={() => setEditTontineId(tontine.id)}
                              title={t('tontines.editTontine')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-9 sm:w-9"
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  {/* Results info */}
                  <div className="text-sm text-muted-foreground">
                    {t('common.showing')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTontines.length)} {t('common.of')} {filteredTontines.length} {t('tontines.tontines')}
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">{t('common.previous')}</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                className="min-w-[2.5rem]"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Mobile: Current page indicator */}
                    <div className="sm:hidden text-sm">
                      {currentPage} / {totalPages}
                    </div>

                    {/* Next button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">{t('common.next')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

      <TontinesExcelExport
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </motion.div>
  );
}
