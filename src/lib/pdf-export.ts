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

  // convert links to data urls for export
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

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

  // add link annotations for any anchors inside element
  const links: {rect: DOMRect; href: string}[] = [];
  element.querySelectorAll('a').forEach(a => {
    if (a.href) {
      const rect = a.getBoundingClientRect();
      const parentRect = element.getBoundingClientRect();
      links.push({rect: new DOMRect(rect.left - parentRect.left, rect.top - parentRect.top, rect.width, rect.height), href: a.href});
    }
  });

  const addLinksToPage = (pageOffset: number) => {
    links.forEach(link => {
      const xPos = link.rect.left * (pdfWidth / canvas.width);
      const yPos = link.rect.top * (pdfWidth / canvas.width) - pageOffset;
      const w = link.rect.width * (pdfWidth / canvas.width);
      const h = link.rect.height * (pdfWidth / canvas.width);
      if (yPos >= 0 && yPos < pdfHeight) {
        pdf.link(xPos, yPos, w, h, { url: link.href });
      }
    });
  };

  addLinksToPage(0);

  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    addLinksToPage(-position);
    heightLeft -= pdfHeight;
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
    
    // Also try opening in new tab as fallback for iframe environments
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  } catch {
    // Fallback: open PDF in new window
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

  // convert images inside to data urls so they stay embedded
  element.querySelectorAll('img').forEach(img => {
    if (img instanceof HTMLImageElement && img.src && !img.src.startsWith('data:')) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      img.src = c.toDataURL('image/png');
    }
  });

  // Clone the element
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Helper function to get all computed styles
  const getComputedStyles = (el: Element): string => {
    const computed = window.getComputedStyle(el);
    let styles = '';
    
    const relevantProps = [
      'display', 'position', 'margin', 'padding', 'border', 'background-color',
      'color', 'font-size', 'font-family', 'font-weight', 'width', 'height',
      'text-align', 'line-height', 'opacity', 'z-index', 'flex-direction',
      'justify-content', 'align-items', 'flex-wrap', 'gap', 'border-radius',
      'box-shadow', 'transform', 'visibility', 'overflow', 'float', 'clear',
      'vertical-align', 'white-space', 'word-wrap', 'text-decoration'
    ];
    
    relevantProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'unset') {
        styles += `${prop}: ${value}; `;
      }
    });
    
    return styles;
  };

  // Apply computed styles to cloned element
  const applyStylesToClone = (original: Element, clone: Element) => {
    const computedStyle = getComputedStyles(original);
    if (computedStyle) {
      (clone as HTMLElement).setAttribute('style', computedStyle);
    }
    
    // Recursively apply to children
    const originalChildren = original.children;
    const cloneChildren = clone.children;
    
    for (let i = 0; i < Math.min(originalChildren.length, cloneChildren.length); i++) {
      applyStylesToClone(originalChildren[i], cloneChildren[i]);
    }
  };

  applyStylesToClone(element, clonedElement);

  // Collect critical CSS from all stylesheets (helps keep tailwind rules)
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
      } catch {} // some sheets may be cross-origin
    }
  } catch {}
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-8 { margin-top: 2rem; }
    
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .p-12 { padding: 3rem; }
    
    .w-full { width: 100%; }
    .w-32 { width: 8rem; }
    .w-16 { width: 4rem; }
    .w-10 { width: 2.5rem; }
    .w-4 { width: 1rem; }
    .w-5 { width: 1.25rem; }
    
    .h-full { height: 100%; }
    .h-32 { height: 8rem; }
    .h-16 { height: 4rem; }
    .h-10 { height: 2.5rem; }
    .h-4 { height: 1rem; }
    .h-5 { height: 1.25rem; }
    .h-1 { height: 0.25rem; }
    
    .object-contain { object-fit: contain; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-4xl { font-size: 2.25rem; }
    .text-lg { font-size: 1.125rem; }
    .text-base { font-size: 1rem; }
    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    
    .aspect-\\[8.5\\/11\\] { aspect-ratio: 8.5 / 11; }
    
    .border-b { border-bottom: 1px solid #e0e0e0; }
    .border-t { border-top: 1px solid #e0e0e0; }
    .border-border { border-color: #e0e0e0; }
    
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  `;

  // Create the complete HTML document
  const htmlDocument = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${filename}</title>
  <style>
    ${globalStyles}
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

  // Create blob and download
  try {
    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Erro ao exportar HTML:', error);
    throw new Error('Falha ao criar o arquivo HTML para download');
  }
}
