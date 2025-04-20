
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink,
  FileText, 
  BookOpen, 
  ChartBar,
  CircleCheck
} from "lucide-react";
import { Nutraceutical } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface NutraceuticoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: Nutraceutical | null;
}

const NutraceuticoDetailDialog: React.FC<NutraceuticoDetailDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!nutraceutical) return null;

  const getEfficacyColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-50";
    if (score >= 3) return "text-amber-600 bg-amber-50"; 
    return "text-red-600 bg-red-50";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <Badge variant="outline" className={getEfficacyColor(nutraceutical.scientificEvidence.efficacyScore)}>
              Eficácia: {nutraceutical.scientificEvidence.efficacyScore.toFixed(1)}/5
            </Badge>
            <Badge variant="outline" className="bg-slate-50">
              {nutraceutical.condition}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{nutraceutical.name}</DialogTitle>
          <DialogDescription>
            {nutraceutical.description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="scientific">Evidências Científicas</TabsTrigger>
            <TabsTrigger value="ingredients">Princípios Ativos</TabsTrigger>
            <TabsTrigger value="usage">Uso e Dosagem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <section>
              <h4 className="text-sm font-medium mb-2">Benefícios</h4>
              <ul className="list-disc pl-5 space-y-1">
                {nutraceutical.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm">{benefit}</li>
                ))}
              </ul>
            </section>
            
            <section>
              <h4 className="text-sm font-medium mb-2">Para qual condição é indicado</h4>
              <p className="text-sm bg-slate-50 p-3 rounded-md border">
                {nutraceutical.condition}
              </p>
            </section>
            
            <section>
              <h4 className="text-sm font-medium mb-2">Contraindicações</h4>
              <ul className="list-disc pl-5 space-y-1">
                {nutraceutical.contraindications.map((contraindication, index) => (
                  <li key={index} className="text-sm">{contraindication}</li>
                ))}
              </ul>
            </section>
          </TabsContent>
          
          <TabsContent value="scientific" className="space-y-4">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Estudos Científicos</h4>
                <Badge variant="outline" className="bg-slate-50">
                  {nutraceutical.scientificEvidence.studies.length} {nutraceutical.scientificEvidence.studies.length === 1 ? 'estudo' : 'estudos'}
                </Badge>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead className="w-24 text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutraceutical.scientificEvidence.studies.map((study, index) => (
                      <TableRow key={index}>
                        <TableCell>{study.title}</TableCell>
                        <TableCell>{study.year}</TableCell>
                        <TableCell className="text-right">
                          <a 
                            href={study.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline inline-flex items-center"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <ChartBar className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Eficácia</h4>
                </div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold mr-3">{nutraceutical.scientificEvidence.efficacyScore.toFixed(1)}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i}
                        className={`text-lg ${
                          i < Math.floor(nutraceutical.scientificEvidence.efficacyScore) 
                            ? "text-amber-400" 
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Baseado em estudos clínicos e análises sistemáticas
                </p>
              </div>
              
              <div className="border rounded-md p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <CircleCheck className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Sustentação</h4>
                </div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold mr-3">{nutraceutical.scientificEvidence.sustainabilityScore.toFixed(1)}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i}
                        className={`text-lg ${
                          i < Math.floor(nutraceutical.scientificEvidence.sustainabilityScore) 
                            ? "text-amber-400" 
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Consistência dos resultados ao longo do tempo
                </p>
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="ingredients" className="space-y-4">
            <section>
              <h4 className="text-sm font-medium mb-2">Princípios Ativos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nutraceutical.activeIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-md bg-white">
                    <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                    <span>{ingredient}</span>
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h4 className="text-sm font-medium mb-2">Fórmula Química e Mecanismos de Ação</h4>
              <div className="p-4 bg-slate-50 rounded-md border text-sm">
                <p className="text-gray-500 italic">
                  Informações detalhadas sobre mecanismos moleculares estarão disponíveis em breve.
                </p>
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4">
            <section>
              <h4 className="text-sm font-medium mb-2">Dosagem Recomendada</h4>
              <p className="text-sm bg-slate-50 p-3 rounded-md border">
                {nutraceutical.dosage}
              </p>
            </section>
            
            <section>
              <h4 className="text-sm font-medium mb-2">Formas de Administração</h4>
              <div className="p-4 bg-slate-50 rounded-md border text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Adição à ração</li>
                  <li>Suplemento oral em forma de pasta</li>
                  <li>Cápsulas</li>
                  <li>Em pó para misturar com água</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h4 className="text-sm font-medium mb-2">Interações com Medicamentos</h4>
              <p className="text-sm bg-slate-50 p-3 rounded-md border text-gray-500 italic">
                Consulte um veterinário antes de combinar este nutracêutico com medicamentos convencionais.
              </p>
            </section>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar informações
            </Button>
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Ver estudos completos
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NutraceuticoDetailDialog;
