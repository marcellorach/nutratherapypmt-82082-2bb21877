# Confirmação do diagnóstico

Sim, você está certo. Em `src/components/administrador/estudos/import/SciImportSection.tsx` (linhas 173-179), as duas abas renderizam o **mesmo** componente:

```tsx
<TabsContent value="external-search">
  <StudiesLibraryTab ... />   // ❌ errado — é a Biblioteca
</TabsContent>

<TabsContent value="curated-library">
  <StudiesLibraryTab ... />   // ✅ correto — é a Biblioteca
</TabsContent>
```

Por isso "Busca Externa" e "Biblioteca" exibem conteúdo idêntico (66 estudos, 43 curados, 10 na fila).

A **Busca Externa real** já existe no projeto e está órfã: `src/components/administrador/estudos/library/SearchExternalStudies.tsx` (612 linhas), conectada à edge function `search-scientific-studies` (PubMed + OpenAlex, com filtros avançados, citações, open access, importação de PDF).

# Plano (alterações mínimas, apenas frontend)

**Arquivo único:** `src/components/administrador/estudos/import/SciImportSection.tsx`

1. **Adicionar import** do componente real:
   ```ts
   import SearchExternalStudies from '../library/SearchExternalStudies';
   ```

2. **Corrigir a aba `external-search`** para usar o componente correto, passando `onStudyImported` para atualizar a Biblioteca após importar:
   ```tsx
   <TabsContent value="external-search">
     <SearchExternalStudies onStudyImported={() => handleTabChange('curated-library')} />
   </TabsContent>
   ```

3. **Mudar aba default** de `"external-search"` para `"curated-library"`:
   ```ts
   const [activeTab, setActiveTab] = useState<string>("curated-library");
   ```

# Fora do escopo

- Não vou mexer em traduções, ordem das abas, layout do `TabNavigation`, nem na lógica das outras abas (Upload, Curadoria).
- Não vou tocar em `StudiesLibraryTab` nem em `SearchExternalStudies` em si — ambos já funcionam.
- Sem migrations, sem mudanças no backend.

# Validação

Após a mudança: ao abrir `/administrador → Digestão de Estudos Científicos`, a aba **Biblioteca** abre por padrão; clicar em **Busca Externa** mostra o formulário de busca PubMed/OpenAlex (não mais a lista de 66 estudos).
