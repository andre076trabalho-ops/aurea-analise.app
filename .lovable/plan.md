

## Problema

Os botões "Exportar PDF" no editor e no preview são apenas visuais — não têm nenhuma função `onClick` implementada. Clicar neles não faz nada.

## Plano: Implementar Exportação PDF Real

### 1. Instalar dependências
- `jspdf` e `html2canvas` para renderizar o conteúdo HTML em PDF multi-página com qualidade

### 2. Criar utilitário de geração de PDF
**Novo arquivo:** `src/lib/pdf-export.ts`
- Função `exportReportToPDF()` que:
  - Captura o container do preview via `html2canvas` (scale: 2 para alta qualidade)
  - Gera PDF A4 multi-página com `jsPDF`
  - Nomeia o arquivo com o nome do cliente + data

### 3. Atualizar ReportPreviewPage
- Adicionar `onClick` no botão "Exportar PDF" que:
  - Envolve o conteúdo do relatório em um `div` com `id="report-content"`
  - Chama a função de export
  - Mostra toast de sucesso/erro

### 4. Atualizar ReportEditorPage
- Botão "Exportar PDF" redireciona para o preview e dispara o export, ou abre o preview em nova aba

### Resultado
- Clicar em "Exportar PDF" gera e baixa um PDF real com o layout do preview, respeitando cores do Brand Kit

