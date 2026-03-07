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

  // Temporarily expand element for full-quality render
  const originalStyle = element.getAttribute('style') || '';
  element.style.width = '900px';
  element.style.maxWidth = '900px';
  element.style.position = 'relative';

  // Wait for fonts and images to load
  await document.fonts.ready;

  // Convert external images to data URLs to avoid CORS issues
  const imgs = element.querySelectorAll('img');
  const imgRestorations: Array<{ img: HTMLImageElement; src: string }> = [];
  for (const img of imgs) {
    if (img.src && !img.src.startsWith('data:') && img.complete && img.naturalWidth > 0) {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = c.toDataURL('image/png');
          imgRestorations.push({ img, src: img.src });
          img.src = dataUrl;
        }
      } catch {
        // CORS blocked — skip
      }
    }
  }

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 900,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 10000,
      onclone: (clonedDoc) => {
        // Ensure all text renders sharply in clone
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.fontSmoothing = 'antialiased';
          (clonedEl.style as any).webkitFontSmoothing = 'antialiased';
        }
      },
    });
  } finally {
    // Restore original styles and image sources
    element.setAttribute('style', originalStyle);
    for (const { img, src } of imgRestorations) {
      img.src = src;
    }
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pdfWidth - margin * 2;
  const pageHeightPx = (pdfHeight - margin * 2) * (canvas.width / usableWidth);

  let heightLeft = canvas.height;
  let sourceY = 0;
  let firstPage = true;

  while (heightLeft > 0) {
    if (!firstPage) pdf.addPage();
    firstPage = false;

    const sliceHeight = Math.min(pageHeightPx, heightLeft);

    // Create a slice canvas for this page
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    }

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const imgHeightMm = (sliceHeight * usableWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeightMm);

    sourceY += sliceHeight;
    heightLeft -= sliceHeight;
  }

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
