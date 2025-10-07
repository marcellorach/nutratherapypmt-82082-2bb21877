import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SampleGroupBadge from "@/components/administrador/SampleGroupBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
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
  recommendedPackages: string[] | number;
  eligibleDogs?: number;
  eligibleCats?: number;
}

interface HealthConditionsTableProps {
  conditions: Condition[];
  isLoading?: boolean;
}

const HealthConditionsTable: React.FC<HealthConditionsTableProps> = ({ 
  conditions,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };
  
  const getTreatabilityColor = (score: number) => {
    if (score >= 8.0) return "bg-green-500";
    if (score >= 6.5) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  const getPreventionColor = (score: number) => {
    if (score >= 8.0) return "bg-purple-500";
    if (score >= 7.0) return "bg-blue-500";
    return "bg-orange-500";
  };
  
  const getRoiColor = (roi: number) => {
    if (roi >= 75) return "text-green-600";
    if (roi >= 65) return "text-blue-600";
    return "text-orange-600";
  };
  
  return (
    <>
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{t('visualization.conditions.table.title')}</CardTitle>
            <SampleGroupBadge />
          </div>
          <CardDescription>
            {t('visualization.conditions.table.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t('visualization.conditions.table.condition')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.treatability')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.prevention')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.roi')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.eligibleDogs')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.eligibleCats')}</TableHead>
                    <TableHead>{t('visualization.conditions.table.packages')}</TableHead>
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
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{condition.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getTreatabilityColor(condition.treatabilityScore)}`}
                                style={{ width: `${(condition.treatabilityScore / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {condition.treatabilityScore.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getPreventionColor(condition.preventionScore)}`}
                                style={{ width: `${(condition.preventionScore / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {condition.preventionScore.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getRoiColor(condition.roi)}`}>
                            {condition.roi}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {condition.eligibleDogs?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {condition.eligibleCats?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Array.isArray(condition.recommendedPackages) 
                              ? condition.recommendedPackages.length 
                              : condition.recommendedPackages}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(condition.id) && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/50">
                            <div className="p-4 space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-1">
                                  {t('visualization.conditions.table.expandedRow.description')}
                                </h4>
                                <p className="text-sm text-muted-foreground">{condition.description}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">
                                  {t('visualization.conditions.table.expandedRow.affectedBreeds')}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {condition.breedsAffected.join(", ")}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">
                                  {t('visualization.conditions.table.expandedRow.recommendedPackages')}
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {Array.isArray(condition.recommendedPackages) ? (
                                    condition.recommendedPackages.map((pkg, idx) => (
                                      <Badge key={idx} variant="outline">{pkg}</Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline">
                                      {t('visualization.conditions.table.expandedRow.packagesCount', { count: condition.recommendedPackages })}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCondition(condition);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('visualization.conditions.table.expandedRow.viewDetailedAnalysis')}
                                </Button>
                              </div>
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
        </CardContent>
      </Card>

      {selectedCondition && (
        <ConditionDetailedAnalysisModal
          condition={selectedCondition as any}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default HealthConditionsTable;
