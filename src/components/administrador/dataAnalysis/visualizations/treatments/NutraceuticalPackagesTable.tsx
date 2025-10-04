
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, FileText, Send } from "lucide-react";

interface Package {
  id: string;
  name: string;
  type: 'treatment' | 'prevention' | 'support' | string;
  condition: string;
  nutraceuticalCount: number;
  efficacyScore: number;
  speciesTarget: string[];
  status: 'approved' | 'pending' | 'draft' | string;
}

interface NutraceuticalPackagesTableProps {
  packages: Package[];
  isLoading: boolean;
  onPackageSelect: (packageId: string) => void;
  selectedPackage: string | null;
  selectedPackages: string[];
  onPackageSelectionToggle: (packageId: string) => void;
}

const NutraceuticalPackagesTable: React.FC<NutraceuticalPackagesTableProps> = ({
  packages,
  isLoading,
  onPackageSelect,
  selectedPackage,
  selectedPackages,
  onPackageSelectionToggle
}) => {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'treatment':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">{t('visualization.treatments.table.types.treatment')}</Badge>;
      case 'prevention':
        return <Badge variant="outline" className="bg-green-50 text-green-700">{t('visualization.treatments.table.types.prevention')}</Badge>;
      case 'support':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">{t('visualization.treatments.table.types.support')}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">{t('visualization.treatments.table.status.approved')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">{t('visualization.treatments.table.status.pending')}</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">{t('visualization.treatments.table.status.draft')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>{t('visualization.treatments.table.headers.name')}</TableHead>
            <TableHead>{t('visualization.treatments.table.headers.type')}</TableHead>
            <TableHead>{t('visualization.treatments.table.headers.condition')}</TableHead>
            <TableHead>{t('visualization.treatments.table.headers.efficacy')}</TableHead>
            <TableHead>{t('visualization.treatments.table.headers.nutraceuticals')}</TableHead>
            <TableHead>{t('visualization.treatments.table.headers.status')}</TableHead>
            <TableHead className="text-right">{t('visualization.treatments.table.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                {t('visualization.treatments.table.noPackages')}
              </TableCell>
            </TableRow>
          ) : (
            packages.map(pkg => (
              <TableRow 
                key={pkg.id}
                className={selectedPackage === pkg.id ? "bg-muted/50" : ""}
                onClick={() => onPackageSelect(pkg.id)}
              >
                <TableCell>
                  <Checkbox 
                    checked={selectedPackages.includes(pkg.id)}
                    onCheckedChange={() => onPackageSelectionToggle(pkg.id)}
                    onClick={e => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{getTypeBadge(pkg.type)}</TableCell>
                <TableCell>{pkg.condition}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          pkg.efficacyScore >= 75 ? "bg-green-500" : 
                          pkg.efficacyScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`} 
                        style={{ width: `${pkg.efficacyScore}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{pkg.efficacyScore}%</span>
                  </div>
                </TableCell>
                <TableCell>{pkg.nutraceuticalCount}</TableCell>
                <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); }}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NutraceuticalPackagesTable;
