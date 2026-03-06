import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportToPDF(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do relatório não encontrado');
  }

  // Convert linked images to data URLs for export
  const imgs = element.querySelectorAll('img');
  for (const img of imgs) {
    if (img.src && !img.src.startsWith('data:')) {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          img.src = c.toDataURL('image/png');
        }
      } catch {}
    }
  }

  // Add print-optimized styles temporarily
  element.style.width = '800px';
  element.style.maxWidth = '800px';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 800,
  });

  // Remove temporary styles
  element.style.width = '';
  element.style.maxWidth = '';

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 5;
  const usableWidth = pdfWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
  heightLeft -= (pdfHeight - margin * 2);

  while (heightLeft > 0) {
    position -= (pdfHeight - margin * 2);
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight);
    heightLeft -= (pdfHeight - margin * 2);
  }

  // Try direct download first, fallback to opening in new tab
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    const pdfDataUri = pdf.output('datauristring');
    window.open(pdfDataUri, '_blank');
  }
}

export function exportReportToHTML(
  elementId: string,
  filename: string
): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do relatório não encontrado');
  }

  // Convert images to data URLs
  element.querySelectorAll('img').forEach(img => {
    if (img instanceof HTMLImageElement && img.src && !img.src.startsWith('data:')) {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        img.src = c.toDataURL('image/png');
      } catch {}
    }
  });

  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Collect all CSS from stylesheets
  let globalStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = (sheet as CSSStyleSheet).cssRules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            globalStyles += rule.cssText + '\n';
          }
        }
      } catch {}
    }
  } catch {}

  const htmlDocument = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    ${globalStyles}
    @media print {
      body { margin: 0; padding: 0; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    body {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #FAF9F5;
    }
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

  try {
    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar HTML:', error);
    throw new Error('Falha ao criar o arquivo HTML para download');
  }
}
