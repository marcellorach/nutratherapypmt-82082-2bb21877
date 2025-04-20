
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, ChartBar, CircleCheck } from "lucide-react";
import { Nutraceutical } from "@/types";

interface ScientificTabProps {
  nutraceutical: Nutraceutical;
}

export const ScientificTab: React.FC<ScientificTabProps> = ({ nutraceutical }) => {
  return (
    <div className="space-y-4">
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
        <ScoreCard
          icon={<ChartBar className="h-5 w-5 text-blue-500" />}
          title="Eficácia"
          score={nutraceutical.scientificEvidence.efficacyScore}
          description="Baseado em estudos clínicos e análises sistemáticas"
        />
        <ScoreCard
          icon={<CircleCheck className="h-5 w-5 text-green-500" />}
          title="Sustentação"
          score={nutraceutical.scientificEvidence.sustainabilityScore}
          description="Consistência dos resultados ao longo do tempo"
        />
      </section>
    </div>
  );
};

interface ScoreCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  description: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ icon, title, score, description }) => (
  <div className="border rounded-md p-4 bg-white">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="font-medium">{title}</h4>
    </div>
    <div className="flex items-center">
      <div className="text-2xl font-bold mr-3">{score.toFixed(1)}</div>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span 
            key={i}
            className={`text-lg ${i < Math.floor(score) ? "text-amber-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
    <p className="text-sm text-gray-500 mt-2">{description}</p>
  </div>
);
