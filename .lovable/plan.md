## Plano

### 1) Corrigir a descoberta de condições no backend da busca
Vou ajustar `supabase/functions/kg-evidence-gap-fill/index.ts` porque o diagnóstico já mostrou um falso negativo no início do fluxo:
- a requisição do card retorna `pairs_searched: 0` quase instantaneamente;
- os logs do backend mostram `pet conditions found 0`;
- mas o banco tem condições para esse pet (`Cognitive Dysfunction Syndrome` e `Sarcopenia`).

A correção será:
- trocar o embed atual por uma seleção explícita com relação nomeada (`health_conditions:condition_id (...)`), igual ao padrão já usado em outras funções;
- validar e logar erros de cada query crítica (`pet_conditions`, snapshot, nutraceuticals, ai_configurations), em vez de deixar falhar silenciosamente e retornar “No gaps found”;
- preservar o fallback por `condition_name` quando `condition_id` estiver nulo, para que a busca externa continue funcionando mesmo sem vínculo canônico;
- diferenciar no retorno os casos “não há pares elegíveis” vs “falha ao montar pares” vs “sem condições encontradas”.

### 2) Adicionar log em tempo real de busca, de forma realista
Em vez de simular progresso no frontend, vou instrumentar a busca com eventos reais vindos do backend.

Implementação proposta:
- estender `kg-evidence-gap-fill` para suportar modo de streaming (`stream=true`), emitindo eventos por etapa;
- no `EvidenceGapCard`, trocar a chamada simples por `supabase.functions.invoke()` por um `fetch` autenticado ao endpoint da função quando a busca for iniciada nesse card, para consumir o stream;
- renderizar um novo painel de log logo dentro/abaixo do card de lacuna de evidência, seguindo o padrão visual do `ClinicalPipelineLogPanel` / `DigitalTwinLogPanel`.

Eventos que o backend vai emitir:
- início da execução;
- leitura do snapshot e do stack recomendado;
- leitura das condições do pet;
- montagem dos pares elegíveis;
- início de cada par (`compound × condition`);
- tentativa Perplexity;
- fallback PubMed quando aplicável;
- estudos encontrados / PMIDs válidos;
- inserção de estudos;
- criação de triplet pendente;
- resumo final e duração total;
- erro real, quando houver.

Assim, quando voltar “0”, o usuário verá exatamente por quê — por exemplo:
- “0 condições carregadas do pet”;
- “query de pet_conditions falhou”;
- “todos os pares já têm evidência aprovada”;
- “Perplexity sem evidência, caindo para PubMed”.

### 3) Melhorar o card de lacuna de evidência para refletir o fluxo real
Vou ajustar `src/components/pet/EvidenceGapCard.tsx` para o card deixar de parecer “PubMed-only” e passar a explicar melhor o que está acontecendo.

Mudanças planejadas:
- atualizar texto do botão/legenda para refletir busca real multi-fonte (Perplexity primeiro, PubMed como fallback);
- mostrar status em andamento, duração e resumo final por provider;
- manter o bloco de detalhes finais, mas enriquecido com os eventos reais do processamento;
- exibir mensagens de erro acionáveis, em vez de um “0 resultados” genérico.

### 4) Ajustar os workflows para não saírem do quadro
Vou revisar tanto:
- `src/components/pet/ClinicalPipelineWorkflow.tsx`
- mini-workflow do `src/components/pet/DigitalTwinDog.tsx`

Ajuste visual proposto:
- em larguras amplas: manter visual horizontal;
- quando não couber: quebrar em 2 linhas responsivas, em vez de forçar overflow lateral;
- em layout quebrado: remover/conter as linhas conectoras entre etapas para não “estourarem” visualmente;
- mover o bloco de tempo total para funcionar bem tanto em uma linha quanto em duas.

Objetivo: evitar que qualquer etapa fique “fora de quadro”, sem sacrificar legibilidade.

### 5) Internacionalização e manutenção obrigatória
Como haverá novos textos visíveis, vou seguir o fluxo bilíngue completo:
- incrementar `I18N_VERSION` antes das mudanças;
- adicionar todas as novas chaves PT/EN ao mesmo tempo;
- substituir qualquer texto visível hardcoded;
- registrar tudo no `CHANGELOG.md` e sincronizar o changelog gerado.

## Diagnóstico confirmado
Hoje o problema principal não parece ser “a busca externa não está funcionando”. O problema está antes disso: o backend está montando **zero pares** para pesquisar, apesar de existirem condições no pet. Ou seja, a busca provavelmente nem chega de verdade na etapa externa nesse caso.

## Detalhes técnicos
- Arquivos principais a alterar:
  - `supabase/functions/kg-evidence-gap-fill/index.ts`
  - `src/components/pet/EvidenceGapCard.tsx`
  - `src/components/pet/ClinicalPipelineWorkflow.tsx`
  - `src/components/pet/DigitalTwinDog.tsx`
  - novo componente de log da busca (ex.: `src/components/pet/EvidenceGapLogPanel.tsx`)
  - `src/i18n.ts`
  - `src/locales/pt/translation.json`
  - `src/locales/en/translation.json`
  - `CHANGELOG.md`

- Evidência do bug encontrada na exploração:
  - request da função respondeu `200` com `pairs_searched: 0`;
  - log da função: `pet conditions found 0`;
  - consulta ao banco mostra 2 registros em `pet_conditions` para esse pet.

- Abordagem de log em tempo real:
  - streaming autenticado do backend;
  - eventos reais, sem mock de progresso;
  - preservando resposta final estruturada para o resumo do card.

Se aprovar, eu implemento isso agora.