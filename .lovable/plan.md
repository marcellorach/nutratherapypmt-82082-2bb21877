

# Plano: Footer, CTAs, Acesso Livre e Gráfico TAM/SAM/SOM

## 4 Mudanças

### a) Atualizar Slogan no Footer

O footer atual mostra: "NutraTherapy Pet (c) 2025 -- Scalable intelligent nutraceutical recommendation system for pets"

Atualizar para o novo slogan em duas linhas:
- Linha 1: "Extending Lives Through Precision Geroscience"  
- Linha 2: "1.4 Million Dogs. Unlimited Discoveries."
- Manter copyright separado: "NutraTherapy Pet (c) 2025"

### b) Botao "Schedule a Meeting" com Contato Direto + Habilitar Segundo Botao

No InvestmentSection, o botao "Schedule a Meeting" vai abrir um modal/popover com:
- Email: marcello@lifespan.com.br (link mailto:)
- WhatsApp: +55 11 97205-9371 (link wa.me)

O botao "Request Pitch Deck" sera habilitado com link mailto para o mesmo email com assunto pre-preenchido.

### c) Remover Toda Fricção de Login

Remover ProtectedRoute de TODAS as rotas internas. Qualquer pessoa podera acessar /veterinario, /administrador, /tutor sem login. Isso significa:
- Remover wrapper ProtectedRoute das rotas no App.tsx
- As paginas ficarao acessiveis diretamente pela URL
- O sistema de auth continua existindo (para quem quiser logar), mas nao bloqueia acesso

### d) Melhorar Gráfico TAM/SAM/SOM

Problemas visíveis na screenshot: labels "85M" e "Brazil" sobrepondo com SAM. Melhorias:
- Aumentar container para 420x420px
- Melhorar espacamento entre aneis (TAM inset 0, SAM inset 80px, SOM inset 155px)
- Labels do TAM posicionados mais acima (pt-5) com fonte maior
- Labels do SAM com mais padding top para nao sobrepor com descricao do TAM
- Descricoes mais curtas para caber nos aneis

### e) Upload de Imagens

Sim, voce pode enviar imagens e eu as incluo no site. Basta enviar na proxima mensagem.

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/locales/en/translation.json` | Atualizar `footer.copyright` com novo slogan |
| `src/locales/pt/translation.json` | Mesmo em portugues |
| `src/components/landing/InvestmentSection.tsx` | CTA1 abre popover com email+WhatsApp; CTA2 abre mailto com assunto "Pitch Deck Request" |
| `src/App.tsx` | Remover ProtectedRoute de todas as rotas |
| `src/components/landing/MarketSection.tsx` | Ajustar dimensoes e espacamentos do grafico TAM/SAM/SOM |
| `src/components/layout/Footer.tsx` | Reestruturar para mostrar slogan em duas linhas |
| `src/i18n.ts` | Incrementar I18N_VERSION para 1.9.43 |

### Detalhes do Footer Atualizado

```text
NutraTherapy Pet (c) 2025
Extending Lives Through Precision Geroscience
1.4 Million Dogs. Unlimited Discoveries.

Powered by
[logos]
```

Novas chaves de traducao:
- `footer.copyright`: apenas "NutraTherapy Pet (c) 2025"
- `footer.sloganLine1`: "Extending Lives Through Precision Geroscience"
- `footer.sloganLine2`: "1.4 Million Dogs. Unlimited Discoveries."

### Detalhes do CTA "Schedule a Meeting"

Usar Popover do Radix (ja instalado) para mostrar ao clicar:
- Icone de email + "marcello@lifespan.com.br" (link mailto:)
- Icone de WhatsApp + "+55 11 97205-9371" (link https://wa.me/5511972059371)

CTA2 "Request Pitch Deck": link `mailto:marcello@lifespan.com.br?subject=Pitch%20Deck%20Request%20-%20NutraTherapy%20Pet`

### Detalhes da Remocao de Fricao

No App.tsx, trocar:
```tsx
<Route path="/veterinario" element={
  <ProtectedRoute><VeterinarioPage /></ProtectedRoute>
} />
```
Por:
```tsx
<Route path="/veterinario" element={<VeterinarioPage />} />
```

Para TODAS as 5 rotas protegidas (tutor, veterinario, veterinario/pet/new, veterinario/pet/:id, administrador).

### Grafico TAM/SAM/SOM Melhorado

- Container: 420x420px
- TAM (externo): inset-0, pt-6, textos menores e mais concisos
- SAM (meio): inset 80px em todos os lados, pt-4
- SOM (centro): inset 155px, centralizado
- Descricoes simplificadas para evitar sobreposicao:
  - TAM: "Companion dogs in Brazil"
  - SAM: "Adults + seniors"  
  - SOM: "Premium segment"

