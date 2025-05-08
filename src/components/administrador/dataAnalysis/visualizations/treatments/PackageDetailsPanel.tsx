
import React from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send, Download, FileEdit } from "lucide-react";

interface Nutraceutical {
  id: string;
  name: string;
  dosage: string;
  efficacyScore: number;
}

interface PackageDetail {
  id: string;
  name: string;
  description: string;
  nutraceuticals: Nutraceutical[];
  totalEfficacy: number;
  condition: string;
  speciesTarget: string[];
  administrationInstructions: string;
  contraindications: string[];
  synergies: { description: string; score: number }[];
}

interface PackageDetailsPanelProps {
  packageDetails: PackageDetail | null;
  packageId: string;
  isLoading: boolean;
}

const PackageDetailsPanel: React.FC<PackageDetailsPanelProps> = ({
  packageDetails,
  packageId,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (!packageDetails) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Detalhes do pacote não disponíveis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{packageDetails.name}</h3>
            <p className="text-muted-foreground text-sm">ID: {packageDetails.id}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FileEdit className="h-4 w-4" />
              <span>Editar</span>
            </Button>
            <Button variant="default" size="sm" className="flex items-center gap-1">
              <Send className="h-4 w-4" />
              <span>Enviar</span>
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm">{packageDetails.description}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Informações Básicas</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Condição</p>
            <p>{packageDetails.condition}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Espécies Alvo</p>
            <p>{packageDetails.speciesTarget.join(', ')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Eficácia Total</p>
            <div className="flex items-center mt-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    packageDetails.totalEfficacy >= 75 ? "bg-green-500" : 
                    packageDetails.totalEfficacy >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`} 
                  style={{ width: `${packageDetails.totalEfficacy}%` }}
                ></div>
              </div>
              <span className="ml-2">{packageDetails.totalEfficacy}%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Composição Nutracêutica ({packageDetails.nutraceuticals.length})</h4>
        <div className="space-y-3">
          {packageDetails.nutraceuticals.map(nutra => (
            <div key={nutra.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md">
              <div>
                <p className="font-medium text-sm">{nutra.name}</p>
                <p className="text-xs text-muted-foreground">Dosagem: {nutra.dosage}</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {nutra.efficacyScore}%
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Sinergias Principais</h4>
        <div className="space-y-2">
          {packageDetails.synergies.map((synergy, index) => (
            <div key={index} className="text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  +{synergy.score}%
                </Badge>
                <p>{synergy.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Instruções de Administração</h4>
        <p className="text-sm">{packageDetails.administrationInstructions}</p>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Contraindicações</h4>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {packageDetails.contraindications.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="pt-4 flex justify-center">
        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          Baixar Relatório Completo
        </Button>
      </div>
    </div>
  );
};

export default PackageDetailsPanel;
