
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Eye, FileHeart } from "lucide-react";
import ConditionDetailedAnalysisModal from "./modals/ConditionDetailedAnalysisModal";

interface Condition {
  id: string;
  name: string;
  description: string;
  treatabilityScore: number;
  preventionScore: number;
  roi: number;
  speciesAffected: string[];
  breedsAffected: string[];
  recommendedPackages: number;
}

interface HealthConditionsTableProps {
  conditions: Condition[];
  isLoading: boolean;
}

const HealthConditionsTable: React.FC<HealthConditionsTableProps> = ({
  conditions,
  isLoading
}) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [selectedCondition, setSelectedCondition] = React.useState<Condition | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDetailedAnalysis = (condition: Condition) => {
    setSelectedCondition(condition);
    setIsModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Função para determinar a cor com base no score (ajustada para valores mais realistas)
  const getTreatabilityColor = (score: number) => {
    if (score >= 45) return "bg-green-500";
    if (score >= 30) return "bg-yellow-500";
    return "bg-red-500";
  }

  const getPreventionColor = (score: number) => {
    if (score >= 65) return "bg-purple-500";
    if (score >= 40) return "bg-blue-500";
    return "bg-orange-500";
  }
  
  const getRoiColor = (roi: number) => {
    if (roi >= 2) return "bg-green-600";
    if (roi > 0) return "bg-green-400";
    if (roi === 0) return "bg-gray-400";
    if (roi > -2) return "bg-red-400";
    return "bg-red-600";
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>{t('visualization.conditions.table.headers.name')}</TableHead>
            <TableHead>{t('visualization.conditions.table.headers.treatability')}</TableHead>
            <TableHead>{t('visualization.conditions.table.headers.prevention')}</TableHead>
            <TableHead>{t('visualization.conditions.table.headers.roi')}</TableHead>
            <TableHead>{t('visualization.conditions.table.headers.affectedSpecies')}</TableHead>
            <TableHead>{t('visualization.conditions.table.headers.recommendedPackages')}</TableHead>
            <TableHead className="w-[100px]">{t('visualization.conditions.table.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                {t('visualization.conditions.table.noConditions')}
              </TableCell>
            </TableRow>
          ) : (
            conditions.map(condition => (
              <React.Fragment key={condition.id}>
                <TableRow>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleRow(condition.id)}
                    >
                      {expandedRows[condition.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{condition.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getTreatabilityColor(condition.treatabilityScore)}`} 
                          style={{ width: `${condition.treatabilityScore}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{condition.treatabilityScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getPreventionColor(condition.preventionScore)}`} 
                          style={{ width: `${condition.preventionScore}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{condition.preventionScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <div className="w-[1px] h-full bg-gray-400"></div>
                        </div>
                        <div 
                          className={`h-2.5 rounded-full ${getRoiColor(condition.roi)}`} 
                          style={{ 
                            width: `${Math.abs(condition.roi) * 15}%`,
                            marginLeft: condition.roi >= 0 ? '50%' : `calc(50% - ${Math.abs(condition.roi) * 15}%)` 
                          }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{condition.roi.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {condition.speciesAffected.join(', ')}
                  </TableCell>
                  <TableCell>{condition.recommendedPackages}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <FileHeart className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {expandedRows[condition.id] && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-50 p-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold">{t('visualization.conditions.table.expandedInfo.description')}</h4>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{t('visualization.conditions.table.expandedInfo.affectedBreeds')}</h4>
                          <p className="text-sm text-gray-600">{condition.breedsAffected.join(', ')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold">{t('visualization.conditions.table.expandedInfo.treatmentPackages')}</h4>
                            {condition.id.startsWith('c9') || condition.id.startsWith('c10') ? (
                              <ul className="text-sm text-gray-600 list-disc pl-5">
                                <li>{t('visualization.conditions.table.expandedInfo.packLongevity')} ({Math.round(condition.treatabilityScore * 0.9)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                                <li>{t('visualization.conditions.table.expandedInfo.packSenolytic')} ({Math.round(condition.treatabilityScore * 0.85)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                              </ul>
                            ) : (
                              <ul className="text-sm text-gray-600 list-disc pl-5">
                                <li>{t('visualization.conditions.table.expandedInfo.packPremium', { name: condition.name })} ({Math.round(condition.treatabilityScore * 0.9)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                                <li>{t('visualization.conditions.table.expandedInfo.packSupport', { name: condition.name.split(' ')[0] })} ({Math.round(condition.treatabilityScore * 0.8)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                              </ul>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{t('visualization.conditions.table.expandedInfo.preventionPackages')}</h4>
                            {condition.id.startsWith('c9') || condition.id.startsWith('c10') ? (
                              <ul className="text-sm text-gray-600 list-disc pl-5">
                                <li>{t('visualization.conditions.table.expandedInfo.packAntiAging')} ({Math.round(condition.preventionScore * 0.9)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                                <li>{t('visualization.conditions.table.expandedInfo.packCellProtector')} ({Math.round(condition.preventionScore * 0.85)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                              </ul>
                            ) : (
                              <ul className="text-sm text-gray-600 list-disc pl-5">
                                <li>{t('visualization.conditions.table.expandedInfo.packPreventive', { name: condition.name.split(' ')[0] })} ({Math.round(condition.preventionScore * 0.9)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                                <li>{t('visualization.conditions.table.expandedInfo.packImmuneSupport')} ({Math.round(condition.preventionScore * 0.8)}% {t('visualization.conditions.table.expandedInfo.efficacy')})</li>
                              </ul>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => handleDetailedAnalysis(condition)}
                          >
                            {t('visualization.conditions.table.expandedInfo.viewDetailedAnalysis')}
                          </Button>
                          <Button className="ml-2">{t('visualization.conditions.table.expandedInfo.viewRecommendedPackages')}</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>

      <ConditionDetailedAnalysisModal
        condition={selectedCondition}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default HealthConditionsTable;
