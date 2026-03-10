
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Trash2, ChevronDown, ChevronRight, PawPrint, Pill, FlaskConical } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        label: t('admin.veterinaryTargets.treatability.pending'),
        showCount: false
      };
    }

    let weight = 1.0;
    if (treatmentCount > 0) weight = 1.0;
    else if (preventionCount > 0) weight = 0.8;
    else if (supportCount > 0) weight = 0.6;

    const rawPercentage = (avgEfficacy / 5) * 100 * weight;
    const percentage = Math.round(rawPercentage / 5) * 5;

    if (percentage <= 35) {
      return { percentage, level: 'low' as const, label: t('admin.veterinaryTargets.treatability.low'), showCount: true };
    } else if (percentage <= 65) {
      return { percentage, level: 'moderate' as const, label: t('admin.veterinaryTargets.treatability.moderate'), showCount: true };
    } else if (percentage <= 85) {
      return { percentage, level: 'good' as const, label: t('admin.veterinaryTargets.treatability.good'), showCount: true };
    } else {
      return { percentage, level: 'excellent' as const, label: t('admin.veterinaryTargets.treatability.excellent'), showCount: true };
    }
  };

  const getTreatabilityStyles = (level: string) => {
    switch (level) {
      case 'low': return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'moderate': return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'good': return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400';
      case 'excellent': return 'border-primary/30 bg-primary/10 text-primary';
      default: return 'border-muted-foreground/30 bg-muted text-muted-foreground';
    }
  };

  const getSeverityStyles = (severity: string | null) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive/80 text-destructive-foreground';
      case 'moderate': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'low': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  const categories = [...new Set(conditions.map(c => c.category).filter(Boolean))];
  const severityLevels = [...new Set(conditions.map(c => c.severity_level).filter(Boolean))];

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Filters */}
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

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : conditions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('admin.veterinaryTargets.table.noConditionsFound')}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {conditions.map((condition) => {
              const treatability = calculateTreatability(condition);
              const breedCount = condition.breed_predisposition_count || 0;
              const nutraCount = condition.nutraceutical_count || 0;
              const isExpanded = expandedRows.has(condition.id);

              return (
                <div
                  key={condition.id}
                  className="rounded-lg border bg-card transition-all hover:shadow-sm"
                >
                  {/* Main card row */}
                  <div className="flex items-start gap-3 p-4">
                    {/* Expand button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 mt-0.5 shrink-0"
                      onClick={() => toggleRow(condition.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top row: Name + Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {getLocalizedField(condition, 'name')}
                        </span>
                        
                        {condition.category && (
                          <Badge variant="outline" className="text-xs">
                            {getLocalizedField(condition, 'category')}
                          </Badge>
                        )}
                        
                        {condition.severity_level && (
                          <Badge className={`text-xs ${getSeverityStyles(condition.severity_level)}`}>
                            {condition.severity_level}
                          </Badge>
                        )}

                        {treatability.showCount ? (
                          <Badge className={`text-xs border ${getTreatabilityStyles(treatability.level)}`}>
                            {t('admin.veterinaryTargets.treatability.column')}: {treatability.percentage}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
                            {treatability.label}
                          </Badge>
                        )}
                      </div>

                      {/* Description snippet */}
                      {getLocalizedField(condition, 'description') && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {getLocalizedField(condition, 'description')}
                        </p>
                      )}

                      {/* Connection counters */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-default">
                                <PawPrint className="h-3.5 w-3.5" />
                                {breedCount} {t('admin.veterinaryTargets.connections.breeds')}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('admin.veterinaryTargets.connections.breedsTooltip', { count: breedCount })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-default">
                                <Pill className="h-3.5 w-3.5" />
                                {nutraCount} {t('admin.veterinaryTargets.connections.nutraceuticals')}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('admin.veterinaryTargets.connections.nutraceuticalsTooltip', { count: nutraCount })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {(condition.treatment_count > 0 || condition.prevention_count > 0 || condition.support_count > 0) && (
                          <span className="flex items-center gap-1">
                            <FlaskConical className="h-3.5 w-3.5" />
                            {condition.treatment_count || 0}T · {condition.prevention_count || 0}P · {condition.support_count || 0}S
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(condition)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                        onClick={() => handleDeleteClick(condition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 px-4 py-4 ml-10 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          <strong>{t('admin.veterinaryTargets.table.expandedDescription')}</strong>{' '}
                          {getLocalizedField(condition, 'description') || 
                           t('admin.veterinaryTargets.table.noDescription')}
                        </p>
                      </div>
                      
                      {nutraCount > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">
                            {t('admin.veterinaryTargets.treatability.detailsTitle')}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                {t('admin.veterinaryTargets.treatability.totalNutraceuticals')}:
                              </span>
                              <span className="ml-2 font-semibold">{nutraCount}</span>
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
                  )}
                </div>
              );
            })}
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
