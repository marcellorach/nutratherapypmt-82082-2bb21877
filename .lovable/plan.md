

## Plano: Detecção de Estudos Duplicados no Upload de PDFs

### Problema
Atualmente, o sistema aceita qualquer PDF sem verificar se o mesmo estudo ja existe no banco (`processed_studies`), permitindo digestão duplicada mesmo que o arquivo tenha nome diferente.

### Estrategia Multi-camada de Detecção

Uma abordagem robusta combina 3 niveis de verificação:

| Nivel | Metodo | Quando | Confianca |
|---|---|---|---|
| 1. **Hash do arquivo** | SHA-256 do conteudo binario do PDF | Antes do upload | 100% — mesmo arquivo fisico |
| 2. **Similaridade de nome** | Levenshtein (ja existe em `name-harmonization-service.ts`) | Antes do upload | Media — nomes podem variar |
| 3. **Fingerprint de conteudo** | Hash dos primeiros N bytes de texto extraido | Apos upload, antes do AI processing | Alta — detecta reupload com nome diferente |

### Implementacao

**1. Coluna `content_hash` na tabela `processed_studies`**
- Migração: `ALTER TABLE processed_studies ADD COLUMN content_hash TEXT;`
- Armazena SHA-256 do arquivo para detecção exata

**2. Componente `DuplicateCheckResult`**
- Exibe alertas inline por arquivo: "Possivel duplicata de [titulo existente]"
- Opcoes: "Importar mesmo assim" / "Remover da fila"

**3. Logica de verificação em `FileUploadTab.tsx`**
- Antes do upload: calcular SHA-256 do File via Web Crypto API
- Consultar `processed_studies` por `content_hash` (match exato)
- Consultar `processed_studies` por similaridade de `original_filename` usando a funcao `calculateSimilarity` existente
- Marcar arquivos com alertas visuais (amarelo = nome similar, vermelho = hash identico)

**4. Mesma logica em `StudyPdfUpload.tsx`** (upload individual da Library)
- Ao clicar "Send to AI Processing", verificar se ja existe em `processed_studies`

### Mudancas

| Arquivo | Acao |
|---|---|
| **Migracao SQL** | Adicionar coluna `content_hash TEXT` em `processed_studies` |
| `src/components/administrador/estudos/import/FileUploadTab.tsx` | Adicionar verificacao de duplicatas apos selecao de arquivos (hash + nome), exibir alertas inline, permitir pular duplicatas |
| `src/components/administrador/estudos/library/StudyPdfUpload.tsx` | Verificar duplicata antes de `sendToAIProcessing` |
| `src/utils/fileHashUtils.ts` | **Novo** — funcao `calculateFileHash(file: File): Promise<string>` usando Web Crypto API |
| `src/components/administrador/estudos/import/DuplicateAlert.tsx` | **Novo** — componente visual de alerta de duplicata com opcoes |

### Fluxo do usuario

```text
Usuario seleciona PDFs
  → Sistema calcula hash de cada arquivo (Web Crypto API)
  → Consulta processed_studies por content_hash
  → Consulta processed_studies por similaridade de filename
  → Exibe alertas:
    ├── 🔴 "Arquivo identico ja importado: [titulo] — [status]"
    ├── 🟡 "Nome similar a estudo existente: [titulo] (87% similar)"
    └── ✅ Sem duplicatas
  → Usuario decide: importar, pular, ou cancelar
  → Hash salvo no registro para futuras verificacoes
```

