import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, RotateCcw, Search, Layers3, AlertCircle } from 'lucide-react';

interface SystemPrompt {
  id: string;
  prompt_key: string;
  family: string;
  function_name: string | null;
  display_name: string;
  description: string | null;
  default_content: string;
  override_content: string | null;
  has_override: boolean;
  is_active: boolean;
  variables: any;
}

const SystemPromptsCatalog: React.FC = () => {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('*')
      .order('family')
      .order('display_name');
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar prompts', description: error.message });
    } else {
      setPrompts(data as SystemPrompt[]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const filtered = prompts.filter(
      (p) =>
        !query ||
        p.display_name.toLowerCase().includes(query.toLowerCase()) ||
        p.prompt_key.toLowerCase().includes(query.toLowerCase()) ||
        (p.function_name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        p.family.toLowerCase().includes(query.toLowerCase()),
    );
    const map = new Map<string, SystemPrompt[]>();
    filtered.forEach((p) => {
      if (!map.has(p.family)) map.set(p.family, []);
      map.get(p.family)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [prompts, query]);

  const startEdit = (p: SystemPrompt) => {
    setEditingId(p.id);
    setDraft(p.override_content ?? p.default_content ?? '');
  };

  const saveOverride = async (p: SystemPrompt) => {
    const value = draft.trim() === '' ? null : draft;
    const { error } = await supabase
      .from('ai_system_prompts')
      .update({ override_content: value })
      .eq('id', p.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      return;
    }
    toast({ title: '✅ Salvo', description: `Override de "${p.display_name}" atualizado.` });
    setEditingId(null);
    load();
  };

  const restoreDefault = async (p: SystemPrompt) => {
    const { error } = await supabase
      .from('ai_system_prompts')
      .update({ override_content: null })
      .eq('id', p.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: '↩️ Restaurado', description: `"${p.display_name}" voltou ao default do código.` });
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-primary" />
            Catálogo de Prompts do Sistema
          </CardTitle>
          <CardDescription>
            Todos os prompts usados internamente pelas edge functions, agrupados por família.
            Edite para criar um <strong>override</strong> sem mexer no código. "Restaurar default" remove o override.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nome, família ou função…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando catálogo…</p>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum prompt encontrado.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {grouped.map(([family, list]) => (
            <AccordionItem key={family} value={family} className="border rounded-md px-3">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{family}</span>
                  <Badge variant="secondary">{list.length}</Badge>
                  {list.some((p) => p.has_override) && (
                    <Badge className="bg-amber-500 hover:bg-amber-500">override ativo</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {list.map((p) => {
                    const isEditing = editingId === p.id;
                    const effective = p.override_content ?? p.default_content;
                    return (
                      <Card key={p.id} className="border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {p.display_name}
                                {p.has_override && (
                                  <Badge className="bg-amber-500 hover:bg-amber-500 text-xs">override</Badge>
                                )}
                                {!effective && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 gap-1">
                                    <AlertCircle className="h-3 w-3" /> sem conteúdo
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                <code className="text-foreground">{p.prompt_key}</code>
                                {p.function_name && <> · função <code className="text-foreground">{p.function_name}</code></>}
                              </CardDescription>
                              {p.description && (
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" onClick={() => saveOverride(p)}>
                                    <Save className="h-3.5 w-3.5 mr-1" /> Salvar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {p.has_override && (
                                    <Button size="sm" variant="ghost" onClick={() => restoreDefault(p)}>
                                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Default
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {isEditing ? (
                            <Textarea
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              rows={10}
                              className="font-mono text-xs"
                              placeholder="Cole aqui o conteúdo do prompt. Deixe vazio para usar o default do código."
                            />
                          ) : effective ? (
                            <ScrollArea className="h-32 bg-muted rounded-md p-3">
                              <pre className="text-xs whitespace-pre-wrap font-mono">{effective}</pre>
                            </ScrollArea>
                          ) : (
                            <p className="text-xs text-muted-foreground italic px-1">
                              Conteúdo ainda não catalogado. Use "Editar" para registrar um override ou aguarde a próxima sincronização com o código das edge functions.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default SystemPromptsCatalog;