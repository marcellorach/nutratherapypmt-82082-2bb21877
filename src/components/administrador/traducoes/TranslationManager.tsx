import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit2, Save, X, RefreshCw, Download, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from '@/hooks/useTranslations';

interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  version: number;
  updated_at: string;
}

export default function TranslationManager() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { version, reloadTranslations } = useTranslations();
  
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Carrega traduções
  const loadTranslations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      setTranslations(data || []);
      setFilteredTranslations(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao carregar traduções: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranslations();
  }, [version]);

  // Filtra traduções
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTranslations(translations);
      return;
    }

    const filtered = translations.filter(
      (t) =>
        t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTranslations(filtered);
  }, [searchTerm, translations]);

  // Editar tradução
  const handleEdit = (translation: Translation) => {
    setEditingId(translation.id);
    setEditValue(translation.value);
  };

  // Salvar edição
  const handleSave = async (translation: Translation) => {
    try {
      const { error } = await supabase
        .from('translations')
        .update({ value: editValue })
        .eq('id', translation.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tradução atualizada com sucesso',
      });

      setEditingId(null);
      await reloadTranslations();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao salvar: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Cancelar edição
  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Exportar traduções
  const handleExport = () => {
    const ptTranslations = translations.filter(t => t.locale === 'pt');
    const enTranslations = translations.filter(t => t.locale === 'en');

    const exportData = {
      pt: ptTranslations.reduce((acc, t) => ({ ...acc, [t.key]: t.value }), {}),
      en: enTranslations.reduce((acc, t) => ({ ...acc, [t.key]: t.value }), {}),
      exported_at: new Date().toISOString(),
      total_keys: translations.length / 2,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportado',
      description: `${translations.length / 2} chaves exportadas`,
    });
  };

  // Agrupa por chave para exibir PT e EN lado a lado
  const groupedTranslations = filteredTranslations.reduce((acc, t) => {
    if (!acc[t.key]) {
      acc[t.key] = { pt: null, en: null };
    }
    acc[t.key][t.locale as 'pt' | 'en'] = t;
    return acc;
  }, {} as Record<string, { pt: Translation | null; en: Translation | null }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('translations.manager.title', 'Gerenciar Traduções')}
          </h2>
          <p className="text-muted-foreground">
            {t('translations.manager.subtitle', 'Edite traduções diretamente no banco de dados')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTranslations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total de Chaves</div>
          <div className="text-2xl font-bold">{Object.keys(groupedTranslations).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Traduções PT</div>
          <div className="text-2xl font-bold">
            {translations.filter(t => t.locale === 'pt').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Traduções EN</div>
          <div className="text-2xl font-bold">
            {translations.filter(t => t.locale === 'en').length}
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por chave ou valor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Chave</TableHead>
              <TableHead>Português (PT)</TableHead>
              <TableHead>English (EN)</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando traduções...
                </TableCell>
              </TableRow>
            ) : Object.keys(groupedTranslations).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhuma tradução encontrada
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedTranslations).map(([key, { pt, en }]) => (
                <TableRow key={key}>
                  <TableCell className="font-mono text-xs">{key}</TableCell>
                  <TableCell>
                    {editingId === pt?.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <div className="text-sm">{pt?.value || '-'}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === en?.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <div className="text-sm">{en?.value || '-'}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === pt?.id || editingId === en?.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(editingId === pt?.id ? pt! : en!)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {pt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(pt)}
                            title="Editar PT"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {en && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(en)}
                            title="Editar EN"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
