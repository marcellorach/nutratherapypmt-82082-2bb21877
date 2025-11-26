import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PromptEditorProps {
  title: string;
  description: string;
  configKey: string;
  initialValue: string;
  defaultValue: string;
  placeholder?: string;
  variables?: string[];
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  title,
  description,
  configKey,
  initialValue,
  defaultValue,
  placeholder,
  variables = []
}) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await supabase.functions.invoke('ai-config', {
        method: 'POST',
        body: { action: 'set', key: configKey, value }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "✅ Prompt salvo",
        description: "O prompt foi atualizado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao salvar prompt:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o prompt"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setValue(defaultValue);
    toast({
      title: "Prompt restaurado",
      description: "O prompt padrão foi restaurado"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {variables.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <strong>Variáveis disponíveis:</strong>{' '}
            {variables.map((v, i) => (
              <code key={i} className="bg-muted px-1 py-0.5 rounded mx-1">
                {v}
              </code>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] font-mono text-sm"
          rows={10}
        />
        
        {showPreview && (
          <div className="p-4 bg-muted rounded-md">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">Preview:</div>
            <pre className="text-xs whitespace-pre-wrap font-mono">{value}</pre>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || value === initialValue}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={value === defaultValue}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <><EyeOff className="w-4 h-4 mr-2" /> Ocultar Preview</>
            ) : (
              <><Eye className="w-4 h-4 mr-2" /> Mostrar Preview</>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Caracteres: {value.length} | Linhas: {value.split('\n').length}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEditor;
