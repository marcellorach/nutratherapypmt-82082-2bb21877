## Objetivo

Criar duas páginas de entrada distintas baseadas no hostname, mantendo todo o restante da plataforma (painel admin, portal vet, portal tutor) **idêntico**, mas respeitando o idioma default e o "voltar" para a home correta.

---

## a) Duas páginas de entrada

### a.1) `longevidade.ai` — variante "PetLove"
- Default em **inglês** (`en`)
- Mantém referências à PetLove e ao plano de saúde animal, **mas suavizadas**: nos cards/seções da `OpportunitySection` e `MarketSection`, adicionar um selo discreto "in development / parceria em construção" ao lado das menções à PetLove/plano de saúde, sem destaque visual.
- Reexibir o que está hoje escondido em `OpportunitySection` (header + card "1.4M" + card PAMEC) **somente nesta variante**.

### a.2) `pet.longevidade.ai` — variante pública
- Default em **português** (`pt`)
- **Sem** referências à PetLove/plano de saúde (mantém o estado atual, já limpo).
- O card "Plano de Saúde Animal Ganha" em `MarketSection` é ocultado nesta variante (ou substituído por um genérico).

### Implementação técnica
- Criar `src/lib/site-variant.ts` com `getSiteVariant()`:
  - Lê `window.location.hostname`.
  - Retorna `'petlove'` para `longevidade.ai` (e domínio de preview com query/flag), `'public'` para `pet.longevidade.ai`.
  - Fallback: `'public'` em previews lovable.app, com possibilidade de override via `?variant=petlove` para QA.
- Criar `src/contexts/SiteVariantContext.tsx` que:
  - Detecta variante uma vez no boot.
  - Define o idioma default via `i18n.changeLanguage()` **somente se** o usuário ainda não tiver preferência salva em `localStorage('language')`.
  - Persiste a variante de entrada em `sessionStorage('entry-variant')` para que o link "voltar à home" no Header/Footer aponte ao hostname certo.
- Atualizar `OpportunitySection`, `MarketSection`, `OutcomesSection` para consumir o contexto e renderizar condicionalmente os blocos PetLove/PAMEC + selo "em construção".
- Header/Footer: o `<Link to="/">` continua interno (mesma SPA), mas exibe o conteúdo da variante correta automaticamente, então nenhum redirect cross-domain é necessário em uso normal. Caso a sessão tenha entrado por um hostname e o usuário esteja em outro (raro), o link usa `window.location.origin` da variante salva.

### DNS / hospedagem
- Requer apontar `pet.longevidade.ai` (CNAME) para o mesmo deploy Lovable do domínio principal. Vou listar isso como passo manual ao final — sem isso, `pet.longevidade.ai` não resolverá. O código já estará pronto.

---

## b) Portais internos idênticos

- `/`, `/tutor`, `/veterinario`, `/administrador` permanecem **uma única implementação** (sem fork).
- O idioma exibido = idioma escolhido pelo usuário OU default da variante de entrada.
- Logo/links "home" do `Header.tsx` continuam usando `<Link to="/">` (SPA), o que naturalmente devolve à landing correspondente ao hostname atual.

---

## c) Ícone de idioma mais claro

Em `LanguageSwitcher.tsx`:
- Substituir o ícone `Globe` por **bandeirinhas** (🇧🇷 / 🇺🇸 ou 🇬🇧) renderizadas via emoji ou via SVGs simples.
- Mostrar a bandeira do idioma **ativo** no botão (em vez do globo genérico), com aria-label adequado.
- Aumentar contraste do botão (de `text-gray-500` para `text-gray-800`) e adicionar um leve fundo no hover.
- Manter o dropdown atual com as duas opções, cada uma também com sua bandeira.

---

## Arquivos a criar/editar

**Novos**
- `src/lib/site-variant.ts`
- `src/contexts/SiteVariantContext.tsx`

**Editados**
- `src/App.tsx` — envelopa com `SiteVariantProvider`
- `src/components/landing/OpportunitySection.tsx` — render condicional + selo
- `src/components/landing/MarketSection.tsx` — render condicional do card PetLove + selo
- `src/components/landing/OutcomesSection.tsx` — reexibe métrica 1.4M apenas em variante PetLove
- `src/components/layout/LanguageSwitcher.tsx` — bandeiras + contraste
- `src/locales/{pt,en}/translation.json` — chaves novas: `landing.partnership.inDevelopment`, `language.pt`, `language.en`
- `src/i18n.ts` — bump `I18N_VERSION` para `1.75.0`

---

## Resposta à pergunta "é possível?"

Sim, totalmente. A única dependência externa é o apontamento DNS de `pet.longevidade.ai` para o deploy — vou deixar a detecção de hostname pronta e te aviso o passo de DNS no final.

