/**
 * Gemini 2.0 Flash API Integration
 * Generates intelligent, personalized analysis for digital audit reports
 */

import type { SiteSection, InstagramSection, GMNSection, PaidTrafficSection, CommercialSection, ExecutiveSummary, SummaryItem } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia da API Gemini');
  return text;
}

function ok(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return 'Não avaliado';
  return val ? 'OK' : 'NOK';
}

function okNok(val: 'ok' | 'nok' | null | undefined): string {
  if (val === null || val === undefined) return 'Não avaliado';
  return val === 'ok' ? 'OK' : 'NOK';
}

function feedLabel(v: string): string {
  const map: Record<string, string> = { daily: 'Diário', '3x_week': '3x por semana', '1x_week': '1x por semana', irregular: 'Irregular' };
  return map[v] || v || 'Não informado';
}

function storiesLabel(v: string): string {
  const map: Record<string, string> = { daily: 'Diário', '3-5x_week': '3-5x por semana', rare: 'Raro' };
  return map[v] || v || 'Não informado';
}

function responseTimeLabel(v: string): string {
  const map: Record<string, string> = {
    '5min': 'até 5 minutos',
    '30min': '5-30 minutos',
    '1h': '30min-1h',
    '2h': '1-2 horas',
    '24h': '2-24 horas',
    '24h+': 'mais de 24 horas',
  };
  return map[v] || v || 'Não informado';
}

function followUpLabel(v: string): string {
  const map: Record<string, string> = { '0': 'nenhum', '1': '1 follow-up', '2-3': '2-3 follow-ups', '4+': '4 ou mais follow-ups' };
  return map[v] || v || 'Não informado';
}

/**
 * Generates a complete executive summary for a digital audit report using Gemini AI.
 * Uses all fields from all 5 sections with correct context about what each means.
 */
export async function generateExecutiveSummaryWithAI(
  site: SiteSection,
  instagram: InstagramSection,
  gmn: GMNSection,
  paidTraffic: PaidTrafficSection,
  commercial: CommercialSection,
  clientName: string,
  disabledSections?: Record<string, boolean>
): Promise<ExecutiveSummary> {
  const enabledSections: string[] = [];
  if (!disabledSections?.site) enabledSections.push('site');
  if (!disabledSections?.instagram) enabledSections.push('instagram');
  if (!disabledSections?.gmn) enabledSections.push('gmn');
  if (!disabledSections?.paidTraffic) enabledSections.push('paidTraffic');
  if (!disabledSections?.commercial) enabledSections.push('commercial');

  const sitePart = disabledSections?.site ? '' : `
### SITE (Score: ${site.score}/100 | Peso no score geral: 40%)
- URL: ${site.siteUrl || 'Não informado'}
- PageSpeed Desktop: ${site.pageSpeed.desktopScore ?? 'N/A'}/100 (ideal ≥80; abaixo de 60 = crítico para ranqueamento)
- PageSpeed Mobile: ${site.pageSpeed.mobileScore ?? 'N/A'}/100 (mais importante que desktop; 70%+ do tráfego vem de celular)
- Pixel do Facebook instalado: ${ok(site.pixelTag.pixelInstalled)} (sem pixel = impossível fazer remarketing ou otimizar campanhas Meta)
- Google Tag/GTM instalado: ${ok(site.pixelTag.tagInstalled)} (sem tag = sem rastreamento de conversões no Google Ads)
- SEO - Keywords orgânicas: ${site.seo.organicKeywords ?? 'N/A'} (benchmark mínimo: 100)
- SEO - Tráfego orgânico/mês: ${site.seo.organicTraffic ?? 'N/A'} (benchmark mínimo: 500 visitas/mês)
- SEO - Domain Authority: ${site.seo.domainAuthority ?? 'N/A'} (benchmark mínimo: 20)
- SEO - Backlinks: ${site.seo.backlinks ?? 'N/A'} (benchmark mínimo: 50)
- Checklist UX:
  - Design transmite credibilidade: ${ok(site.checklist.credibleDesign)}
  - Botões e CTAs funcionando: ${ok(site.checklist.buttonsWorking)}
  - Redes sociais acessíveis: ${ok(site.checklist.socialAccessible)}
  - CTA acima da dobra (primeira tela sem scroll): ${ok(site.checklist.ctaFirstPage)}
- Prioridade identificada pelo auditor: ${site.priority}
- Observações do auditor: ${site.observations || 'Nenhuma'}`;

  const igPart = disabledSections?.instagram ? '' : `
### INSTAGRAM (Score: ${instagram.score}/100 | Peso no score geral: 25%)
- Perfil próprio da empresa/clínica: ${ok(instagram.profile.hasOwnProfile)} (sem perfil = score zero)
- @ (username): ${okNok(instagram.profile.handle)} (deve ser profissional e fácil de encontrar)
- Nome do perfil: ${okNok(instagram.profile.name)} (deve conter especialidade e/ou cidade)
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)} (deve ser foto profissional do médico ou logo)
- Bio — O que faz (especialidade clara): ${okNok(instagram.bio.whatDoes)}
- Bio — Onde atua (cidade/região): ${okNok(instagram.bio.whereOperates)}
- Bio — Autoridade (CRM, certificações, anos de exp.): ${okNok(instagram.bio.authority)}
- Bio — CTA (chamada para ação, ex: "Agende ↓"): ${okNok(instagram.bio.cta)}
- Bio — Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link com rastreamento UTM: ${ok(instagram.bio.linkTracking)} (sem UTM = não sabe quantos leads vêm do Instagram)
- Destaque "Quem Sou Eu": ${okNok(instagram.highlights.whoAmI)}
- Destaque "Prova Social" (depoimentos, antes/depois): ${okNok(instagram.highlights.socialProof)}
- Destaque "Autoridade" (diplomas, especializações): ${okNok(instagram.highlights.authority)}
- Destaque "Diferencial" (método único, tecnologia exclusiva): ${okNok(instagram.highlights.differential)}
- Post fixado "Quem Sou Eu": ${okNok(instagram.pinned.whoAmI)}
- Post fixado "Prova Social": ${okNok(instagram.pinned.socialProof)}
- Post fixado "Serviços ou Método": ${okNok(instagram.pinned.servicesOrMethod)}
- Frequência do feed: ${feedLabel(instagram.content.feedFrequency)} (ideal: ≥3x/semana)
- Frequência de stories: ${storiesLabel(instagram.content.storiesFrequency)} (ideal: diário)
- Observações do auditor: ${instagram.observations || 'Nenhuma'}`;

  const gmnPart = disabledSections?.gmn ? '' : `
### GOOGLE MEU NEGÓCIO / GMN (Score: ${gmn.score}/100 | Peso no score geral: 20%)
- Número de avaliações: ${gmn.reviewCount ?? 'N/A'}
- Comparação com concorrência (quantidade de avaliações): ${gmn.reviewComparison === 'above' ? 'Acima da média' : gmn.reviewComparison === 'average' ? 'Na média' : gmn.reviewComparison === 'below' ? 'Abaixo da média' : 'Não avaliado'}
- Nota média: ${gmn.averageRating ?? 'N/A'}/5.0 (abaixo de 4.0 afeta decisão de compra; ideal ≥4.5)
- Comparação da nota com concorrência: ${gmn.ratingComparison === 'above' ? 'Acima da média' : gmn.ratingComparison === 'average' ? 'Na média' : gmn.ratingComparison === 'below' ? 'Abaixo da média' : 'Não avaliado'}
- Saúde da ficha (health score): ${gmn.healthScore ?? 'N/A'}/100 (abaixo de 70 = informações desatualizadas)
- Checklist GMN:
  - NAP consistente (nome, endereço, telefone iguais em todos os canais): ${ok(gmn.checklist.napConsistent)}
  - Horários atualizados: ${ok(gmn.checklist.hoursUpdated)}
  - Categorias relevantes ao nicho: ${ok(gmn.checklist.relevantCategories)}
  - Fotos e vídeos atualizados: ${ok(gmn.checklist.photosVideosUpdated)}
  - Avaliações gerenciadas (proprietário responde): ${ok(gmn.checklist.reviewsManaged)}
  - Posts regulares no GMN (≥1x/semana): ${ok(gmn.checklist.regularPosts)}
- Observações do auditor: ${gmn.observations || 'Nenhuma'}`;

  const trafficPart = disabledSections?.paidTraffic ? '' : `
### TRÁFEGO PAGO (Score: ${paidTraffic.score}/100 | Peso no score geral: 10%)
GOOGLE ADS (canal de intenção — usuário pesquisa ativamente):
- Anunciando no Google Ads: ${ok(paidTraffic.googleAds.isAdvertising)}
- Quantidade de campanhas Google Ads: ${paidTraffic.googleAds.campaignCount ?? 'N/A'} (ideal ≥3 campanhas ativas)
- Criativos em vídeo no Google Ads: ${ok(paidTraffic.googleAds.hasVideoCreatives)} (vídeos têm 2-3x mais CTR que imagens)

META ADS / FACEBOOK (canal de autoridade e brand lift):
- Anunciando no Meta Ads: ${ok(paidTraffic.facebookAds.isAdvertising)}
- Quantidade de campanhas Meta Ads: ${paidTraffic.facebookAds.campaignCount ?? 'N/A'} (ideal ≥3 campanhas ativas)
- Criativos em vídeo no Meta Ads: ${ok(paidTraffic.facebookAds.hasVideoCreatives)}
- Observações do auditor: ${paidTraffic.observations || 'Nenhuma'}`;

  const commercialPart = disabledSections?.commercial ? '' : `
### COMERCIAL (Score: ${commercial.score}/100 | Peso no score geral: 5%)
- Tempo de resposta ao lead no WhatsApp: ${responseTimeLabel(commercial.leadResponseTime)} (leads respondidos em até 5 min têm 21x mais chance de converter)
- Quantidade de follow-ups após primeiro contato: ${followUpLabel(commercial.followUps)} (80% das vendas acontecem entre o 5º e 12º contato)
- Detalhe sobre follow-ups: ${commercial.followUpObservation || 'Não informado'}
- Observações do auditor: ${commercial.observations || 'Nenhuma'}`;

  const prompt = `Você é um especialista sênior em marketing digital e presença online para clínicas médicas e de estética. Você acabou de realizar uma auditoria digital completa do cliente "${clientName}" e precisa gerar um relatório executivo personalizado, direto e impactante.

## DADOS DA AUDITORIA
${sitePart}
${igPart}
${gmnPart}
${trafficPart}
${commercialPart}

## INSTRUÇÕES

Analise os dados acima com olhar crítico e estratégico. Considere:
- Scores baixos (abaixo de 60) em seções de alto peso (Site 40%, Instagram 25%, GMN 20%) são críticos
- NOK em pixel/tag significa impossibilidade de tráfego pago eficiente
- Sem UTM no Instagram = investimento em conteúdo sem rastreabilidade
- Nota GMN < 4.0 ou poucas avaliações = perda direta de pacientes para concorrentes
- Resposta lenta a leads = desperdício de todo o investimento em marketing

Gere uma análise PERSONALIZADA e ESPECÍFICA para este cliente. Não use frases genéricas. Mencione os números reais, compare com benchmarks, e indique o impacto real no negócio.

## FORMATO DE RESPOSTA

Responda APENAS com JSON válido, sem texto antes ou depois, sem markdown code blocks:

{
  "topProblems": [
    {
      "title": "Título curto e direto do problema",
      "priority": "urgent|high|medium|low",
      "description": "Descrição específica com números reais e impacto no negócio (máx 2 frases)"
    }
  ],
  "topOpportunities": [
    {
      "title": "Título da oportunidade",
      "priority": "urgent|high|medium|low",
      "description": "Oportunidade específica com potencial quantificado quando possível"
    }
  ],
  "recommendedPlan": {
    "days7": ["ação imediata 1", "ação imediata 2", "ação imediata 3"],
    "days30": ["ação de médio prazo 1", "ação de médio prazo 2", "ação de médio prazo 3"],
    "days90": ["ação estratégica 1", "ação estratégica 2", "ação estratégica 3"]
  }
}

Regras:
- topProblems: 3 a 5 problemas, ordenados por prioridade (urgent primeiro)
- topOpportunities: 2 a 4 oportunidades reais baseadas nos dados
- days7: ações que podem ser feitas em até 7 dias (rápidas, alto impacto)
- days30: ações que levam até 30 dias para implementar
- days90: ações estratégicas de médio prazo
- Cada ação deve ser específica e acionável, não genérica
- Cite dados reais quando relevante (ex: "Score mobile de X é crítico para SEO")`;

  const raw = await callGemini(prompt);

  // Strip possible markdown code block wrapping
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const toSummaryItems = (arr: any[]): SummaryItem[] =>
    Array.isArray(arr)
      ? arr.map((item: any) => ({
          title: String(item.title || ''),
          priority: (['urgent', 'high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium') as SummaryItem['priority'],
          description: String(item.description || ''),
        }))
      : [];

  const toStringArray = (arr: any[]): string[] =>
    Array.isArray(arr) ? arr.map(String) : [];

  return {
    topProblems: toSummaryItems(parsed.topProblems),
    topOpportunities: toSummaryItems(parsed.topOpportunities),
    recommendedPlan: {
      days7: toStringArray(parsed.recommendedPlan?.days7),
      days30: toStringArray(parsed.recommendedPlan?.days30),
      days90: toStringArray(parsed.recommendedPlan?.days90),
    },
  };
}

export interface SectionTexts {
  site: { observations: string; recommendations: string[] };
  instagram: { observations: string; recommendations: string[] };
  gmn: { observations: string; recommendations: string[] };
  paidTraffic: { observations: string; recommendations: string[] };
  commercial: { observations: string; recommendations: string[] };
}

/**
 * Generates observations and recommendations for all report sections based on the filled data.
 * This is used to auto-fill the text fields in the report editor.
 */
export async function generateSectionTextsWithAI(
  site: SiteSection,
  instagram: InstagramSection,
  gmn: GMNSection,
  paidTraffic: PaidTrafficSection,
  commercial: CommercialSection,
  clientName: string,
  disabledSections?: Record<string, boolean>
): Promise<SectionTexts> {
  const prompt = `Você é um consultor sênior de marketing digital especializado em clínicas médicas e de estética. Você realizou uma auditoria digital completa e precisa redigir as observações e recomendações de cada seção do relatório para o cliente "${clientName}".

## DADOS DA AUDITORIA

### SITE (Score: ${site.score}/100)
- PageSpeed Desktop: ${site.pageSpeed.desktopScore ?? 'N/A'}/100
- PageSpeed Mobile: ${site.pageSpeed.mobileScore ?? 'N/A'}/100 (mobile-first; ideal ≥80)
- Pixel Facebook instalado: ${ok(site.pixelTag.pixelInstalled)}
- Google Tag instalado: ${ok(site.pixelTag.tagInstalled)}
- Keywords orgânicas: ${site.seo.organicKeywords ?? 'N/A'} (benchmark: ≥100)
- Tráfego orgânico/mês: ${site.seo.organicTraffic ?? 'N/A'} (benchmark: ≥500)
- Domain Authority: ${site.seo.domainAuthority ?? 'N/A'} (benchmark: ≥20)
- Backlinks: ${site.seo.backlinks ?? 'N/A'} (benchmark: ≥50)
- Design credível: ${ok(site.checklist.credibleDesign)}
- Botões funcionando: ${ok(site.checklist.buttonsWorking)}
- Redes sociais acessíveis: ${ok(site.checklist.socialAccessible)}
- CTA acima da dobra: ${ok(site.checklist.ctaFirstPage)}
- Prioridade: ${site.priority}
- Observações existentes: ${site.observations || 'nenhuma'}

### INSTAGRAM (Score: ${instagram.score}/100)
- Perfil próprio: ${ok(instagram.profile.hasOwnProfile)}
- @ profissional: ${okNok(instagram.profile.handle)}
- Nome do perfil: ${okNok(instagram.profile.name)}
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)}
- Bio — o que faz: ${okNok(instagram.bio.whatDoes)}
- Bio — onde atua: ${okNok(instagram.bio.whereOperates)}
- Bio — autoridade: ${okNok(instagram.bio.authority)}
- Bio — CTA: ${okNok(instagram.bio.cta)}
- Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link com UTM: ${ok(instagram.bio.linkTracking)}
- Destaque Quem Sou: ${okNok(instagram.highlights.whoAmI)}
- Destaque Prova Social: ${okNok(instagram.highlights.socialProof)}
- Destaque Autoridade: ${okNok(instagram.highlights.authority)}
- Destaque Diferencial: ${okNok(instagram.highlights.differential)}
- Fixado Quem Sou: ${okNok(instagram.pinned.whoAmI)}
- Fixado Prova Social: ${okNok(instagram.pinned.socialProof)}
- Fixado Serviços/Método: ${okNok(instagram.pinned.servicesOrMethod)}
- Frequência feed: ${feedLabel(instagram.content.feedFrequency)}
- Frequência stories: ${storiesLabel(instagram.content.storiesFrequency)}
- Observações existentes: ${instagram.observations || 'nenhuma'}

### GOOGLE MEU NEGÓCIO (Score: ${gmn.score}/100)
- Avaliações: ${gmn.reviewCount ?? 'N/A'} (vs concorrência: ${gmn.reviewComparison ?? 'N/A'})
- Nota média: ${gmn.averageRating ?? 'N/A'}/5.0 (vs concorrência: ${gmn.ratingComparison ?? 'N/A'})
- Health score da ficha: ${gmn.healthScore ?? 'N/A'}/100
- NAP consistente: ${ok(gmn.checklist.napConsistent)}
- Horários atualizados: ${ok(gmn.checklist.hoursUpdated)}
- Categorias relevantes: ${ok(gmn.checklist.relevantCategories)}
- Fotos/vídeos atualizados: ${ok(gmn.checklist.photosVideosUpdated)}
- Avaliações respondidas: ${ok(gmn.checklist.reviewsManaged)}
- Posts regulares: ${ok(gmn.checklist.regularPosts)}
- Observações existentes: ${gmn.observations || 'nenhuma'}

### TRÁFEGO PAGO (Score: ${paidTraffic.score}/100)
- Google Ads ativo: ${ok(paidTraffic.googleAds.isAdvertising)}
- Campanhas Google Ads: ${paidTraffic.googleAds.campaignCount ?? 'N/A'}
- Vídeos no Google Ads: ${ok(paidTraffic.googleAds.hasVideoCreatives)}
- Meta Ads ativo: ${ok(paidTraffic.facebookAds.isAdvertising)}
- Campanhas Meta Ads: ${paidTraffic.facebookAds.campaignCount ?? 'N/A'}
- Vídeos no Meta Ads: ${ok(paidTraffic.facebookAds.hasVideoCreatives)}
- Observações existentes: ${paidTraffic.observations || 'nenhuma'}

### COMERCIAL (Score: ${commercial.score}/100)
- Tempo de resposta ao lead: ${responseTimeLabel(commercial.leadResponseTime)}
- Follow-ups realizados: ${followUpLabel(commercial.followUps)}
- Detalhe follow-up: ${commercial.followUpObservation || 'não informado'}
- Observações existentes: ${commercial.observations || 'nenhuma'}

## INSTRUÇÕES

Para cada seção, redija:
1. **observations**: Um parágrafo analítico de 3 a 5 frases. Seja direto, profissional e específico. Use os dados reais. Explique o que está bem e o que está ruim. Indique o impacto no negócio. Escreva em primeira pessoa do plural (ex: "Identificamos que...").
2. **recommendations**: Lista de 3 a 5 recomendações práticas e acionáveis, específicas para este cliente. Cada recomendação é uma frase curta e direta.

Pule seções marcadas como desabilitadas: ${JSON.stringify(disabledSections || {})}.
Para seções desabilitadas, retorne strings vazias e arrays vazios.

Responda APENAS com JSON válido, sem texto antes ou depois, sem markdown code blocks:

{
  "site": {
    "observations": "texto das observações do site",
    "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"]
  },
  "instagram": {
    "observations": "texto das observações do instagram",
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "gmn": {
    "observations": "texto das observações do GMN",
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "paidTraffic": {
    "observations": "texto das observações de tráfego pago",
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "commercial": {
    "observations": "texto das observações comerciais",
    "recommendations": ["recomendação 1", "recomendação 2"]
  }
}`;

  const raw = await callGemini(prompt);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const toStr = (v: any): string => (typeof v === 'string' ? v : '');
  const toArr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

  return {
    site: { observations: toStr(parsed.site?.observations), recommendations: toArr(parsed.site?.recommendations) },
    instagram: { observations: toStr(parsed.instagram?.observations), recommendations: toArr(parsed.instagram?.recommendations) },
    gmn: { observations: toStr(parsed.gmn?.observations), recommendations: toArr(parsed.gmn?.recommendations) },
    paidTraffic: { observations: toStr(parsed.paidTraffic?.observations), recommendations: toArr(parsed.paidTraffic?.recommendations) },
    commercial: { observations: toStr(parsed.commercial?.observations), recommendations: toArr(parsed.commercial?.recommendations) },
  };
}
