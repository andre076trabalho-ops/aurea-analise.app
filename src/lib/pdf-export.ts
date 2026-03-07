/**
 * PDF Export via browser native print.
 * Produces perfect quality PDFs with correct page breaks.
 */
export async function exportReportToPDF(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Elemento do relatório não encontrado');

  // Collect all stylesheets
  let styles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
          styles += rule.cssText + '\n';
        }
      } catch {}
    }
  } catch {}

  // Clone and convert images to data URLs
  const clone = element.cloneNode(true) as HTMLElement;
  const imgs = Array.from(clone.querySelectorAll('img'));
  await Promise.all(imgs.map(async (img) => {
    if (!img.src || img.src.startsWith('data:')) return;
    try {
      const original = element.querySelector(`img[alt="${img.alt}"]`) as HTMLImageElement;
      const source = (original?.naturalWidth ? original : img);
      const c = document.createElement('canvas');
      c.width = source.naturalWidth || 200;
      c.height = source.naturalHeight || 200;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0);
        img.src = c.toDataURL('image/png');
      }
    } catch {}
  }));

  const printWindow = window.open('', '_blank', 'width=960,height=800');
  if (!printWindow) {
    throw new Error('Popup bloqueado. Permita popups para este site e tente novamente.');
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
  <style>
    ${styles}

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      background: #FAF9F5 !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Inter', sans-serif !important;
    }

    body {
      padding: 0 20px 20px !important;
      max-width: 900px !important;
      margin: 0 auto !important;
    }

    /* Fix CSS variables for print */
    :root {
      --primary: 160 84% 39%;
      --card: 0 0% 100%;
      --border: 214 32% 91%;
      --background: 0 0% 100%;
      --foreground: 222 47% 11%;
      --muted-foreground: 215 16% 47%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --accent: 210 40% 96%;
      --success: 142 76% 36%;
      --warning: 38 92% 50%;
      --error: 0 84% 60%;
    }

    /* Fix gradient backgrounds that html2canvas can't handle */
    .bg-gradient-to-br,
    [class*="from-primary"] {
      background: #f0fdf4 !important;
    }

    /* ── Page break rules ── */

    /* Cover page: occupies the full first page */
    [class*="aspect-"] {
      height: 265mm !important;
      aspect-ratio: auto !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
    }

    /* Cards and sections: never cut in the middle */
    .rounded-2xl,
    .rounded-xl,
    .rounded-lg {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Grid cells, list items, metric blocks */
    .grid > *,
    .space-y-1 > *,
    .space-y-2 > *,
    .space-y-6 > *,
    .gap-4 > *,
    .gap-6 > * {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Section block wrappers */
    .mb-6,
    .mt-8,
    .p-8,
    .p-6 {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`);

  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => { try { printWindow.close(); } catch {} }, 2000);
    }, 900);
  };

  // Fallback
  setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus();
      printWindow.print();
    }
  }, 2800);
}

export function exportReportToHTML(
  elementId: string,
  filename: string
): void {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Elemento do relatório não encontrado');

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

  const cloned = element.cloneNode(true) as HTMLElement;
  let globalStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
          globalStyles += rule.cssText + '\n';
        }
      } catch {}
    }
  } catch {}

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    ${globalStyles}
    body { max-width: 900px; margin: 0 auto; padding: 20px; background: #FAF9F5; }
  </style>
</head>
<body>${cloned.outerHTML}</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.html`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
}
