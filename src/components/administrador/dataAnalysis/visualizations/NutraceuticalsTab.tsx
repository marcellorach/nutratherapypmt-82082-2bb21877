
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NutraceuticalsTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('dataAnalysis.nutraceuticals.title')}</h2>
          <p className="text-muted-foreground">
            {t('dataAnalysis.nutraceuticals.description')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('dataAnalysis.nutraceuticals.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[200px]"
            />
          </div>
          
          <Button variant="outline" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('dataAnalysis.nutraceuticals.filters')}
          </Button>
          
          <Button variant="outline" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            {t('dataAnalysis.nutraceuticals.export')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Glucosamina
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          Condroitina
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
          Anti-inflamatório
        </Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
          Sinergia Alta
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('dataAnalysis.nutraceuticals.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
          <div className="text-center mt-4 text-sm text-muted-foreground">
            {t('dataAnalysis.nutraceuticals.inDevelopment')}
            <br />
            {t('dataAnalysis.nutraceuticals.synergiesWillShow')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NutraceuticalsTab;
