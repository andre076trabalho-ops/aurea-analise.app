# Sistema de Avaliação Dinâmico com Pesos Redistribuídos

## Visão Geral

O sistema de avaliação (scoring) foi atualizado para redistributar pesos quando seções são marcadas como "não se aplica". Isso evita que seções cuja avaliação não é relevante penalizem a nota geral do relatório.

## Pesos Base

Originalmente, a nota geral do relatório é calculada a partir de 5 pilares com pesos fixos:

| Pilar | Peso | Descrição |
|-------|------|-----------|
| **Site** | 40% | Desempenho do site, PageSpeed, SEO, pixels/tags |
| **Instagram** | 25% | Configuração do perfil, bio, conteúdo, rastreamento |
| **Google Meu Negócio (GMN)** | 20% | Avaliações, nota média, health score, checklist |
| **Tráfego Pago** | 10% | Google Ads e Facebook Ads |
| **Comercial** | 5% | Tempo de resposta a leads, follow-ups |

**Total: 100%**

## Funcionamento do Sistema Dinâmico

Quando uma seção é marcada como **"não se aplica"** (disabled), seu peso é **redistribuído proporcionalmente** entre as seções aplicáveis.

### Fórmula de Cálculo

```
Para cada seção aplicável:
  Peso Final = Peso Base / Soma dos Pesos Base das Seções Aplicáveis
```

### Exemplos Práticos

#### Exemplo 1: Apenas Instagram Aplicável
- Seções aplicáveis: Instagram
- Peso de Instagram: 25% / 25% = **100%**
- **Nota final = Nota do Instagram**

#### Exemplo 2: Site e GMN Aplicáveis
- Seções aplicáveis: Site (40%) + GMN (20%) = 60% total
- Peso do Site: 40% / 60% ≈ **66.7%**
- Peso do GMN: 20% / 60% ≈ **33.3%**
- **Nota final = (Nota Site × 0.667) + (Nota GMN × 0.333)**

#### Exemplo 3: Apenas Instagram com nota perfeita, demais não aplicável
```
- Site: Não se aplica
- Instagram: 100 (perfeito)
- GMN: Não se aplica
- Tráfego Pago: Não se aplica
- Comercial: Não se aplica

Resultado: Nota Final = 100
```

#### Exemplo 4: Site com nota 80, Instagram com 60 (demais não aplicável)
```
- Site: 80 (peso 40%)
- Instagram: 60 (peso 25%)
- GMN, Tráfego, Comercial: Não se aplica

Peso total aplicável: 40% + 25% = 65%
Peso Site ajustado: 40/65 ≈ 61.5%
Peso Instagram ajustado: 25/65 ≈ 38.5%

Nota Final = (80 × 0.615) + (60 × 0.385) = 49.2 + 23.1 = 72.3 ≈ 72
```

## Implementação Técnica

### Arquivo: `src/lib/scoring.ts`

A nova função `calculateOverallScore()` aceita um parâmetro adicional `disabledSections`:

```typescript
export function calculateOverallScore(
  siteScore: number,
  instagramScore: number,
  gmnScore: number,
  paidTrafficScore: number,
  commercialScore: number,
  disabledSections?: {
    site?: boolean;
    instagram?: boolean;
    gmn?: boolean;
    paidTraffic?: boolean;
    commercial?: boolean;
  }
): number
```

### Função Interna: `calculateDynamicWeights()`

Essa função privada calcula os pesos proporcionais baseado nas seções habilitadas:

1. Soma os pesos das seções habilitadas
2. Divide o peso base de cada seção pela soma total
3. Define peso 0 para seções desabilitadas

### Propietários de Dados que Usam Este Sistema

- **ReportEditorPage.tsx**: Quando atualiza a nota geral do relatório
- **ClientLandingPage.tsx**: Quando exibe a nota geral
- **ClientLandingPage2.tsx**: Quando exibe a nota geral
- **ReportPreviewPage.tsx**: Quando visualiza o relatório

## Como Usar

### No Editor de Relatório

1. Abra o editor de um relatório
2. Clique no ícone de seção para alternar entre "Aplicável" e "Não Aplicável"
3. A nota geral será recalculada automaticamente com os pesos redistribuídos

### Verificação de Código

Você pode visualizar o funcionamento no arquivo [src/lib/scoring.ts](src/lib/scoring.ts), especialmente:
- Função `calculateDynamicWeights()` (linhas ~221-265)
- Função `calculateOverallScore()` (linhas ~268-315)

## Benefícios

✅ **Justiça na Avaliação**: Seções não aplicáveis não penalizam a nota  
✅ **Flexibilidade**: Suporta qualquer combinação de seções aplicáveis  
✅ **Proporção**: Mantém a proporção relativa entre seções ativas  
✅ **Transparência**: A lógica é clara e documentada  

## Exemplo de Cenário Real

**Restaurante sem presença em Instagram** (usa apenas Google Meu Negócio e Site):

```
Sem sistema dinâmico (peso Instagram = 25%):
- Site: 85
- Instagram: 0 (não aplicável, mas contado)
- GMN: 90
- Tráfego: 0 (não aplicável)
- Comercial: 75

Nota = (85×0.4) + (0×0.25) + (90×0.2) + (0×0.1) + (75×0.05)
     = 34 + 0 + 18 + 0 + 3.75 = 55.75 ❌ Injusto!

Com sistema dinâmico (Instagram/Tráfego desa bilitados):
- Peso aplicável: 40% + 20% + 5% = 65%
- Site: 85 × (40/65) ≈ 52.3
- GMN: 90 × (20/65) ≈ 27.7
- Comercial: 75 × (5/65) ≈ 5.8

Nota = 52.3 + 27.7 + 5.8 = 85.8 ✅ Justo!
```

---

**Última atualização**: Março 2026  
**Sistema de Pesos Dinâmicos**: v1.0 ✅ Implementado
