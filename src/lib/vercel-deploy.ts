import { Report, Client, ReportSections, ReportBranding } from '@/types';

// Stable production URL of the main app
const APP_URL = 'https://aurea-analise-digital.vercel.app';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Generates an HTML page that redirects to the app's landing page.
 * This way the client sees the real DynamicLandingPage design,
 * but the URL has the client's name (e.g. clinica-bem-estar-relatorio.vercel.app).
 */
export function generateClientReportHTML(
  _report: Report,
  _client: Client,
  _sections: ReportSections,
  _branding: ReportBranding | null,
  reportId: string,
): string {
  const targetUrl = `${APP_URL}/r/${reportId}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <title>Relatório de Auditoria Digital</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .msg { text-align: center; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="msg">
    <div class="spinner"></div>
    <p>Abrindo relatório...</p>
  </div>
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;
}

export async function deployToVercel(
  htmlContent: string,
  clientName: string,
  token: string,
): Promise<{ url: string }> {
  const projectName = slugify(`${clientName}-relatorio`);
  const encoded = btoa(unescape(encodeURIComponent(htmlContent)));

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: [
        { file: 'index.html', data: encoded, encoding: 'base64' },
      ],
      projectSettings: { framework: null },
      target: 'production',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ${response.status} ao criar deploy no Vercel`);
  }

  const data = await response.json();

  // Poll until ready (max ~2.5 min)
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const status = await statusRes.json();
    if (status.readyState === 'READY') {
      return { url: `https://${status.url}` };
    }
    if (status.readyState === 'ERROR') {
      throw new Error('Deploy falhou no Vercel. Tente novamente.');
    }
  }

  return { url: `https://${data.url}` };
}
