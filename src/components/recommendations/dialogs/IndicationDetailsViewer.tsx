
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, CheckCircle2, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { Recommendation, Nutraceutical, ExamResult } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface IndicationDetailsViewerProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
  isApproved: boolean;
  onApprove: () => void;
  petExams: ExamResult[];
}

const IndicationDetailsViewer: React.FC<IndicationDetailsViewerProps> = ({ 
  recommendation, 
  nutraceutical, 
  isApproved, 
  onApprove,
  petExams
}) => {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [examRequestSent, setExamRequestSent] = useState(false);
  const { toast } = useToast();
  
  // Transformar dados de exames para formato do gráfico
  const prepareExamChartData = () => {
    // Ordenar exames por data
    const sortedExams = [...petExams].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Extrair valores relevantes para o gráfico
    return sortedExams.map(exam => {
      const values = Object.entries(exam.results).reduce((acc, [key, value]) => {
        // Converter valores como "10 mg/dL" para números quando possível
        const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(numericValue)) {
          acc[key] = numericValue;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return {
        date: exam.date,
        ...values
      };
    });
  };
  
  const examChartData = prepareExamChartData();

  const handleRequestExams = () => {
    setExamRequestSent(true);
    toast({
      title: "Exames solicitados",
      description: "As solicitações de exames foram enviadas para o tutor do pet.",
      variant: "default",
    });
  };
  
  const handleAIQuestion = () => {
    if (!aiQuestion.trim()) return;
    
    setAiIsTyping(true);
    
    // Simular resposta da IA após um pequeno delay
    setTimeout(() => {
      const responses = [
        `De acordo com estudos recentes, ${nutraceutical.name} demonstrou eficácia significativa para ${nutraceutical.condition}, especialmente quando administrado nas doses recomendadas. Os resultados mostram melhora em aproximadamente 78% dos casos após 6-8 semanas de uso contínuo.`,
        `A combinação dos ingredientes ativos em ${nutraceutical.name} demonstra sinergia particularmente eficaz para ${nutraceutical.condition}. Os estudos indicam que a eficácia é otimizada quando utilizado em conjunto com uma dieta balanceada.`,
        `Para ${nutraceutical.condition}, o protocolo recomendado de ${nutraceutical.name} baseia-se em evidências de nível 2 (estudos clínicos controlados). A sustentação do efeito terapêutico é de aproximadamente 85% após 3 meses de uso contínuo.`,
        `As contraindicações principais de ${nutraceutical.name} são raras (menos de 3% dos casos), mas incluem hipersensibilidade a qualquer um dos componentes ativos. É sempre recomendável monitoramento periódico durante o tratamento.`
      ];
      
      setAiResponse(responses[Math.floor(Math.random() * responses.length)]);
      setAiIsTyping(false);
    }, 1500);
  };

  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Informações Científicas</TabsTrigger>
        <TabsTrigger value="exams">Exames ({petExams.length})</TabsTrigger>
        <TabsTrigger value="ai">Consulta IA</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Motivo da recomendação</h4>
          <p className="bg-slate-50 p-3 rounded-md">{recommendation.reason}</p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Base científica</h4>
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex gap-2 mb-2">
              <Badge variant="outline">Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5</Badge>
              <Badge variant="outline">Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5</Badge>
            </div>
            
            <div className="space-y-2">
              {nutraceutical.scientificEvidence.studies.map((study, i) => (
                <div key={i} className="text-sm">
                  <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    {study.title} ({study.year})
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Contraindicações</h4>
          <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-md">
            {nutraceutical.contraindications.map((c, i) => (
              <li key={i} className="text-sm">{c}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <Button 
            className={`flex items-center gap-1 border ${isApproved 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"}`}
            onClick={onApprove}
            disabled={isApproved}
          >
            {isApproved ? <CheckCircle2 size={16} /> : <ThumbsUp size={16} />}
            {isApproved ? "Já aprovado" : "Aprovar recomendação"}
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="exams">
        {petExams.length > 0 ? (
          <div className="space-y-4">
            <div className="h-64 mb-4">
              <h4 className="font-medium mb-2">Histórico de exames</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={examChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="top" align="center" />
                  {Object.keys(examChartData[0] || {}).filter(key => key !== 'date').map((dataKey, index) => (
                    <Line
                      key={dataKey}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={`hsl(${index * 30}, 70%, 50%)`}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {petExams.map((exam) => (
              <div key={exam.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{exam.type}</h4>
                    <p className="text-sm text-gray-500">{exam.date}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Realizado</Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Object.entries(exam.results).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{key}: </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                
                {exam.notes && (
                  <div className="mt-4 text-sm bg-amber-50 p-2 rounded">
                    <span className="font-medium">Observações: </span>
                    {exam.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-md">
            <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-gray-700 mb-2">Este paciente não possui exames registrados.</p>
            <Button 
              className="mt-2"
              onClick={handleRequestExams}
              disabled={examRequestSent}
            >
              {examRequestSent ? "Exames solicitados" : "Solicitar exames"}
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="ai">
        <div className="h-[400px] flex flex-col">
          <div className="flex-1 bg-slate-50 rounded-md p-4 mb-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                <p className="text-sm">
                  Como posso ajudar com a recomendação de {nutraceutical.name} para {nutraceutical.condition}?
                </p>
              </div>
              
              {(aiQuestion || aiResponse) && (
                <div className="bg-white p-3 rounded-md max-w-[80%] ml-auto">
                  <p className="text-sm">
                    {aiQuestion}
                  </p>
                </div>
              )}
              
              {aiIsTyping && (
                <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </div>
                </div>
              )}
              
              {aiResponse && (
                <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                  <p className="text-sm">
                    {aiResponse}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Digite sua pergunta..." 
              className="flex-1 border rounded-md p-2"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAIQuestion()}
            />
            <Button 
              type="button" 
              onClick={handleAIQuestion}
              disabled={aiIsTyping || !aiQuestion.trim()}
            >
              <MessageSquare size={16} className="mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default IndicationDetailsViewer;
