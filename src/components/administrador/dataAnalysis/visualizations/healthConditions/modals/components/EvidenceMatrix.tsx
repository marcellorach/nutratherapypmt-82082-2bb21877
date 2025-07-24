import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Search, FileText, Award, Users } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Study {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  type: 'RCT' | 'Observacional' | 'In Vitro' | 'Meta-análise';
  sampleSize: number;
  species: string;
  outcome: string;
  confidenceScore: number;
  effectSize: number;
  doi: string;
}

interface EvidenceMatrixProps {
  condition: any;
}

const EvidenceMatrix: React.FC<EvidenceMatrixProps> = ({ condition }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');

  // Estudos simulados baseados na condição
  const generateStudies = (): Study[] => {
    const isObesity = condition.name.toLowerCase().includes('obesidade');
    
    if (isObesity) {
      return [
        {
          id: 'study1',
          title: 'L-Carnitina suplementação na redução de peso corporal em cães obesos: um estudo randomizado controlado',
          authors: 'Silva, M.R. et al.',
          journal: 'Journal of Veterinary Nutrition',
          year: 2023,
          type: 'RCT',
          sampleSize: 120,
          species: 'Caninos',
          outcome: 'Redução significativa de 18% no peso corporal',
          confidenceScore: 4.8,
          effectSize: 1.8,
          doi: '10.1234/jvn.2023.04.015'
        },
        {
          id: 'study2',
          title: 'Eficácia do cromo picolinato no controle glicêmico de felinos com predisposição à obesidade',
          authors: 'Costa, A.B. et al.',
          journal: 'Veterinary Metabolism Research',
          year: 2022,
          type: 'RCT',
          sampleSize: 85,
          species: 'Felinos',
          outcome: 'Melhora de 25% na sensibilidade à insulina',
          confidenceScore: 4.5,
          effectSize: 1.6,
          doi: '10.1234/vmr.2022.09.033'
        },
        {
          id: 'study3',
          title: 'Meta-análise dos efeitos da Garcinia cambogia na prevenção do ganho de peso em pets',
          authors: 'Rodriguez, L.F. et al.',
          journal: 'Comparative Nutritional Studies',
          year: 2023,
          type: 'Meta-análise',
          sampleSize: 450,
          species: 'Caninos/Felinos',
          outcome: 'Prevenção de ganho de peso em 32% dos casos',
          confidenceScore: 4.2,
          effectSize: 1.2,
          doi: '10.1234/cns.2023.01.078'
        },
        {
          id: 'study4',
          title: 'Extrato de chá verde (EGCG) e termogênese em modelos caninos: estudo observacional longitudinal',
          authors: 'Thompson, K.J. et al.',
          journal: 'International Pet Obesity Research',
          year: 2022,
          type: 'Observacional',
          sampleSize: 200,
          species: 'Caninos',
          outcome: 'Aumento de 15% na taxa metabólica basal',
          confidenceScore: 3.8,
          effectSize: 1.1,
          doi: '10.1234/ipor.2022.11.124'
        },
        {
          id: 'study5',
          title: 'Mecanismos celulares da L-carnitina na oxidação lipídica: estudos in vitro em adipócitos',
          authors: 'Park, S.H. et al.',
          journal: 'Cellular Metabolism & Nutrition',
          year: 2021,
          type: 'In Vitro',
          sampleSize: 0,
          species: 'In Vitro',
          outcome: 'Aumento de 40% na oxidação de ácidos graxos',
          confidenceScore: 3.2,
          effectSize: 2.1,
          doi: '10.1234/cmn.2021.06.089'
        }
      ];
    } else {
      return [
        {
          id: 'study1',
          title: `Estudo controlado sobre nutracêuticos para ${condition.name} em animais de companhia`,
          authors: 'Santos, J.P. et al.',
          journal: 'Veterinary Research Journal',
          year: 2023,
          type: 'RCT',
          sampleSize: 95,
          species: 'Caninos',
          outcome: 'Melhora significativa nos sintomas',
          confidenceScore: 4.1,
          effectSize: 1.5,
          doi: '10.1234/vrj.2023.03.012'
        },
        {
          id: 'study2',
          title: `Análise longitudinal dos efeitos preventivos em ${condition.name}`,
          authors: 'Miller, R.A. et al.',
          journal: 'Comparative Medicine Review',
          year: 2022,
          type: 'Observacional',
          sampleSize: 150,
          species: 'Caninos/Felinos',
          outcome: 'Redução de 30% na incidência',
          confidenceScore: 3.7,
          effectSize: 1.3,
          doi: '10.1234/cmr.2022.08.045'
        }
      ];
    }
  };

  const studies = generateStudies();

  // Filtrar estudos
  const filteredStudies = studies.filter(study => {
    const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         study.authors.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || study.type === filterType;
    const matchesSpecies = filterSpecies === 'all' || study.species.toLowerCase().includes(filterSpecies);
    
    return matchesSearch && matchesType && matchesSpecies;
  });

  // Dados para gráfico de distribuição por tipo de estudo
  const studyTypeData = [
    { type: 'RCT', count: studies.filter(s => s.type === 'RCT').length, avgConfidence: 4.5 },
    { type: 'Meta-análise', count: studies.filter(s => s.type === 'Meta-análise').length, avgConfidence: 4.2 },
    { type: 'Observacional', count: studies.filter(s => s.type === 'Observacional').length, avgConfidence: 3.8 },
    { type: 'In Vitro', count: studies.filter(s => s.type === 'In Vitro').length, avgConfidence: 3.2 }
  ].filter(item => item.count > 0);

  const getTypeColor = (type: string) => {
    const colors = {
      'RCT': 'default',
      'Meta-análise': 'secondary',
      'Observacional': 'outline',
      'In Vitro': 'destructive'
    } as const;
    return colors[type as keyof typeof colors] || 'outline';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEffectSizeBadge = (size: number) => {
    if (size >= 1.8) return { variant: 'default' as const, text: 'Alto' };
    if (size >= 1.3) return { variant: 'secondary' as const, text: 'Moderado' };
    return { variant: 'outline' as const, text: 'Baixo' };
  };

  return (
    <div className="space-y-6">
      {/* Resumo de evidências */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{studies.length}</div>
            <p className="text-sm text-muted-foreground">Estudos Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{studies.filter(s => s.type === 'RCT').length}</div>
            <p className="text-sm text-muted-foreground">RCTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">
              {studies.reduce((sum, s) => sum + s.sampleSize, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Animais Estudados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {(studies.reduce((sum, s) => sum + s.confidenceScore, 0) / studies.length).toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Confiança Média</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por tipo de estudo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Qualidade de Evidência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de estudo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="RCT">RCT</SelectItem>
                <SelectItem value="Meta-análise">Meta-análise</SelectItem>
                <SelectItem value="Observacional">Observacional</SelectItem>
                <SelectItem value="In Vitro">In Vitro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Espécie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="caninos">Caninos</SelectItem>
                <SelectItem value="felinos">Felinos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de estudos */}
      <Card>
        <CardHeader>
          <CardTitle>Base de Evidências Científicas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Amostra</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Efeito</TableHead>
                <TableHead>Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudies.map((study) => (
                <TableRow key={study.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{study.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {study.authors} • {study.journal} ({study.year})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(study.type)}>
                      {study.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold">{study.sampleSize || '-'}</div>
                      <div className="text-xs text-muted-foreground">{study.species}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    {study.outcome}
                  </TableCell>
                  <TableCell>
                    <div className={`font-semibold ${getConfidenceColor(study.confidenceScore)}`}>
                      {study.confidenceScore.toFixed(1)}/5
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEffectSizeBadge(study.effectSize).variant}>
                      {getEffectSizeBadge(study.effectSize).text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredStudies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum estudo encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas metodológicas */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios de Avaliação da Qualidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Score de Confiança (1-5):</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>5.0:</strong> RCT duplo-cego, amostra &gt;100</li>
                <li>• <strong>4.0-4.9:</strong> RCT bem conduzido</li>
                <li>• <strong>3.0-3.9:</strong> Estudo observacional robusto</li>
                <li>• <strong>1.0-2.9:</strong> Evidência limitada</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tamanho do Efeito:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Alto (&gt;1.8):</strong> Efeito clinicamente significativo</li>
                <li>• <strong>Moderado (1.3-1.8):</strong> Efeito relevante</li>
                <li>• <strong>Baixo (&lt;1.3):</strong> Efeito limitado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvidenceMatrix;