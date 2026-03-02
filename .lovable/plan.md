

## Problema

Os dados fictícios do GMN (e de todas as seções) aparecem como "—" no preview porque os dados só são carregados no store quando você passa pela página do **Editor** primeiro. Se você navega diretamente para `/reports/2/preview`, o `currentReportSections` está `null` ou vazio.

A lógica de inicialização dos dados fictícios está apenas em `ReportEditorPage.tsx` (no `useEffect`), mas não existe em `ReportPreviewPage.tsx`.

## Plano

### 1. Adicionar inicialização de dados no ReportPreviewPage
**Arquivo:** `src/pages/ReportPreviewPage.tsx`

- Adicionar o mesmo `useEffect` que existe no `ReportEditorPage` para carregar os `sampleSections` quando `id === '2'` e `currentReportSections` for `null`
- Disparar o cálculo de score para cada seção após carregar os dados

### 2. Extrair dados de amostra para arquivo compartilhado
**Arquivo:** `src/data/sampleSections.ts` (novo)

- Mover o objeto `sampleSections` e `defaultSections` do `ReportEditorPage.tsx` para um arquivo separado, evitando duplicação de código
- Importar nos dois componentes (Editor e Preview)

### Resultado
- Ao abrir o preview diretamente, os dados fictícios do GMN (47 avaliações, nota 4.3, checklist) e de todas as seções aparecerão corretamente com os scores calculados.

