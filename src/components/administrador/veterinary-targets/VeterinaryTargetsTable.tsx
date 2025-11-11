
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

interface VeterinaryTargetsTableProps {
  conditions: any[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedSeverity: string | null;
  setSelectedSeverity: (severity: string | null) => void;
  onEdit: (condition: any) => void;
  onDelete: (conditionId: string) => void;
}

const VeterinaryTargetsTable: React.FC<VeterinaryTargetsTableProps> = ({
  conditions,
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSeverity,
  setSelectedSeverity,
  onEdit,
  onDelete
}) => {
  const { t, i18n } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState<string | null>(null);

  const getLocalizedField = (condition: any, field: 'name' | 'description' | 'category') => {
    const isEnglish = i18n.language === 'en';
    const enField = `${field}_en`;
    const enValue = condition[enField];
    
    // Se estiver em inglês mas o valor contém "(translate)", use o valor em PT
    if (isEnglish && enValue && !enValue.includes('(translate)')) {
      return enValue;
    }
    
    return condition[field];
  };

  const calculateTreatability = (condition: any) => {
    const nutraCount = condition.nutraceutical_count || 0;
    const avgEfficacy = condition.avg_efficacy || 0;
    const treatmentCount = condition.treatment_count || 0;
    const preventionCount = condition.prevention_count || 0;
    const supportCount = condition.support_count || 0;

    if (!avgEfficacy || nutraCount === 0) {
      return {
        percentage: 0,
        level: 'pending' as const,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        label: t('admin.veterinaryTargets.treatability.pending'),
        showCount: false
      };
    }

    // Peso baseado nos tipos de relacionamento
    let weight = 1.0;
    if (treatmentCount > 0) weight = 1.0;
    else if (preventionCount > 0) weight = 0.8;
    else if (supportCount > 0) weight = 0.6;

    const rawPercentage = (avgEfficacy / 5) * 100 * weight;
    const percentage = Math.round(rawPercentage / 5) * 5; // Arredonda para múltiplo de 5

    if (percentage <= 35) {
      return {
        percentage,
        level: 'low' as const,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: t('admin.veterinaryTargets.treatability.low'),
        showCount: true
      };
    } else if (percentage <= 65) {
      return {
        percentage,
        level: 'moderate' as const,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: t('admin.veterinaryTargets.treatability.moderate'),
        showCount: true
      };
    } else if (percentage <= 85) {
      return {
        percentage,
        level: 'good' as const,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: t('admin.veterinaryTargets.treatability.good'),
        showCount: true
      };
    } else {
      return {
        percentage,
        level: 'excellent' as const,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: t('admin.veterinaryTargets.treatability.excellent'),
        showCount: true
      };
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteClick = (conditionId: string) => {
    setConditionToDelete(conditionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conditionToDelete) {
      onDelete(conditionToDelete);
      setDeleteDialogOpen(false);
      setConditionToDelete(null);
    }
  };

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      low: 'secondary',
      moderate: 'default',
      high: 'destructive',
      critical: 'destructive'
    };

    return (
      <Badge variant={variants[severity] || 'outline'}>
        {severity}
      </Badge>
    );
  };

  const categories = [...new Set(conditions.map(c => c.category).filter(Boolean))];
  const severityLevels = [...new Set(conditions.map(c => c.severity_level).filter(Boolean))];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.veterinaryTargets.table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.veterinaryTargets.table.categoryFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.veterinaryTargets.table.allCategories')}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedSeverity || 'all'}
            onValueChange={(value) => setSelectedSeverity(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.veterinaryTargets.table.severityFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.veterinaryTargets.table.allSeverities')}</SelectItem>
              {severityLevels.map(sev => (
                <SelectItem key={sev} value={sev}>{sev}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : conditions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('admin.veterinaryTargets.table.noConditionsFound')}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
        <TableHead>{t('admin.veterinaryTargets.table.columnName')}</TableHead>
        <TableHead>{t('admin.veterinaryTargets.table.columnCategory')}</TableHead>
        <TableHead>{t('admin.veterinaryTargets.table.columnSeverity')}</TableHead>
        <TableHead>{t('admin.veterinaryTargets.treatability.column')}</TableHead>
        <TableHead className="text-right">{t('admin.veterinaryTargets.table.columnActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditions.map((condition) => (
                  <React.Fragment key={condition.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(condition.id)}
                        >
                          {expandedRows.has(condition.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{getLocalizedField(condition, 'name')}</TableCell>
                      <TableCell>
                        {condition.category && (
                          <Badge variant="outline">{getLocalizedField(condition, 'category')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(condition.severity_level)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const treatability = calculateTreatability(condition);
                          return treatability.showCount ? (
                            <div className="flex items-center gap-2">
                              <div className={`px-2.5 py-1 rounded-md border ${treatability.borderColor} ${treatability.bgColor} ${treatability.color} text-xs font-semibold`}>
                                {treatability.percentage}%
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {condition.nutraceutical_count} {t('admin.veterinaryTargets.treatability.nutraceuticals')}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                              {treatability.label}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(condition)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(condition.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(condition.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50">
                          <div className="py-4 px-2 space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                <strong>{t('admin.veterinaryTargets.table.expandedDescription')}</strong>{' '}
                                {getLocalizedField(condition, 'description') || 
                                 t('admin.veterinaryTargets.table.noDescription')}
                              </p>
                            </div>
                            
                            {condition.nutraceutical_count > 0 ? (
                              <div>
                                <h4 className="font-semibold mb-2 text-sm">
                                  {t('admin.veterinaryTargets.treatability.detailsTitle')}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      {t('admin.veterinaryTargets.treatability.totalNutraceuticals')}:
                                    </span>
                                    <span className="ml-2 font-semibold">{condition.nutraceutical_count}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      {t('admin.veterinaryTargets.treatability.treatment')}:
                                    </span>
                                    <span className="ml-2 font-semibold">{condition.treatment_count || 0}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      {t('admin.veterinaryTargets.treatability.prevention')}:
                                    </span>
                                    <span className="ml-2 font-semibold">{condition.prevention_count || 0}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      {t('admin.veterinaryTargets.treatability.support')}:
                                    </span>
                                    <span className="ml-2 font-semibold">{condition.support_count || 0}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      {t('admin.veterinaryTargets.treatability.avgEfficacy')}:
                                    </span>
                                    <span className="ml-2 font-semibold">
                                      {condition.avg_efficacy ? condition.avg_efficacy.toFixed(1) : '0'}/5
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic">
                                {t('admin.veterinaryTargets.treatability.noCatalogData')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.veterinaryTargets.deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.veterinaryTargets.deleteDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('admin.veterinaryTargets.deleteDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {t('admin.veterinaryTargets.deleteDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default VeterinaryTargetsTable;
