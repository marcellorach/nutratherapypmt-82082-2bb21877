
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown, FileDown, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NutraceuticalPackagesTable from './treatments/NutraceuticalPackagesTable';
import PackageDetailsPanel from './treatments/PackageDetailsPanel';
import PackageEfficiencyMetrics from './treatments/PackageEfficiencyMetrics';
import { useTreatmentsData } from '@/hooks/visualizations/useTreatmentsData';
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

const TreatmentsTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [packageTypeFilter, setPackageTypeFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('recommended');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  const { 
    packages, 
    isLoading, 
    packageDetails,
    filteredPackages,
    packageStats
  } = useTreatmentsData({
    searchTerm,
    condition: conditionFilter,
    species: speciesFilter,
    packageType: packageTypeFilter
  });
  
  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId) 
        : [...prev, packageId]
    );
  };
  
  const handleSelectAllPackages = (checked: CheckedState) => {
    if (checked) {
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    } else {
      setSelectedPackages([]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('visualization.treatments.title')}</h2>
          <p className="text-gray-600">
            {t('visualization.treatments.description')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('visualization.treatments.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.treatments.filters.condition')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.treatments.filters.allConditions')}</SelectItem>
              <SelectItem value="artrite">{t('visualization.treatments.filters.arthritis')}</SelectItem>
              <SelectItem value="dermatite">{t('visualization.treatments.filters.dermatitis')}</SelectItem>
              <SelectItem value="cardiaco">{t('visualization.treatments.filters.cardiac')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.treatments.filters.species')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.treatments.filters.allSpecies')}</SelectItem>
              <SelectItem value="canine">{t('visualization.treatments.filters.dogs')}</SelectItem>
              <SelectItem value="feline">{t('visualization.treatments.filters.cats')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('visualization.treatments.filters.packageType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('visualization.treatments.filters.allTypes')}</SelectItem>
              <SelectItem value="treatment">{t('visualization.treatments.filters.treatment')}</SelectItem>
              <SelectItem value="prevention">{t('visualization.treatments.filters.prevention')}</SelectItem>
              <SelectItem value="support">{t('visualization.treatments.filters.support')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('visualization.treatments.filters.moreFilters')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {t('visualization.treatments.badges.jointPack')}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          {t('visualization.treatments.badges.prevention')}
        </Badge>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
          {t('visualization.treatments.badges.treatment')}
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          {t('visualization.treatments.badges.highEfficacy')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{t('visualization.treatments.packagesCard.title')}</CardTitle>
              <div className="flex items-center space-x-4">
                {selectedPackages.length > 0 && (
                  <Button 
                    variant="default" 
                    className="gap-2"
                    onClick={() => console.log('Enviar para revisão:', selectedPackages)}
                  >
                    <Send className="h-4 w-4" />
                    {t('visualization.treatments.table.sendToReview')} ({selectedPackages.length})
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  {t('visualization.treatments.table.export')}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  {t('visualization.treatments.table.sort')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="recommended">{t('visualization.treatments.tabs.recommended')}</TabsTrigger>
                <TabsTrigger value="all">{t('visualization.treatments.tabs.all')}</TabsTrigger>
                <TabsTrigger value="custom">{t('visualization.treatments.tabs.custom')}</TabsTrigger>
                <TabsTrigger value="reviews">{t('visualization.treatments.tabs.reviews')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recommended" className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="selectAll" onCheckedChange={handleSelectAllPackages} />
                    <label htmlFor="selectAll" className="text-sm">
                      {t('visualization.treatments.packagesCard.selectAll')}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {filteredPackages.length} {t('visualization.treatments.packagesCard.availablePackages')}
                  </p>
                </div>
                
                <NutraceuticalPackagesTable 
                  packages={filteredPackages} 
                  isLoading={isLoading}
                  onPackageSelect={setSelectedPackage}
                  selectedPackage={selectedPackage}
                  selectedPackages={selectedPackages}
                  onPackageSelectionToggle={togglePackageSelection}
                />
              </TabsContent>
              
              <TabsContent value="all">
                <p className="text-muted-foreground text-center py-12">
                  {t('visualization.treatments.tabs.allInDevelopment')}
                </p>
              </TabsContent>
              
              <TabsContent value="custom">
                <p className="text-muted-foreground text-center py-12">
                  {t('visualization.treatments.tabs.customInDevelopment')}
                </p>
              </TabsContent>
              
              <TabsContent value="reviews">
                <p className="text-muted-foreground text-center py-12">
                  {t('visualization.treatments.tabs.reviewsInDevelopment')}
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('visualization.treatments.details.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPackage ? (
              <PackageDetailsPanel 
                packageDetails={packageDetails} 
                packageId={selectedPackage}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('visualization.treatments.detailsPanel.selectPackage')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('visualization.treatments.efficiency.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageEfficiencyMetrics 
            packageStats={packageStats}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentsTab;
