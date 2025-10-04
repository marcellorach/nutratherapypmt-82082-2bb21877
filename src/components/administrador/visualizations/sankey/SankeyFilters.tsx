
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { NodeCategory } from './types';
import { Label } from '@/components/ui/label';

interface SankeyFiltersProps {
  activeCategories: NodeCategory[];
  setActiveCategories: (categories: NodeCategory[]) => void;
  minEfficacy: number;
  setMinEfficacy: (value: number) => void;
  relationshipType: string;
  setRelationshipType: (value: string) => void;
}

const SankeyFilters: React.FC<SankeyFiltersProps> = ({
  activeCategories,
  setActiveCategories,
  minEfficacy,
  setMinEfficacy,
  relationshipType,
  setRelationshipType
}) => {
  const { t } = useTranslation();
  
  const categories: { id: NodeCategory; label: string; color: string }[] = [
    { id: 'nutraceutico', label: t('sankey.filters.nutraceuticals'), color: 'bg-blue-100 border-blue-200 text-blue-700' },
    { id: 'condicao', label: t('sankey.filters.conditions'), color: 'bg-green-100 border-green-200 text-green-700' },
    { id: 'outcome', label: t('sankey.filters.outcomes'), color: 'bg-amber-100 border-amber-200 text-amber-700' },
    { id: 'severidade', label: t('sankey.filters.severity'), color: 'bg-purple-100 border-purple-200 text-purple-700' },
    { id: 'tratabilidade', label: t('sankey.filters.treatability'), color: 'bg-rose-100 border-rose-200 text-rose-700' }
  ];

  const handleCategoryToggle = (category: NodeCategory) => {
    if (activeCategories.includes(category)) {
      // Não remover se restarem apenas 2 categorias (precisamos de no mínimo 2)
      if (activeCategories.length > 2) {
        setActiveCategories(activeCategories.filter(c => c !== category));
      }
    } else {
      setActiveCategories([...activeCategories, category]);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <span className="mr-2">{t('sankey.filters.categories')}</span>
            <span className="text-xs text-gray-500">{t('sankey.filters.minCategories')}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div 
                key={category.id}
                className={`
                  flex items-center p-1.5 px-3 rounded-full border cursor-pointer
                  ${activeCategories.includes(category.id) 
                    ? category.color 
                    : 'bg-white border-gray-200 text-gray-400'}
                `}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <Checkbox 
                  checked={activeCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  id={`category-${category.id}`}
                  className="mr-1.5 h-3.5 w-3.5"
                  disabled={activeCategories.length <= 2 && activeCategories.includes(category.id)}
                />
                <Label 
                  htmlFor={`category-${category.id}`}
                  className="text-xs cursor-pointer"
                >
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">{t('sankey.filters.minEfficacy')}</h4>
          <div className="flex items-center gap-4">
            <div className="w-full">
              <Slider
                value={[minEfficacy]}
                onValueChange={(values) => setMinEfficacy(values[0])}
                max={100}
                step={5}
                className="py-4"
              />
            </div>
            <span className="w-12 text-center font-medium text-sm">
              {minEfficacy}%
            </span>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">{t('sankey.filters.relationshipType')}</h4>
          <Select 
            value={relationshipType} 
            onValueChange={setRelationshipType}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('sankey.filters.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sankey.filters.allTypes')}</SelectItem>
              <SelectItem value="prevention">{t('sankey.filters.prevention')}</SelectItem>
              <SelectItem value="treatment">{t('sankey.filters.treatment')}</SelectItem>
              <SelectItem value="support">{t('sankey.filters.support')}</SelectItem>
              <SelectItem value="study">{t('sankey.filters.study')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SankeyFilters;
