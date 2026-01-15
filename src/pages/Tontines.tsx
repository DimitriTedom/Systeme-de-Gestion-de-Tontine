import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTontineStore } from '@/stores/tontineStore';
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
import { AddTontineModal } from '@/components/tontines/AddTontineModal';

export default function Tontines() {
  const { t } = useTranslation();
  const { tontines, deleteTontine } = useTontineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm(t('members.confirmDelete'))) {
      deleteTontine(id);
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('tontines.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {tontines.length} {tontines.length === 1 ? 'tontine' : 'tontines'}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('tontines.addTontine')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tontines.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {tontines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('tontines.noTontines')}
            </div>
          ) : (
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
                {tontines.map((tontine) => (
                  <TableRow key={tontine.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{tontine.name}</div>
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
                      {formatCurrency(tontine.contributionAmount)}
                    </TableCell>
                    <TableCell>
                      {t(`tontines.frequencies.${tontine.frequency}`)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tontine.memberIds.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tontine.status === 'active' ? 'default' : 'secondary'}
                      >
                        {t(`common.${tontine.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tontine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddTontineModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
