import { Report, Client, ReportSections, ReportBranding } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Bom';
  if (score >= 60) return 'Regular';
  return 'Crítico';
}

function boolBadge(value: boolean | null): string {
  if (value === null) return '<span style="color:#94a3b8">—</span>';
  return value
    ? '<span style="color:#22c55e;font-weight:600">✓ Sim</span>'
    : '<span style="color:#ef4444;font-weight:600">✗ Não</span>';
}

function scoreRing(score: number, size = 80): string {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);
  const fontSize = size >= 100 ? '28px' : size >= 60 ? '16px' : '13px';
  return `
    <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center">
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="8"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <span style="font-size:${fontSize};font-weight:800;color:${color};line-height:1">${score}</span>
        <span style="font-size:9px;color:#94a3b8">/100</span>
      </div>
    </div>`;
}

function metricCell(label: string, value: string): string {
  return `
    <div style="padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${label}</div>
      <div style="font-size:13px;font-weight:600;color:#1e293b">${value}</div>
    </div>`;
}

function sectionBlock(
  emoji: string,
  title: string,
  score: number,
  metricsHtml: string,
  observations?: string,
  recommendations?: string[],
): string {
  const hasExtra = observations || (recommendations && recommendations.length > 0);
  return `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;margin-bottom:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:48px;height:48px;border-radius:14px;background:${scoreColor(score)}20;display:flex;align-items:center;justify-content:center;font-size:22px">${emoji}</div>
          <div>
            <h3 style="font-size:17px;font-weight:700;color:#1e293b;margin:0">${title}</h3>
            <p style="font-size:13px;font-weight:600;color:${scoreColor(score)};margin:0">${scoreLabel(score)}</p>
          </div>
        </div>
        ${scoreRing(score, 72)}
      </div>
      <div style="padding:20px 24px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px${hasExtra ? ';margin-bottom:16px' : ''}">
          ${metricsHtml}
        </div>
        ${observations ? `<p style="font-size:13px;color:#64748b;line-height:1.6;margin-bottom:${recommendations?.length ? '16px' : '0'}">${observations}</p>` : ''}
        ${recommendations && recommendations.length > 0 ? `
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px">
            <p style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:10px">✨ Recomendações</p>
            <ul style="margin:0;padding-left:0;list-style:none">
              ${recommendations.map(r => `<li style="font-size:13px;color:#374151;margin-bottom:6px;display:flex;align-items:flex-start;gap:6px"><span style="color:#16a34a;margin-top:2px">→</span>${r}</li>`).join('')}
            </ul>
          </div>` : ''}
      </div>
    </div>`;
}

export function generateClientReportHTML(
  report: Report,
  client: Client,
  sections: ReportSections,
  branding: ReportBranding | null,
): string {
  const clientName = branding?.businessName || client.name;
  const reportDate = new Date(report.date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const disabled = sections.disabledSections || {};

  const activeScores = [
    !disabled.site && { weight: 0.4, score: sections.site.score },
    !disabled.instagram && { weight: 0.25, score: sections.instagram.score },
    !disabled.gmn && { weight: 0.2, score: sections.gmn.score },
    !disabled.paidTraffic && { weight: 0.1, score: sections.paidTraffic.score },
    !disabled.commercial && { weight: 0.05, score: sections.commercial.score },
  ].filter(Boolean) as { weight: number; score: number }[];

  const totalWeight = activeScores.reduce((s, a) => s + a.weight, 0);
  const overallScore = totalWeight > 0
    ? Math.round(activeScores.reduce((s, a) => s + a.score * (a.weight / totalWeight), 0))
    : 0;

  const s = sections;
  const whatsappNumber = branding?.whatsappNumber || s.commercial.whatsappNumbers?.[0] || '';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
  const whatsappCTA = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('Olá, vi o relatório de auditoria digital e gostaria de conversar sobre as melhorias recomendadas.')}`
    : '';

  const activePillars = [
    !disabled.site && { emoji: '🌐', label: 'Site', score: s.site.score },
    !disabled.instagram && { emoji: '📸', label: 'Instagram', score: s.instagram.score },
    !disabled.gmn && { emoji: '📍', label: 'Google Meu Negócio', score: s.gmn.score },
    !disabled.paidTraffic && { emoji: '📢', label: 'Tráfego Pago', score: s.paidTraffic.score },
    !disabled.commercial && { emoji: '💼', label: 'Comercial', score: s.commercial.score },
  ].filter(Boolean) as { emoji: string; label: string; score: number }[];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Auditoria Digital — ${clientName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
    .container{max-width:900px;margin:0 auto;padding:0 24px}
    @media(max-width:640px){
      .pillars-grid{grid-template-columns:repeat(2,1fr)!important}
      .metrics-grid{grid-template-columns:repeat(2,1fr)!important}
      .action-grid{grid-template-columns:1fr!important}
      .hero-title{font-size:32px!important}
    }
    @media print{
      section{page-break-inside:avoid}
      .no-print{display:none!important}
    }
  </style>
</head>
<body>

<!-- HERO -->
<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;text-align:center;padding:60px 24px">
  ${branding?.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${clientName}" style="height:80px;object-fit:contain;margin-bottom:48px">`
    : `<div style="width:64px;height:64px;background:linear-gradient(135deg,#10b981,#059669);border-radius:20px;margin:0 auto 48px;display:flex;align-items:center;justify-content:center;font-size:30px">🌿</div>`
  }
  <h1 class="hero-title" style="font-size:42px;font-weight:800;color:#10b981;margin-bottom:8px;letter-spacing:-1px">Relatório de Auditoria</h1>
  <p style="font-size:18px;color:#64748b;margin-bottom:32px">Presença Digital</p>
  <div style="width:64px;height:3px;background:#10b981;margin:0 auto 32px;border-radius:99px"></div>
  <p style="font-size:18px;font-weight:700;color:#10b981;margin-bottom:8px">${clientName}</p>
  <p style="font-size:14px;color:#94a3b8">${reportDate}</p>
  <p style="margin-top:60px;font-size:13px;color:#cbd5e1">↓ Veja o relatório completo</p>
</section>

<!-- SCORE GERAL -->
<section style="padding:80px 24px;background:#f8fafc">
  <div class="container" style="text-align:center">
    ${scoreRing(overallScore, 160)}
    <p style="color:#64748b;margin-top:16px;font-size:15px;font-weight:500">Score Geral da Presença Digital</p>
  </div>
</section>

<!-- PILARES -->
<section style="padding:60px 24px">
  <div class="container">
    <h2 style="font-size:32px;font-weight:800;text-align:center;margin-bottom:12px">Diagnóstico Digital</h2>
    <p style="color:#64748b;text-align:center;margin-bottom:48px;font-size:15px">Análise dos pilares que impactam a presença digital</p>
    <div class="pillars-grid" style="display:grid;grid-template-columns:repeat(${activePillars.length},1fr);gap:16px">
      ${activePillars.map(p => `
        <div style="text-align:center;padding:20px 12px;border-radius:20px;border:1px solid ${scoreColor(p.score)}40;background:${scoreColor(p.score)}08">
          <div style="font-size:24px;margin-bottom:12px">${p.emoji}</div>
          ${scoreRing(p.score, 64)}
          <p style="font-size:12px;font-weight:600;margin-top:10px;color:#374151">${p.label}</p>
        </div>`).join('')}
    </div>
  </div>
</section>

<!-- SEÇÕES DETALHADAS -->
<section style="padding:0 24px 60px">
  <div class="container">
    ${!disabled.site ? sectionBlock('🌐', 'Site', s.site.score, [
      metricCell('PageSpeed Desktop', String(s.site.pageSpeed.desktopScore ?? '—')),
      metricCell('PageSpeed Mobile', String(s.site.pageSpeed.mobileScore ?? '—')),
      metricCell('Domain Authority', String(s.site.seo.domainAuthority ?? '—')),
      metricCell('Keywords Orgânicas', String(s.site.seo.organicKeywords ?? '—')),
      metricCell('Pixel Instalado', boolBadge(s.site.pixelTag.pixelInstalled)),
      metricCell('Tag Instalada', boolBadge(s.site.pixelTag.tagInstalled)),
    ].join(''), s.site.observations, s.site.recommendations) : ''}

    ${!disabled.instagram ? sectionBlock('📸', 'Instagram', s.instagram.score, [
      metricCell('Perfil Próprio', boolBadge(s.instagram.profile.hasOwnProfile)),
      metricCell('Bio Completa', boolBadge(s.instagram.bio.whatDoes === 'ok')),
      metricCell('CTA na Bio', boolBadge(s.instagram.bio.cta === 'ok')),
      metricCell('Link na Bio', boolBadge(s.instagram.bio.linkInBio === 'ok')),
      metricCell('Frequência Feed', s.instagram.content.feedFrequency || '—'),
      metricCell('Frequência Stories', s.instagram.content.storiesFrequency || '—'),
    ].join(''), s.instagram.observations, s.instagram.recommendations) : ''}

    ${!disabled.gmn ? sectionBlock('📍', 'Google Meu Negócio', s.gmn.score, [
      metricCell('Avaliações', String(s.gmn.reviewCount ?? '—')),
      metricCell('Nota Média', String(s.gmn.averageRating ?? '—')),
      metricCell('Health Score', String(s.gmn.healthScore ?? '—')),
      metricCell('NAP Consistente', boolBadge(s.gmn.checklist.napConsistent)),
      metricCell('Fotos Atualizadas', boolBadge(s.gmn.checklist.photosVideosUpdated)),
      metricCell('Posts Regulares', boolBadge(s.gmn.checklist.regularPosts)),
    ].join(''), s.gmn.observations, s.gmn.recommendations) : ''}

    ${!disabled.paidTraffic ? sectionBlock('📢', 'Tráfego Pago', s.paidTraffic.score, [
      metricCell('Google Ads Ativo', boolBadge(s.paidTraffic.googleAds.isAdvertising)),
      metricCell('Campanhas Google', String(s.paidTraffic.googleAds.campaignCount ?? '—')),
      metricCell('Vídeos Google', boolBadge(s.paidTraffic.googleAds.hasVideoCreatives)),
      metricCell('Facebook Ads Ativo', boolBadge(s.paidTraffic.facebookAds.isAdvertising)),
      metricCell('Campanhas Facebook', String(s.paidTraffic.facebookAds.campaignCount ?? '—')),
      metricCell('Vídeos Facebook', boolBadge(s.paidTraffic.facebookAds.hasVideoCreatives)),
    ].join(''), s.paidTraffic.observations, s.paidTraffic.recommendations) : ''}

    ${!disabled.commercial ? sectionBlock('💼', 'Comercial', s.commercial.score, [
      metricCell('Tempo de Resposta', s.commercial.leadResponseTime || '—'),
      metricCell('Follow-ups', s.commercial.followUps || '—'),
      metricCell('Observação', s.commercial.followUpObservation || '—'),
    ].join(''), s.commercial.observations, s.commercial.recommendations) : ''}
  </div>
</section>

<!-- PLANO DE AÇÃO -->
<section style="padding:60px 24px;background:#fff">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;font-size:13px;font-weight:600;margin-bottom:16px">
        📅 Plano de Ação
      </div>
      <h2 style="font-size:32px;font-weight:800">Próximos Passos para ${clientName}</h2>
    </div>
    <div class="action-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
      <div style="padding:24px;border-radius:20px;border:1px solid #fecaca;background:#fef2f2">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:#fee2e2;display:flex;align-items:center;justify-content:center;font-size:18px">⚡</div>
          <div>
            <h3 style="font-size:16px;font-weight:700">7 dias</h3>
            <p style="font-size:12px;color:#94a3b8">Correções urgentes</p>
          </div>
        </div>
        <ul style="padding-left:0;list-style:none">
          ${([...s.site.recommendations.slice(0, 2), ...s.commercial.recommendations.slice(0, 1)].filter(Boolean).slice(0, 4).map(r => `<li style="font-size:13px;color:#374151;margin-bottom:8px;display:flex;gap:6px"><span style="color:#ef4444">→</span>${r}</li>`).join('')) || '<li style="font-size:13px;color:#94a3b8">Sem recomendações adicionadas</li>'}
        </ul>
      </div>
      <div style="padding:24px;border-radius:20px;border:1px solid #fed7aa;background:#fff7ed">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:#ffedd5;display:flex;align-items:center;justify-content:center;font-size:18px">📈</div>
          <div>
            <h3 style="font-size:16px;font-weight:700">30 dias</h3>
            <p style="font-size:12px;color:#94a3b8">Otimizações de base</p>
          </div>
        </div>
        <ul style="padding-left:0;list-style:none">
          ${([...s.instagram.recommendations.slice(0, 2), ...s.gmn.recommendations.slice(0, 2)].filter(Boolean).slice(0, 4).map(r => `<li style="font-size:13px;color:#374151;margin-bottom:8px;display:flex;gap:6px"><span style="color:#f59e0b">→</span>${r}</li>`).join('')) || '<li style="font-size:13px;color:#94a3b8">Sem recomendações adicionadas</li>'}
        </ul>
      </div>
      <div style="padding:24px;border-radius:20px;border:1px solid #bbf7d0;background:#f0fdf4">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:12px;background:#dcfce7;display:flex;align-items:center;justify-content:center;font-size:18px">🛡️</div>
          <div>
            <h3 style="font-size:16px;font-weight:700">90 dias</h3>
            <p style="font-size:12px;color:#94a3b8">Crescimento acelerado</p>
          </div>
        </div>
        <ul style="padding-left:0;list-style:none">
          ${([...s.paidTraffic.recommendations.slice(0, 2), ...s.instagram.recommendations.slice(2, 4)].filter(Boolean).slice(0, 4).map(r => `<li style="font-size:13px;color:#374151;margin-bottom:8px;display:flex;gap:6px"><span style="color:#22c55e">→</span>${r}</li>`).join('')) || '<li style="font-size:13px;color:#94a3b8">Sem recomendações adicionadas</li>'}
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section style="padding:80px 24px">
  <div class="container">
    <div style="max-width:600px;margin:0 auto;text-align:center;padding:60px 40px;border-radius:32px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0">
      ${branding?.professionalPhotoUrl
        ? `<img src="${branding.professionalPhotoUrl}" alt="${clientName}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:24px;border:3px solid #10b98133">`
        : ''}
      <h2 style="font-size:26px;font-weight:800;margin-bottom:16px">${clientName}, vamos elevar sua presença digital?</h2>
      <p style="color:#64748b;margin-bottom:32px;font-size:15px">Entre em contato para implementar as recomendações e atrair mais pacientes.</p>
      ${whatsappCTA
        ? `<a href="${whatsappCTA}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:16px 32px;border-radius:16px;background:#10b981;color:#fff;font-size:16px;font-weight:700;text-decoration:none">
            💬 Falar com um especialista
           </a>`
        : `<a href="https://wa.me/5511999718595" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:16px 32px;border-radius:16px;background:#10b981;color:#fff;font-size:16px;font-weight:700;text-decoration:none">
            💬 Falar com um especialista
           </a>`
      }
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer style="padding:32px 24px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="font-size:14px;color:#64748b">Relatório personalizado para <strong style="color:#1e293b">${clientName}</strong></p>
  <p style="font-size:12px;color:#94a3b8;margin-top:6px">Gerado por <strong style="color:#10b981">Áurea Performance</strong> • ${reportDate}</p>
</footer>

</body>
</html>`;
}

export async function deployToVercel(
  htmlContent: string,
  clientName: string,
  token: string,
): Promise<{ url: string }> {
  const projectName = slugify(`${clientName}-relatorio`);

  // Encode HTML to base64 safely (handles special characters)
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
        {
          file: 'index.html',
          data: encoded,
          encoding: 'base64',
        },
      ],
      projectSettings: {
        framework: null,
      },
      target: 'production',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ${response.status} ao criar deploy no Vercel`);
  }

  const data = await response.json();

  // Poll until ready (max ~60s)
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

  // Fallback: return URL even if polling timed out
  return { url: `https://${data.url}` };
}
