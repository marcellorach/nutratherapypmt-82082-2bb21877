import React from 'react';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
  minCitations: number;
  publicationType: string[];
  species: string[];
  openAccessOnly: boolean;
  mustInclude: string[];
  mustExclude: string[];
  sortBy: 'relevance' | 'date' | 'citations';
}

interface AdvancedSearchFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PUBLICATION_TYPES = [
  { value: 'review', labelKey: 'studies.search.filters.types.review' },
  { value: 'clinical-trial', labelKey: 'studies.search.filters.types.clinicalTrial' },
  { value: 'meta-analysis', labelKey: 'studies.search.filters.types.metaAnalysis' },
  { value: 'randomized-controlled-trial', labelKey: 'studies.search.filters.types.rct' },
  { value: 'systematic-review', labelKey: 'studies.search.filters.types.systematicReview' },
  { value: 'case-report', labelKey: 'studies.search.filters.types.caseReport' },
];

const SPECIES_OPTIONS = [
  { value: 'dogs', labelKey: 'studies.search.filters.species.dogs' },
  { value: 'cats', labelKey: 'studies.search.filters.species.cats' },
  { value: 'horses', labelKey: 'studies.search.filters.species.horses' },
  { value: 'humans', labelKey: 'studies.search.filters.species.humans' },
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onOpenChange
}) => {
  const { t } = useSafeTranslation();
  const [newIncludeTerm, setNewIncludeTerm] = React.useState('');
  const [newExcludeTerm, setNewExcludeTerm] = React.useState('');

  const updateFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const togglePublicationType = (type: string) => {
    const current = filters.publicationType;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('publicationType', updated);
  };

  const toggleSpecies = (species: string) => {
    const current = filters.species;
    const updated = current.includes(species)
      ? current.filter(s => s !== species)
      : [...current, species];
    updateFilter('species', updated);
  };

  const addIncludeTerm = () => {
    if (newIncludeTerm.trim() && !filters.mustInclude.includes(newIncludeTerm.trim())) {
      updateFilter('mustInclude', [...filters.mustInclude, newIncludeTerm.trim()]);
      setNewIncludeTerm('');
    }
  };

  const addExcludeTerm = () => {
    if (newExcludeTerm.trim() && !filters.mustExclude.includes(newExcludeTerm.trim())) {
      updateFilter('mustExclude', [...filters.mustExclude, newExcludeTerm.trim()]);
      setNewExcludeTerm('');
    }
  };

  const removeIncludeTerm = (term: string) => {
    updateFilter('mustInclude', filters.mustInclude.filter(t => t !== term));
  };

  const removeExcludeTerm = (term: string) => {
    updateFilter('mustExclude', filters.mustExclude.filter(t => t !== term));
  };

  const currentYear = new Date().getFullYear();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between h-7 text-xs">
          {t('studies.search.filters.advanced')}
          <span className="text-xs text-muted-foreground">
            {isOpen ? '−' : '+'}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2 max-h-[160px] overflow-y-auto pr-1">
        {/* Row 1: Date Range + Min Citations + Sort By */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">{t('studies.search.filters.dateFrom')}</Label>
            <Input
              type="number"
              placeholder="2015"
              min={1900}
              max={currentYear}
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">{t('studies.search.filters.dateTo')}</Label>
            <Input
              type="number"
              placeholder={currentYear.toString()}
              min={1900}
              max={currentYear}
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">{t('studies.search.filters.minCitations')}</Label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              value={filters.minCitations || ''}
              onChange={(e) => updateFilter('minCitations', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">{t('studies.search.filters.sortBy')}</Label>
            <Select value={filters.sortBy} onValueChange={(v: any) => updateFilter('sortBy', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t('studies.search.filters.sort.relevance')}</SelectItem>
                <SelectItem value="date">{t('studies.search.filters.sort.date')}</SelectItem>
                <SelectItem value="citations">{t('studies.search.filters.sort.citations')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Open Access + Publication Types + Species */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="openAccess"
              checked={filters.openAccessOnly}
              onCheckedChange={(checked) => updateFilter('openAccessOnly', !!checked)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="openAccess" className="text-xs cursor-pointer">
              {t('studies.search.filters.openAccessOnly')}
            </Label>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground">{t('studies.search.filters.publicationType')}:</span>
            {PUBLICATION_TYPES.map(type => (
              <Badge
                key={type.value}
                variant={filters.publicationType.includes(type.value) ? "default" : "outline"}
                className="cursor-pointer text-[10px] px-1.5 py-0 h-5"
                onClick={() => togglePublicationType(type.value)}
              >
                {t(type.labelKey)}
              </Badge>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground">{t('studies.search.filters.speciesLabel')}:</span>
            {SPECIES_OPTIONS.map(species => (
              <Badge
                key={species.value}
                variant={filters.species.includes(species.value) ? "default" : "outline"}
                className="cursor-pointer text-[10px] px-1.5 py-0 h-5"
                onClick={() => toggleSpecies(species.value)}
              >
                {t(species.labelKey)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Row 3: Include/Exclude Terms - Compact inline */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex gap-1 mb-1">
              <Input
                placeholder={t('studies.search.filters.mustInclude')}
                value={newIncludeTerm}
                onChange={(e) => setNewIncludeTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIncludeTerm()}
                className="h-6 text-xs flex-1"
              />
              <Button size="sm" variant="outline" onClick={addIncludeTerm} className="h-6 px-1.5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {filters.mustInclude.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {filters.mustInclude.map(term => (
                  <Badge key={term} variant="secondary" className="gap-0.5 text-[10px] px-1 py-0 h-4">
                    +{term}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeIncludeTerm(term)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex gap-1 mb-1">
              <Input
                placeholder={t('studies.search.filters.mustExclude')}
                value={newExcludeTerm}
                onChange={(e) => setNewExcludeTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExcludeTerm()}
                className="h-6 text-xs flex-1"
              />
              <Button size="sm" variant="outline" onClick={addExcludeTerm} className="h-6 px-1.5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {filters.mustExclude.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {filters.mustExclude.map(term => (
                  <Badge key={term} variant="destructive" className="gap-0.5 text-[10px] px-1 py-0 h-4">
                    -{term}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeExcludeTerm(term)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AdvancedSearchFilters;
