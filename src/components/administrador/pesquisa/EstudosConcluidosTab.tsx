
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, FileText } from "lucide-react";

// Mock data para estudos concluídos
const mockEstudos = [
  {
    id: "1",
    titulo: "Efeitos do óleo de krill em cães com artrite",
    conclusao: "12/12/2024",
    participantes: 72,
    eficacia: 84,
    publicado: true,
    tags: ["Artrite", "Omega-3", "Sênior"],
    resumo: "O estudo demonstrou que a suplementação com óleo de krill por 6 meses reduziu significativamente os marcadores inflamatórios e melhorou a mobilidade em cães com artrite moderada a severa. A dosagem de 2mg/kg/dia mostrou-se a mais eficaz com mínimos efeitos colaterais.",
    resultadosTemporais: [
      { mes: 0, controle: 5.2, tratamento: 5.1 },
      { mes: 1, controle: 5.3, tratamento: 5.8 },
      { mes: 2, controle: 5.1, tratamento: 6.3 },
      { mes: 3, controle: 5.2, tratamento: 6.8 },
      { mes: 4, controle: 5.0, tratamento: 7.2 },
      { mes: 5, controle: 5.1, tratamento: 7.7 },
      { mes: 6, controle: 5.0, tratamento: 8.0 }
    ],
    beneficios: [
      { name: "Redução de inflamação", value: 86 },
      { name: "Melhora mobilidade", value: 78 },
      { name: "Efeitos adversos", value: 12 },
      { name: "Qualidade de vida", value: 82 }
    ]
  },
  {
    id: "2",
    titulo: "Prebióticos e saúde digestiva em filhotes",
    conclusao: "05/10/2024",
    participantes: 60,
    eficacia: 76,
    publicado: true,
    tags: ["Filhotes", "Digestão", "Microbioma"],
    resumo: "O estudo avaliou a eficácia de prebióticos (FOS e MOS) na saúde digestiva de filhotes durante o período de desmame. Os resultados indicam um aumento significativo da diversidade microbiana intestinal e redução de patógenos oportunistas. Houve melhora na consistência fecal e redução de episódios de diarreia em 65% comparado ao grupo controle.",
    resultadosTemporais: [
      { mes: 0, controle: 4.8, tratamento: 4.9 },
      { mes: 1, controle: 5.0, tratamento: 5.9 },
      { mes: 2, controle: 5.1, tratamento: 6.5 },
      { mes: 3, controle: 5.2, tratamento: 7.2 }
    ],
    beneficios: [
      { name: "Diversidade microbioma", value: 85 },
      { name: "Redução patógenos", value: 72 },
      { name: "Consistência fecal", value: 76 },
      { name: "Episódios diarreia", value: 65 }
    ]
  },
  {
    id: "3",
    titulo: "Antioxidantes e função cognitiva em cães idosos",
    conclusao: "27/08/2024",
    participantes: 48,
    eficacia: 62,
    publicado: false,
    tags: ["Cognitivo", "Sênior", "Antioxidantes"],
    resumo: "Este estudo investigou os efeitos de uma combinação de antioxidantes (vitamina E, resveratrol e ácido alfa-lipóico) na função cognitiva de cães acima de 10 anos de idade. Foram observadas melhoras moderadas em testes cognitivos e aprendizado, embora os resultados variem significativamente entre raças e indivíduos. Em análise post-hoc, notou-se maior benefício em cães de tamanho médio comparados a cães pequenos ou grandes.",
    resultadosTemporais: [
      { mes: 0, controle: 6.2, tratamento: 6.1 },
      { mes: 2, controle: 6.1, tratamento: 6.8 },
      { mes: 4, controle: 5.9, tratamento: 7.0 },
      { mes: 6, controle: 5.8, tratamento: 7.2 },
      { mes: 8, controle: 5.7, tratamento: 7.1 }
    ],
    beneficios: [
      { name: "Função cognitiva", value: 62 },
      { name: "Memória", value: 58 },
      { name: "Aprendizado", value: 65 },
      { name: "Comportamento", value: 53 }
    ]
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const EstudosConcluidosTab: React.FC = () => {
  const [selectedEstudo, setSelectedEstudo] = useState(mockEstudos[0]);
  const [activeTab, setActiveTab] = useState('resultados');
  
  const handleDownload = () => {
    alert("Download do relatório completo iniciado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estudos Concluídos</h2>
        <p className="text-muted-foreground">
          Acesse os resultados finais e relatórios dos estudos científicos concluídos.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {mockEstudos.map((estudo) => (
            <Card 
              key={estudo.id}
              className={`cursor-pointer transition-colors ${
                selectedEstudo.id === estudo.id ? 'border-primary' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedEstudo(estudo)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-md">{estudo.titulo}</CardTitle>
                  {estudo.publicado && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">Publicado</Badge>
                  )}
                </div>
                <CardDescription>Concluído em {estudo.conclusao}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2 mt-1">
                  {estudo.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                  <span>{estudo.participantes} participantes</span>
                  <span>Eficácia: {estudo.eficacia}%</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedEstudo.titulo}</CardTitle>
                <CardDescription>
                  {selectedEstudo.participantes} participantes • Concluído em {selectedEstudo.conclusao}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Relatório Completo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="resultados">
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Resultados
                </TabsTrigger>
                <TabsTrigger value="beneficios">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Benefícios
                </TabsTrigger>
                <TabsTrigger value="resumo">
                  <FileText className="mr-2 h-4 w-4" />
                  Resumo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="resultados" className="pt-2">
                <ChartContainer className="h-[300px]" config={{
                  controle: { color: "#cbd5e1" }, 
                  tratamento: { color: "#3b82f6" }
                }}>
                  <LineChart data={selectedEstudo.resultadosTemporais}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="mes" 
                      label={{ 
                        value: 'Meses de tratamento', 
                        position: 'insideBottom', 
                        offset: -5 
                      }} 
                    />
                    <YAxis 
                      label={{ 
                        value: 'Pontuação', 
                        angle: -90, 
                        position: 'insideLeft' 
                      }} 
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="controle" 
                      name="Grupo Controle" 
                      stroke="var(--color-controle)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tratamento" 
                      name="Grupo Tratamento" 
                      stroke="var(--color-tratamento)" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                    />
                  </LineChart>
                </ChartContainer>
              </TabsContent>
              
              <TabsContent value="beneficios" className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartContainer 
                    className="h-[300px]" 
                    config={{
                      value: { color: "#0088FE" },
                      redução: { color: "#0088FE" },
                      melhora: { color: "#00C49F" },
                      efeitos: { color: "#FFBB28" },
                      qualidade: { color: "#FF8042" }
                    }}
                  >
                    <BarChart data={selectedEstudo.beneficios} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Eficácia (%)">
                        {selectedEstudo.beneficios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  
                  <ChartContainer 
                    className="h-[300px]" 
                    config={{
                      value: { color: "#0088FE" },
                      redução: { color: "#0088FE" },
                      melhora: { color: "#00C49F" },
                      efeitos: { color: "#FFBB28" },
                      qualidade: { color: "#FF8042" }
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={selectedEstudo.beneficios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {selectedEstudo.beneficios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="resumo" className="pt-2">
                <div className="prose max-w-none">
                  <p className="text-sm leading-relaxed">{selectedEstudo.resumo}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstudosConcluidosTab;
