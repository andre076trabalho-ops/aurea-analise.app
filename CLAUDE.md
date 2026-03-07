# CLAUDE.md - Aura Analise Digital

## Projeto
Aplicação web para auditoria e análise de presença digital de clientes (foco em clínicas médicas). Gera relatórios detalhados com scores por seção e landing pages personalizadas para os clientes.

## Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS + Radix UI
- **Estado global:** Zustand com persist (localStorage, chave `aurea-app-storage`)
- **Backend/DB:** Supabase (URL e key via `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **Roteamento:** React Router DOM v6
- **Data fetching:** TanStack Query
- **PDF export:** jsPDF + html2canvas
- **Testes:** Vitest + Testing Library

## Comandos
```bash
npm run dev        # Dev server em :8080
npm run build      # Build de produção
npm run build:dev  # Build em modo development
npm run test       # Rodar testes (vitest run)
npm run test:watch # Testes em modo watch
npm run lint       # ESLint
npm run preview    # Preview do build
```

## Estrutura de pastas
```
src/
  pages/          # Páginas (roteadas)
  components/
    layout/       # Header, Sidebar, MainLayout
    report/       # Editores de seção do relatório (Site, Instagram, GMN, PaidTraffic, Commercial)
    ui/           # Componentes shadcn/ui + customizados
  stores/
    useAppStore.ts  # Store principal Zustand (clients, reports, sections, branding)
  types/
    index.ts      # Todos os tipos TypeScript do domínio
  lib/
    scoring.ts    # Logica de pontuacao por secao
    pdf-export.ts # Export para PDF
    report-analyzer.ts
    utils.ts
  integrations/
    supabase/     # Client e tipos gerados do Supabase
  data/
    sampleSections.ts
  hooks/          # Custom hooks
```

## Rotas principais
- `/` - Dashboard (Index)
- `/clients` - Listagem de clientes
- `/reports` - Listagem de relatórios
- `/reports/:id` - Editor de relatório
- `/reports/:id/preview` - Preview do relatório
- `/r/:reportId` - Landing page dinâmica do cliente (pública)
- `/brand-kit` - Editor de Brand Kit
- `/settings` - Configurações

## Domínio e tipos principais
- **Client** - cliente com `doctorName`, `city`, `logoUrl`
- **Report** - relatório com `status` (`draft | in_progress | review | completed`) e `overallScore`
- **ReportSections** - conjunto das 5 seções: `site`, `instagram`, `gmn`, `paidTraffic`, `commercial`
- **ReportBranding** - branding extraído do site do cliente para a landing page

## Sistema de scores
Cada seção tem score 0-100. Score geral é média ponderada:
- Site: 40%, Instagram: 25%, GMN: 20%, Tráfego Pago: 10%, Comercial: 5%
- Seções desabilitadas (`disabledSections`) redistribuem peso proporcionalmente

Funções em `src/lib/scoring.ts`:
- `calculateSiteScore`, `calculateInstagramScore`, `calculateGMNScore`
- `calculatePaidTrafficScore`, `calculateCommercialScore`
- `calculateOverallScore` (com suporte a `disabledSections`)

## Integração Supabase
- Client: `import { supabase } from "@/integrations/supabase/client"`
- Tipos gerados: `src/integrations/supabase/types.ts`
- Tabela relevante: `published_reports` (landing pages publicadas)

## Convencoes de codigo
- Path alias `@/` aponta para `src/`
- Componentes em PascalCase, hooks com prefixo `use`
- Preferir `useAppStore` para estado global
- Seções do relatório sempre atualizadas via `updateSection(sectionKey, data)` — score é recalculado automaticamente
- Não editar `src/integrations/supabase/` manualmente (gerado automaticamente)
