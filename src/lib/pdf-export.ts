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
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
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

  // Clone the element to modify it
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Create a container div
  const container = document.createElement('div');
  container.appendChild(clonedElement);

  // Collect all stylesheets
  let styles = '';
  const styleSheets = document.styleSheets;
  
  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets[i] as CSSStyleSheet;
      try {
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];
            styles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed (e.g., cross-origin)
        console.warn('Could not access stylesheet, skipping:', sheet.href);
      }
    }
  } catch (e) {
    console.warn('Error collecting stylesheets:', e);
  }

  // Get computed styles for all elements and add them as inline styles
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((el) => {
    const computed = window.getComputedStyle(el as Element);
    let inlineStyle = '';
    
    // Copy important computed styles to inline style
    const stylesToCopy = [
      'display', 'position', 'margin', 'padding', 'border', 'background',
      'backgroundColor', 'color', 'fontSize', 'fontFamily', 'fontWeight',
      'width', 'height', 'top', 'left', 'right', 'bottom', 'float', 'clear',
      'textAlign', 'lineHeight', 'opacity', 'zIndex', 'flexDirection',
      'justifyContent', 'alignItems', 'flexWrap', 'gap', 'borderRadius',
      'boxShadow', 'transform', 'transition', 'visibility', 'overflow'
    ];
    
    stylesToCopy.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        inlineStyle += `${prop}: ${value};`;
      }
    });
    
    if (inlineStyle) {
      (el as HTMLElement).setAttribute('style', inlineStyle);
    }
  });

  // Create HTML document
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      background: #f5f5f5;
    }

    .max-w-4xl {
      max-width: 56rem;
      margin-left: auto;
      margin-right: auto;
    }

    .bg-card {
      background-color: #ffffff;
    }

    .border {
      border: 1px solid #e0e0e0;
    }

    .rounded-2xl {
      border-radius: 1rem;
    }

    .overflow-hidden {
      overflow: hidden;
    }

    .mb-6 {
      margin-bottom: 1.5rem;
    }

    .p-12 {
      padding: 3rem;
    }

    .p-8 {
      padding: 2rem;
    }

    .p-4 {
      padding: 1rem;
    }

    .h-full {
      height: 100%;
    }

    .w-32 {
      width: 8rem;
    }

    .h-32 {
      height: 8rem;
    }

    .w-16 {
      width: 4rem;
    }

    .h-16 {
      height: 4rem;
    }

    .flex {
      display: flex;
    }

    .flex-col {
      flex-direction: column;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    .gap-3 {
      gap: 0.75rem;
    }

    .gap-4 {
      gap: 1rem;
    }

    .text-center {
      text-align: center;
    }

    .object-contain {
      object-fit: contain;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .mb-6 {
        page-break-inside: avoid;
      }
    }

    ${styles}
  </style>
</head>
<body>
  ${container.innerHTML}
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 5000);
}
