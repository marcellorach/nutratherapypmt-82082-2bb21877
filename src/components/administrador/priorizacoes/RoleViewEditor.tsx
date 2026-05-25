import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, RotateCcw, Code2, Copy } from 'lucide-react';
import {
  ROLE_VIEWS,
  AdminSidebarGroup,
  RoleViewId,
} from '@/config/role-views';
import { adminTabsConfig } from '@/config/admin-tabs';
import { toast } from '@/components/ui/use-toast';

const ALL_GROUPS: { id: AdminSidebarGroup; label: string }[] = [
  { id: 'knowledge-base', label: 'Base de Conhecimento' },
  { id: 'data-processing', label: 'Processamento de Dados' },
  { id: 'research', label: 'Pesquisa & Desenvolvimento' },
  { id: 'predictive-analysis', label: 'Análise Preditiva' },
  { id: 'configuration', label: 'Configuração' },
  { id: 'governance-ai', label: 'Governança & IA' },
];

const STORAGE_KEY = 'senex-role-view-overrides';

type Overrides = Record<RoleViewId, {
  allowedAdminGroups: AdminSidebarGroup[] | null;
  hiddenAdminTabs: string[];
}>;

const loadOverrides = (): Overrides | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const fromConfig = (): Overrides => {
  const o = {} as Overrides;
  ROLE_VIEWS.forEach((v) => {
    o[v.id] = {
      allowedAdminGroups: v.allowedAdminGroups,
      hiddenAdminTabs: v.hiddenAdminTabs ?? [],
    };
  });
  return o;
};

const RoleViewEditor: React.FC = () => {
  const [overrides, setOverrides] = useState<Overrides>(() => loadOverrides() ?? fromConfig());
  const [snippetOpen, setSnippetOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
  }, [overrides]);

  const toggleGroup = (viewId: RoleViewId, group: AdminSidebarGroup) => {
    setOverrides((prev) => {
      const cur = prev[viewId];
      const all = cur.allowedAdminGroups;
      // Treat null (= all) as full list before editing.
      const base: AdminSidebarGroup[] = all === null ? ALL_GROUPS.map((g) => g.id) : [...all];
      const next = base.includes(group) ? base.filter((g) => g !== group) : [...base, group];
      return { ...prev, [viewId]: { ...cur, allowedAdminGroups: next } };
    });
  };

  const toggleTab = (viewId: RoleViewId, tabId: string) => {
    setOverrides((prev) => {
      const cur = prev[viewId];
      const hidden = cur.hiddenAdminTabs.includes(tabId)
        ? cur.hiddenAdminTabs.filter((t) => t !== tabId)
        : [...cur.hiddenAdminTabs, tabId];
      return { ...prev, [viewId]: { ...cur, hiddenAdminTabs: hidden } };
    });
  };

  const reset = () => {
    setOverrides(fromConfig());
    toast({ title: 'Reset', description: 'Restaurado para o padrão do código.' });
  };

  const snippet = useMemo(() => generateSnippet(overrides), [overrides]);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    toast({ title: 'Snippet copiado', description: 'Cole em src/config/role-views.ts para versionar.' });
  };

  const tabsByGroup = useMemo(() => {
    const m: Record<string, typeof adminTabsConfig> = {};
    adminTabsConfig.forEach((t) => {
      m[t.group] = m[t.group] || [];
      m[t.group].push(t);
    });
    return m;
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-dashed bg-amber-50/50 border-amber-200">
        <CardContent className="p-3 text-xs text-amber-900">
          <b>Camada de visualização (não é segurança).</b> Edições aqui ficam no <code>localStorage</code> deste navegador
          (preview rápido). Para versionar em código, clique em <b>"Ver snippet"</b> e cole o resultado em
          <code className="ml-1">src/config/role-views.ts</code>. RLS real entrará apenas quando o 1º vet PetLove
          externo for convidado.
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Resetar para padrão
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSnippetOpen((s) => !s)}>
          <Code2 className="h-3.5 w-3.5 mr-1.5" /> {snippetOpen ? 'Esconder snippet' : 'Ver snippet para code'}
        </Button>
        {snippetOpen && (
          <Button size="sm" onClick={copySnippet}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar snippet
          </Button>
        )}
      </div>

      {snippetOpen && (
        <pre className="bg-gray-900 text-gray-100 rounded p-3 text-[10px] leading-relaxed overflow-x-auto max-h-[300px]">
          {snippet}
        </pre>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {ROLE_VIEWS.map((v) => {
          const ov = overrides[v.id];
          const allowed = ov.allowedAdminGroups;
          const isAll = allowed === null;
          return (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  {v.label_pt}
                  <Badge variant="outline" className="text-[10px] ml-auto">{v.id}</Badge>
                </CardTitle>
                <p className="text-[11px] text-gray-600">{v.description_pt}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-gray-700 mb-1">Grupos da sidebar</div>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_GROUPS.map((g) => {
                      const checked = isAll || (allowed?.includes(g.id) ?? false);
                      return (
                        <label key={g.id} className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleGroup(v.id, g.id)}
                          />
                          <span>{g.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {isAll && (
                    <div className="text-[10px] text-emerald-600 mt-1">Vendo TODOS os grupos (padrão arquiteto).</div>
                  )}
                </div>

                <details className="text-[11px]">
                  <summary className="cursor-pointer font-semibold text-gray-700">
                    Tabs específicas a esconder ({ov.hiddenAdminTabs.length})
                  </summary>
                  <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {Object.entries(tabsByGroup).map(([group, tabs]) => (
                      <div key={group}>
                        <div className="text-[10px] uppercase text-gray-400 font-mono">{group}</div>
                        <div className="grid grid-cols-2 gap-0.5">
                          {tabs.map((t) => (
                            <label key={t.id} className="flex items-center gap-1 text-[10px] cursor-pointer hover:bg-gray-50 rounded px-1">
                              <Checkbox
                                checked={ov.hiddenAdminTabs.includes(t.id)}
                                onCheckedChange={() => toggleTab(v.id, t.id)}
                              />
                              <span className="truncate">{t.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function generateSnippet(o: Overrides): string {
  const blocks = ROLE_VIEWS.map((v) => {
    const ov = o[v.id];
    const groups = ov.allowedAdminGroups === null
      ? 'null'
      : `[${ov.allowedAdminGroups.map((g) => `'${g}'`).join(', ')}]`;
    const hidden = ov.hiddenAdminTabs.length
      ? `,\n    hiddenAdminTabs: [${ov.hiddenAdminTabs.map((t) => `'${t}'`).join(', ')}]`
      : '';
    return `  {
    id: '${v.id}',
    allowedAdminGroups: ${groups}${hidden},
  }`;
  }).join(',\n');
  return `// Cole isto sobre o array ROLE_VIEWS em src/config/role-views.ts\n// (mantenha os campos label_*, description_*, defaultRoute originais).\n[\n${blocks}\n]`;
}

export default RoleViewEditor;