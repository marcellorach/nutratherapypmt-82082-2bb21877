
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Database, Settings, Microscope, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nutraceuticals } from '@/data/mockData';
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';

const AdministradorPage: React.FC = () => {
  // Dados para o gráfico
  const efficacyData = nutraceuticals.map(item => ({
    name: item.name,
    score: item.scientificEvidence.score,
    contraindications: item.contraindications.length
  }));
  
  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
            <p className="text-gray-600">Gerencie nutracêuticos, correlações e prompts da IA</p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="nutraceuticos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nutraceuticos">Nutracêuticos</TabsTrigger>
            <TabsTrigger value="estudos">Estudos Científicos</TabsTrigger>
            <TabsTrigger value="prompts">Prompts da IA</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nutraceuticos">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Catálogo de Nutracêuticos</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Nutracêutico
              </Button>
            </div>
            
            <div className="bg-white rounded-md shadow">
              <div className="p-4 border-b">
                <Input placeholder="Buscar nutracêutico..." />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Evidência</TableHead>
                    <TableHead>Contraindicações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nutraceuticals.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell>{item.scientificEvidence.score}/5</TableCell>
                      <TableCell>{item.contraindications.length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="estudos">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Estudos Científicos</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Estudo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Journal of Veterinary Medicine, 2023</CardTitle>
                  <CardDescription>Estudo sobre ômega 3 e 6 em cães</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fundamentação:</span>
                      <span className="text-sm">4.5/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Eficiência:</span>
                      <span className="text-sm">4.2/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Constância:</span>
                      <span className="text-sm">4.0/5</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      <Microscope className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Animal Care Journal, 2023</CardTitle>
                  <CardDescription>Eficácia de glucosamina em cães idosos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fundamentação:</span>
                      <span className="text-sm">4.3/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Eficiência:</span>
                      <span className="text-sm">4.1/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Constância:</span>
                      <span className="text-sm">3.8/5</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      <Microscope className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <Plus className="h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-2">Adicionar novo estudo</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="prompts">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Prompts da IA</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Prompt
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Análise de Exames
                  </CardTitle>
                  <CardDescription>Prompt para análise de resultados de exames</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-md mb-4 h-40 overflow-y-auto">
                    <p className="text-sm font-mono text-gray-700">
                      Você é um assistente veterinário especializado em interpretar exames de sangue de pets.
                      Analise os seguintes valores do exame e identifique possíveis deficiências nutricionais,
                      recomendando nutracêuticos específicos do nosso catálogo para corrigir essas deficiências.
                      Considere a raça, idade e peso do animal...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Testar</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Recomendação Preventiva
                  </CardTitle>
                  <CardDescription>Prompt para prevenção por raças</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-md mb-4 h-40 overflow-y-auto">
                    <p className="text-sm font-mono text-gray-700">
                      Você é um especialista em medicina preventiva veterinária.
                      Com base na raça, idade e peso do animal, identifique as doenças
                      degenerativas mais comuns para este perfil e recomende nutracêuticos
                      do nosso catálogo que possam prevenir estas condições...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="outline" size="sm">Testar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Eficácia Comparativa</CardTitle>
                  <CardDescription>Análise da eficácia dos nutracêuticos em relação às suas contraindicações</CardDescription>
                </CardHeader>
                <CardContent>
                  <NutraceuticalEfficacy data={efficacyData} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Correlação com Doenças</CardTitle>
                  <CardDescription>Eficácia dos nutracêuticos em diferentes condições</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <Database className="h-16 w-16 text-gray-300" />
                    <p className="text-gray-500 text-center ml-4">
                      Gráfico de correlação (a implementar)
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Adoção por Raças</CardTitle>
                  <CardDescription>Distribuição de prescrições por raças</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <Database className="h-16 w-16 text-gray-300" />
                    <p className="text-gray-500 text-center ml-4">
                      Gráfico de distribuição (a implementar)
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Feedback dos Tutores</CardTitle>
                  <CardDescription>Avaliações de eficácia pelos tutores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <Database className="h-16 w-16 text-gray-300" />
                    <p className="text-gray-500 text-center ml-4">
                      Gráfico de avaliações (a implementar)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdministradorPage;
