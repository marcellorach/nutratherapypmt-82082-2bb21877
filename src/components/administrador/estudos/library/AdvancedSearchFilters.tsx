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
        <Button variant="outline" size="sm" className="w-full justify-between">
          {t('studies.search.filters.advanced')}
          <span className="text-xs text-muted-foreground">
            {isOpen ? '−' : '+'}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{t('studies.search.filters.dateFrom')}</Label>
            <Input
              type="number"
              placeholder="2015"
              min={1900}
              max={currentYear}
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">{t('studies.search.filters.dateTo')}</Label>
            <Input
              type="number"
              placeholder={currentYear.toString()}
              min={1900}
              max={currentYear}
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Min Citations */}
        <div>
          <Label className="text-xs">{t('studies.search.filters.minCitations')}</Label>
          <Input
            type="number"
            placeholder="0"
            min={0}
            value={filters.minCitations || ''}
            onChange={(e) => updateFilter('minCitations', parseInt(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        {/* Sort By */}
        <div>
          <Label className="text-xs">{t('studies.search.filters.sortBy')}</Label>
          <Select value={filters.sortBy} onValueChange={(v: any) => updateFilter('sortBy', v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">{t('studies.search.filters.sort.relevance')}</SelectItem>
              <SelectItem value="date">{t('studies.search.filters.sort.date')}</SelectItem>
              <SelectItem value="citations">{t('studies.search.filters.sort.citations')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Open Access */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="openAccess"
            checked={filters.openAccessOnly}
            onCheckedChange={(checked) => updateFilter('openAccessOnly', !!checked)}
          />
          <Label htmlFor="openAccess" className="text-sm cursor-pointer">
            {t('studies.search.filters.openAccessOnly')}
          </Label>
        </div>

        {/* Publication Types */}
        <div>
          <Label className="text-xs mb-2 block">{t('studies.search.filters.publicationType')}</Label>
          <div className="flex flex-wrap gap-1">
            {PUBLICATION_TYPES.map(type => (
              <Badge
                key={type.value}
                variant={filters.publicationType.includes(type.value) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => togglePublicationType(type.value)}
              >
                {t(type.labelKey)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Species */}
        <div>
          <Label className="text-xs mb-2 block">{t('studies.search.filters.speciesLabel')}</Label>
          <div className="flex flex-wrap gap-1">
            {SPECIES_OPTIONS.map(species => (
              <Badge
                key={species.value}
                variant={filters.species.includes(species.value) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleSpecies(species.value)}
              >
                {t(species.labelKey)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Must Include Terms */}
        <div>
          <Label className="text-xs mb-2 block">{t('studies.search.filters.mustInclude')}</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder={t('studies.search.filters.addTerm')}
              value={newIncludeTerm}
              onChange={(e) => setNewIncludeTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIncludeTerm()}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addIncludeTerm} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.mustInclude.map(term => (
              <Badge key={term} variant="secondary" className="gap-1 text-xs">
                +{term}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeIncludeTerm(term)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Must Exclude Terms */}
        <div>
          <Label className="text-xs mb-2 block">{t('studies.search.filters.mustExclude')}</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder={t('studies.search.filters.addTerm')}
              value={newExcludeTerm}
              onChange={(e) => setNewExcludeTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExcludeTerm()}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" variant="outline" onClick={addExcludeTerm} className="h-8 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.mustExclude.map(term => (
              <Badge key={term} variant="destructive" className="gap-1 text-xs">
                -{term}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeExcludeTerm(term)} />
              </Badge>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AdvancedSearchFilters;
