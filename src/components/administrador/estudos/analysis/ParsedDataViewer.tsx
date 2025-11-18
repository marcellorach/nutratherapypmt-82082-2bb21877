import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Table, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParsedSection {
  title: string;
  content: string;
  element_id?: string;
}

interface ParsedTable {
  id: string;
  text: string;
  metadata?: {
    text_as_html?: string;
  };
}

interface ParsedDataViewerProps {
  studyId: string;
  analysisData: {
    fullText?: string;
    sections?: ParsedSection[];
    tables?: ParsedTable[];
    images?: string[];
    metadata?: {
      pageCount?: number;
      wordCount?: number;
      parseQuality?: number;
      extractedAt?: string;
    };
  } | null;
}

const ParsedDataViewer: React.FC<ParsedDataViewerProps> = ({ studyId, analysisData }) => {
  if (!analysisData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum dado de parsing disponível</p>
          <p className="text-sm text-muted-foreground mt-2">
            Execute o processamento para extrair dados deste estudo
          </p>
        </CardContent>
      </Card>
    );
  }

  const { sections = [], tables = [], images = [], metadata = {}, fullText = '' } = analysisData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dados Extraídos do Documento
        </CardTitle>
        <CardDescription>
          Texto, tabelas e metadados extraídos via Unstructured.io
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Metadata Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metadata.pageCount && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Páginas</p>
              <p className="text-2xl font-bold">{metadata.pageCount}</p>
            </div>
          )}
          {metadata.wordCount && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Palavras</p>
              <p className="text-2xl font-bold">{metadata.wordCount.toLocaleString()}</p>
            </div>
          )}
          {sections.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Seções</p>
              <p className="text-2xl font-bold">{sections.length}</p>
            </div>
          )}
          {tables.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tabelas</p>
              <p className="text-2xl font-bold">{tables.length}</p>
            </div>
          )}
        </div>

        {metadata.parseQuality !== undefined && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Qualidade do Parsing</span>
              <Badge variant={metadata.parseQuality > 80 ? "default" : "secondary"}>
                {metadata.parseQuality}%
              </Badge>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${metadata.parseQuality}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs for different data types */}
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">
              <FileText className="h-4 w-4 mr-2" />
              Seções ({sections.length})
            </TabsTrigger>
            <TabsTrigger value="tables">
              <Table className="h-4 w-4 mr-2" />
              Tabelas ({tables.length})
            </TabsTrigger>
            <TabsTrigger value="fulltext">
              <FileText className="h-4 w-4 mr-2" />
              Texto Completo
            </TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {sections.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma seção identificada
                </p>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {section.content.substring(0, 500)}
                          {section.content.length > 500 && '...'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {tables.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma tabela identificada
                </p>
              ) : (
                <div className="space-y-4">
                  {tables.map((table, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tabela {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm overflow-x-auto">
                          {table.metadata?.text_as_html ? (
                            <div dangerouslySetInnerHTML={{ __html: table.metadata.text_as_html }} />
                          ) : (
                            <pre className="whitespace-pre-wrap text-muted-foreground">
                              {table.text}
                            </pre>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Full Text Tab */}
          <TabsContent value="fulltext" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {fullText || 'Texto completo não disponível'}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {metadata.extractedAt && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Extraído em {new Date(metadata.extractedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ParsedDataViewer;
