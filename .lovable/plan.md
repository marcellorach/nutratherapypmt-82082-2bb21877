
## O que aconteceu

A busca de evidências **funcionou parcialmente** — o Perplexity encontrou estudos reais para pares como "Chondroitin Sulfate → Osteoarthritis" e "Fisetin → Hip Dysplasia". Porém dois bugs impediram que os resultados fossem salvos:

### Bug 1: Constraint violation no campo `direction`
O valor `positive` está sendo inserido no campo `direction` da tabela `triplet_extractions`, mas o banco só aceita `improves | worsens | neutral | bidirectional`. A função `mapDirection('positive')` que converte para `improves` existe no código atual, mas a versão deployada parece estar desatualizada ou o campo está sendo sobrescrito em outro ponto.

### Bug 2: Network timeout (stream interrompido)
Cada par composto×condição faz uma chamada ao Perplexity (~20-30s). Com 10 pares elegíveis, a execução total excede o timeout da conexão HTTP, causando o erro "connection closed before message completed" no 4o par.

### Resultado visível
- **"pairs: 0, studies: 0, pending: 0"** — os triplets foram encontrados pelo Perplexity mas falharam ao ser inseridos no banco
- **"network error"** — a conexão caiu antes de completar todos os pares

---

## Plano de correção

### 1. Corrigir o campo `direction` na edge function
- Garantir que `mapDirection()` é efetivamente aplicada no insert
- Auditar se há outro ponto no código que sobrescreve o valor

### 2. Reduzir timeout / otimizar execução
- Reduzir `max_pairs` default de 12 para 5 para ficar dentro do tempo
- Adicionar tratamento de erro mais robusto no stream para que, mesmo se um par falhar, o resumo final reflita os pares que foram processados com sucesso

### 3. Redeployar a edge function
- Garantir que a versão corrigida é efetivamente deployada

### 4. Atualizar CHANGELOG
