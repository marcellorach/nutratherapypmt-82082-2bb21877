
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data para os estudos em andamento
const mockEstudos = [
  {
    id: "1",
    titulo: "Glucosamina para mobilidade articular",
    inicio: "02/01/2025",
    progresso: 68,
    totalParticipantes: 60,
    participantesAtivos: 58,
    grupoControle: 29,
    grupoTratamento: 29,
    marcadoresBiologicos: [
      { nome: "Proteína C-reativa", controle: 2.8, tratamento: 1.2 },
      { nome: "Interleucina-6", controle: 4.5, tratamento: 2.1 },
      { nome: "TNF-alpha", controle: 32, tratamento: 18 }
    ],
    questionarios: [
      { pergunta: "Mobilidade", controle: 5.6, tratamento: 7.8 },
      { pergunta: "Disposição", controle: 6.2, tratamento: 8.1 },
      { pergunta: "Qualidade de vida", controle: 5.9, tratamento: 7.5 }
    ]
  },
  {
    id: "2",
    titulo: "Probióticos e imunidade intestinal",
    inicio: "15/03/2025",
    progresso: 42,
    totalParticipantes: 80,
    participantesAtivos: 75,
    grupoControle: 38,
    grupoTratamento: 37,
    marcadoresBiologicos: [
      { nome: "IgA fecal", controle: 0.8, tratamento: 1.4 },
      { nome: "Calprotectina", controle: 48, tratamento: 28 },
      { nome: "Diversidade microbioma", controle: 2.8, tratamento: 4.2 }
    ],
    questionarios: [
      { pergunta: "Regularidade intestinal", controle: 5.2, tratamento: 8.4 },
      { pergunta: "Comportamento alimentar", controle: 6.0, tratamento: 7.2 },
      { pergunta: "Conforto digestivo", controle: 5.5, tratamento: 8.6 }
    ]
  }
];

const EstudoBox: React.FC<{ 
  estudo: any,
  isActive: boolean,
  onClick: () => void
}> = ({ estudo, isActive, onClick }) => (
  <Card 
    className={`cursor-pointer transition-all ${
      isActive ? 'border-primary' : 'hover:border-primary/50'
    }`}
    onClick={onClick}
  >
    <CardHeader className="pb-2">
      <CardTitle className="text-md">{estudo.titulo}</CardTitle>
      <CardDescription>Início: {estudo.inicio}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso</span>
          <span className="font-medium">{estudo.progresso}%</span>
        </div>
        <Progress value={estudo.progresso} className="h-2" />
      </div>
    </CardContent>
  </Card>
);

const ParticipantsVisual: React.FC<{ 
  totalParticipantes: number, 
  grupoControle: number, 
  grupoTratamento: number 
}> = ({ totalParticipantes, grupoControle, grupoTratamento }) => {
  const allParticipants = Array.from({ length: totalParticipantes }, (_, i) => ({
    id: i + 1,
    grupo: i < grupoControle ? 'controle' : 'tratamento'
  }));
  
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-medium mb-3">Participantes do Estudo</h3>
      <div className="flex flex-wrap gap-1 justify-center">
        {allParticipants.map((p) => (
          <div 
            key={p.id} 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
              p.grupo === 'controle' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-amber-100 text-amber-800'
            }`}
            title={`Participante #${p.id} - Grupo ${p.grupo === 'controle' ? 'Placebo' : 'Tratamento'}`}
          >
            {p.id <= 9 ? p.id : ''}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-100 rounded-full mr-2"></div>
          <span className="text-xs">Placebo ({grupoControle})</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-100 rounded-full mr-2"></div>
          <span className="text-xs">Tratamento ({grupoTratamento})</span>
        </div>
      </div>
    </div>
  );
};

const ResultadosChart: React.FC<{ data: any[], dataKey: string }> = ({ data, dataKey }) => (
  <ChartContainer className="h-[300px]" config={{
    controle: { color: "#bfdbfe" }, 
    tratamento: { color: "#fef3c7" }
  }}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
      <XAxis 
        dataKey="nome" 
        angle={-45} 
        textAnchor="end" 
        height={70}
        tick={{ fontSize: 12 }} 
      />
      <YAxis />
      <Tooltip content={<ChartTooltipContent />} />
      <Legend />
      <Bar dataKey="controle" name="Grupo Controle" fill="var(--color-controle)" />
      <Bar dataKey="tratamento" name="Grupo Tratamento" fill="var(--color-tratamento)" />
    </BarChart>
  </ChartContainer>
);

const EstudosAndamentoTab: React.FC = () => {
  const [estudioAtivo, setEstudioAtivo] = useState(mockEstudos[0]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estudos em Andamento</h2>
        <p className="text-muted-foreground">
          Acompanhe os estudos científicos em execução e seus resultados parciais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium">Selecione um Estudo</h3>
          {mockEstudos.map(estudo => (
            <EstudoBox 
              key={estudo.id} 
              estudo={estudo} 
              isActive={estudioAtivo.id === estudo.id}
              onClick={() => setEstudioAtivo(estudo)} 
            />
          ))}
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{estudioAtivo.titulo}</CardTitle>
              <CardDescription>
                Início: {estudioAtivo.inicio} • 
                Participantes: {estudioAtivo.participantesAtivos}/{estudioAtivo.totalParticipantes}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ParticipantsVisual 
                  totalParticipantes={estudioAtivo.totalParticipantes}
                  grupoControle={estudioAtivo.grupoControle}
                  grupoTratamento={estudioAtivo.grupoTratamento}
                />

                <Tabs defaultValue="marcadores">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="marcadores">Marcadores Biológicos</TabsTrigger>
                    <TabsTrigger value="questionarios">Questionários</TabsTrigger>
                  </TabsList>
                  <TabsContent value="marcadores" className="pt-4">
                    <ResultadosChart 
                      data={estudioAtivo.marcadoresBiologicos} 
                      dataKey="nome"
                    />
                  </TabsContent>
                  <TabsContent value="questionarios" className="pt-4">
                    <ResultadosChart 
                      data={estudioAtivo.questionarios} 
                      dataKey="pergunta"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EstudosAndamentoTab;
