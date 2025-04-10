import React, { useState, useRef, useEffect } from 'react';
import { ExamResult, Nutraceutical, Pet, Recommendation, Message } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Download, BookOpen, ArrowUpRight, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { EnhancedExam, EnhancedExamValue, enhanceExams } from '@/services/examEnhancer';
import { askVeterinaryAI } from '@/services/openai';

interface EnhancedExamViewerProps {
  pet: Pet | null;
  exams: ExamResult[];
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
}

const EnhancedExamViewer: React.FC<EnhancedExamViewerProps> = ({ 
  pet,
  exams,
  recommendation,
  nutraceutical
}) => {
  const [enhancedExams, setEnhancedExams] = useState<EnhancedExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<EnhancedExam | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [chartParameters, setChartParameters] = useState<string[]>([]);
  const [selectedParam, setSelectedParam] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);

  // Processar exames com dados enriquecidos
  useEffect(() => {
    if (exams.length > 0) {
      const enriched = enhanceExams(exams, nutraceutical.condition);
      setEnhancedExams(enriched);
      
      // Selecionar o exame mais recente por padrão
      setSelectedExam(enriched[enriched.length - 1]);
      
      // Extrair parâmetros disponíveis para o gráfico
      const params = Object.keys(enriched[0].results);
      setChartParameters(params);
      if (params.length > 0) {
        // Tentar encontrar um parâmetro relevante automaticamente
        const relevantParams = ['hemoglobina', 'leucócitos', 'plaquetas', 'vitamina_d', 'cálcio'];
        const found = params.find(p => 
          relevantParams.some(rp => p.toLowerCase().includes(rp.toLowerCase()))
        );
        setSelectedParam(found || params[0]);
      }
    }
  }, [exams, nutraceutical.condition]);

  // Rolar o chat para baixo quando houver novas mensagens
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Preparar dados para o gráfico
  const prepareChartData = () => {
    if (selectedParam && enhancedExams.length > 0) {
      return enhancedExams.map(exam => {
        // Obter referência para o parâmetro selecionado
        const enhanced = exam.enhancedResults[selectedParam];
        let refMin = enhanced?.referenceMin;
        let refMax = enhanced?.referenceMax;
        
        return {
          date: exam.date,
          value: exam.results[selectedParam],
          normalized: enhanced?.value,
          refMin,
          refMax,
          avg: refMin && refMax ? (refMin + refMax) / 2 : undefined,
          treatmentStart: recommendation.startDate === exam.date,
        };
      });
    }
    return [];
  };

  // Enviar pergunta para a IA
  const handleAIQuestion = async () => {
    if (!aiQuestion.trim() || !pet) return;
    
    const userQuestion = aiQuestion.trim();
    setAiQuestion("");
    setAiIsTyping(true);
    
    // Adicionar pergunta ao histórico
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userQuestion }
    ];
    setConversationHistory(updatedHistory);
    
    try {
      const response = await askVeterinaryAI(
        userQuestion,
        pet,
        nutraceutical,
        recommendation,
        exams,
        updatedHistory
      );
      
      // Adicionar resposta ao histórico
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant' as const, content: response.answer }
      ]);
    } catch (error) {
      // Adicionar mensagem de erro ao histórico
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant' as const, content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.' }
      ]);
      console.error('Erro ao consultar IA:', error);
    } finally {
      setAiIsTyping(false);
    }
  };

  // Gerar PDF com relatório de exames e recomendações
  const generatePDF = () => {
    alert("Relatório PDF seria gerado aqui em um ambiente de produção.");
  };

  // Renderizar indicador de status
  const renderStatusIndicator = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Elevado</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Baixo</Badge>;
      case 'critical-high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Crítico Alto</Badge>;
      case 'critical-low':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Crítico Baixo</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // Renderizar indicador de tendência
  const renderTrendIndicator = (trend?: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={16} className="text-amber-600" />;
      case 'decreasing':
        return <TrendingDown size={16} className="text-blue-600" />;
      case 'stable':
      default:
        return <Minus size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Exames e Análise Clínica</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={generatePDF}
        >
          <Download size={16} />
          Exportar PDF
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="ai">Consulta IA</TabsTrigger>
        </TabsList>
        
        {/* VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-4">
          {exams.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-md">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="text-gray-700 mb-2">Este paciente não possui exames registrados.</p>
            </div>
          ) : (
            <>
              {/* Gráfico de histórico do parâmetro selecionado */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Evolução do Parâmetro Selecionado</h4>
                  <select 
                    className="text-sm border rounded-md p-1" 
                    value={selectedParam}
                    onChange={(e) => setSelectedParam(e.target.value)}
                  >
                    {chartParameters.map(param => (
                      <option key={param} value={param}>{param}</option>
                    ))}
                  </select>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'value') return [value, selectedParam];
                          if (name === 'refMin') return [value, "Mínimo de referência"];
                          if (name === 'refMax') return [value, "Máximo de referência"];
                          return [value, name];
                        }}
                      />
                      
                      {/* Linha para valor mínimo de referência */}
                      {prepareChartData()[0]?.refMin && (
                        <ReferenceLine 
                          y={prepareChartData()[0].refMin} 
                          stroke="#8884d8" 
                          strokeDasharray="3 3"
                        >
                          <Label value="Min" position="insideBottomLeft" />
                        </ReferenceLine>
                      )}
                      
                      {/* Linha para valor máximo de referência */}
                      {prepareChartData()[0]?.refMax && (
                        <ReferenceLine 
                          y={prepareChartData()[0].refMax} 
                          stroke="#8884d8" 
                          strokeDasharray="3 3"
                        >
                          <Label value="Max" position="insideTopLeft" />
                        </ReferenceLine>
                      )}
                      
                      {/* Linha que marca o início do tratamento */}
                      <ReferenceLine 
                        x={recommendation.startDate} 
                        stroke="green" 
                        label={{ value: 'Início do tratamento', position: 'top' }} 
                      />
                      
                      {/* Linha principal de valores */}
                      <Line 
                        type="monotone" 
                        dataKey="normalized" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {selectedExam?.enhancedResults[selectedParam]?.referenceMin && 
                   selectedExam?.enhancedResults[selectedParam]?.referenceMax && (
                    <>Faixa de referência: {selectedExam.enhancedResults[selectedParam].referenceMin} - {selectedExam.enhancedResults[selectedParam].referenceMax} {selectedExam.enhancedResults[selectedParam].unit}</>
                  )}
                </p>
              </div>
              
              {/* Informações do exame mais recente */}
              {selectedExam && (
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Exame Mais Recente ({selectedExam.date})</h4>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {selectedExam.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Resultados detalhados */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Resultados:</h5>
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(selectedExam.enhancedResults).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-1.5">
                                {renderTrendIndicator(value.trend)}
                                <span className="font-medium">{key}:</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>{value.value} {value.unit}</span>
                                {renderStatusIndicator(value.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Interpretação e recomendações */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Interpretação e Recomendações:</h5>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-sm whitespace-pre-line">{selectedExam.interpretation}</p>
                        
                        {selectedExam.recommendations && selectedExam.recommendations.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-xs font-medium mb-1">Recomendações:</h6>
                            <ul className="list-disc list-inside text-xs space-y-1">
                              {selectedExam.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Estudos relacionados */}
                  {selectedExam.relatedStudies && selectedExam.relatedStudies.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Estudos Científicos Relacionados:</h5>
                      <div className="bg-blue-50 p-3 rounded-md">
                        {selectedExam.relatedStudies.map((study, idx) => (
                          <div key={idx} className="flex items-start gap-2 mb-2 last:mb-0">
                            <BookOpen size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <a 
                                href={study.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                {study.title}
                                <ArrowUpRight size={14} className="ml-1" />
                              </a>
                              <p className="text-xs text-gray-600 mt-0.5">{study.relevance}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        {/* HISTÓRICO DE EXAMES */}
        <TabsContent value="history">
          {exams.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-md">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="text-gray-700 mb-2">Este paciente não possui histórico de exames.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {enhancedExams.map((exam) => (
                  <div key={exam.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{exam.type}</h4>
                        <p className="text-sm text-gray-500">{exam.date}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Realizado</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(exam.enhancedResults).map(([key, value]) => (
                        <div key={key} className="text-sm flex justify-between items-center">
                          <span className="text-gray-700">{key}: </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{value.value} {value.unit}</span>
                            {value.status !== 'normal' && renderStatusIndicator(value.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {exam.notes && (
                      <div className="mt-3 text-sm bg-amber-50 p-2 rounded">
                        <span className="font-medium">Observações: </span>
                        {exam.notes}
                      </div>
                    )}
                    
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <p className="whitespace-pre-line">{exam.interpretation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        {/* CONSULTA IA */}
        <TabsContent value="ai" className="h-[550px] flex flex-col">
          <div className="flex-1 bg-slate-50 rounded-md p-4 mb-4 overflow-y-auto" ref={chatRef}>
            <div className="space-y-4">
              <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                <p className="text-sm">
                  Olá, sou seu assistente veterinário especializado em nutracêuticos. Como posso ajudar com a recomendação de {nutraceutical.name} para {nutraceutical.condition}?
                </p>
              </div>
              
              {conversationHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-md ${
                    msg.role === 'user'
                      ? 'bg-white max-w-[80%] ml-auto'
                      : 'bg-primary/10 max-w-[80%]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              ))}
              
              {aiIsTyping && (
                <div className="bg-primary/10 p-3 rounded-md max-w-[80%]">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Digite sua pergunta sobre este caso..." 
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
              {aiIsTyping ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Enviar
            </Button>
          </div>
          
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Perguntas sugeridas:
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                "Qual a eficácia desse tratamento?",
                "Como interpretar essa alteração no exame?",
                "Existe alguma contraindicação?",
                "Por quanto tempo manter o tratamento?"
              ].map((q, i) => (
                <Button 
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAiQuestion(q)}
                  disabled={aiIsTyping}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedExamViewer;
