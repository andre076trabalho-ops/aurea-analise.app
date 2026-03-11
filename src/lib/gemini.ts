/**
 * Groq AI Integration (llama-3.3-70b-versatile)
 * Generates intelligent, personalized analysis for digital audit reports
 */

import type { SiteSection, InstagramSection, GMNSection, PaidTrafficSection, CommercialSection, ExecutiveSummary, SummaryItem } from '@/types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callAI(prompt: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = (errBody as any)?.error?.message || response.statusText;
    throw new Error(`Groq API (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Resposta vazia da API');
  return text;
}

// ── OpenAI GPT-4o-mini Vision ─────────────────────────────────────────────────
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface InstagramAnalysisResult {
  profile: { hasOwnProfile: boolean; handle: 'ok' | 'nok' | null; name: 'ok' | 'nok' | null; profilePhoto: 'ok' | 'nok' | null };
  bio: { whatDoes: 'ok' | 'nok' | null; whereOperates: 'ok' | 'nok' | null; authority: 'ok' | 'nok' | null; cta: 'ok' | 'nok' | null; linkInBio: 'ok' | 'nok' | null; linkTracking: boolean | null };
  highlights: { whoAmI: 'ok' | 'nok' | null; socialProof: 'ok' | 'nok' | null; authority: 'ok' | 'nok' | null; differential: 'ok' | 'nok' | null };
  pinned: { whoAmI: 'ok' | 'nok' | null; socialProof: 'ok' | 'nok' | null; servicesOrMethod: 'ok' | 'nok' | null };
  content: { feedFrequency: string; storiesFrequency: string };
  profileSummary: string;
}

export async function analyzeInstagramWithOpenAI(base64: string): Promise<InstagramAnalysisResult> {
  if (!OPENAI_API_KEY) throw new Error('VITE_OPENAI_API_KEY não configurada');

  const imageData = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;

  const systemPrompt = `Você é um analista especializado em perfis de Instagram para clínicas médicas e estéticas. Analise screenshots de perfis do Instagram e preencha um formulário de auditoria com precisão.

## DEFINIÇÕES DOS CRITÉRIOS (leia com atenção antes de analisar):

### PERFIL
- **handle (ok)**: username profissional, sem números aleatórios, relacionado ao negócio/médico
- **name (ok)**: nome do perfil contém especialidade E/OU cidade (ex: "Dra. Ana | Dermatologista SP")
- **profilePhoto (ok)**: foto profissional — foto do médico/profissional ou logo da clínica (não paisagem, selfie casual ou genérica)

### BIO
- **whatDoes (ok)**: a bio deixa CLARO qual é a especialidade/serviço oferecido (ex: "Dermatologista", "Clínica de Estética")
- **whereOperates (ok)**: a bio menciona cidade, estado ou região de atuação
- **authority (ok)**: bio menciona explicitamente um MÉTODO PRÓPRIO ou abordagem proprietária (ex: "Método X®", "Protocolo Y exclusivo") — credenciais genéricas (CRM, pós-graduação) NÃO contam
- **cta (ok)**: há chamada para ação clara na bio (ex: "Agende ↓", "Reserve sua consulta", "Clique no link", "WhatsApp ↓", seta apontando para o link)
- **linkInBio (ok)**: há um link visível na bio (link.tree, linktree, wa.me, site próprio, etc.)
- **linkTracking (true)**: o link aparenta ser uma página de rastreamento (Linktree, Beacons, Bio.site, página com múltiplos links) ou tem parâmetros UTM visíveis — indica que rastreia origem dos cliques

### DESTAQUES (Stories Highlights — círculos abaixo da bio)
- **whoAmI (ok)**: existe destaque com nome como "Quem sou", "Sobre mim", "Sobre", "Eu", "Dr./Dra." apresentando o profissional
- **socialProof (ok)**: existe destaque com depoimentos, resultados, antes/depois, feedbacks de pacientes (nomes como "Resultados", "Antes e Depois", "Depoimentos", "Reviews", "Clientes")
- **authority (ok)**: existe destaque mostrando MÉTODO EXCLUSIVO, protocolo próprio ou tecnologia específica usada pelo profissional (nomes como "Método", "Protocolo", "Tecnologia", nome do método)
- **differential (ok)**: existe destaque mostrando método exclusivo, tecnologia específica, abordagem proprietária, diferenciais únicos (nomes como "Método", "Tecnologia", "Diferencial", "Exclusivo", nome do método)

### POSTS FIXADOS (os 3 primeiros posts com ícone de pin/fixado)
- **whoAmI (ok)**: há post fixado apresentando o profissional/clínica (quem é, o que faz, apresentação)
- **socialProof (ok)**: há post fixado com depoimento, antes/depois, resultado de paciente
- **servicesOrMethod (ok)**: há post fixado sobre serviços oferecidos ou método/tratamento específico

### CONTEÚDO (estime pelo feed visível)
- **feedFrequency**: "daily" (parece postar todo dia), "3x_week" (3+ vezes por semana, feed cheio e recente), "1x_week" (menos frequente), "irregular" (gaps grandes, feed esparso ou desatualizado)
- **storiesFrequency**: "daily" (stories muito recentes/frequentes), "3-5x_week" (razoavelmente frequente), "rare" (poucos ou nenhum stories visível)

## REGRA IMPORTANTE:
- Retorne "nok" quando o elemento estiver AUSENTE ou claramente inadequado
- Retorne "ok" quando estiver PRESENTE e adequado
- Retorne null quando NÃO for possível avaliar pela imagem
- Se não conseguir ver destaques, posts fixados ou feed com clareza, use null

## REGRA CRÍTICA ANTI-ALUCINAÇÃO:
Se qualquer elemento não estiver claramente visível e legível na imagem, retorne null.
NÃO tente adivinhar. NÃO infira pelo contexto. Apenas null.

Responda APENAS com JSON válido, sem texto adicional.`;

  const userPrompt = `Analise este screenshot do perfil do Instagram e preencha o formulário de auditoria.

Retorne APENAS este JSON (sem markdown, sem texto extra):
{
  "profile": {
    "hasOwnProfile": true,
    "handle": "ok",
    "name": "ok",
    "profilePhoto": "ok"
  },
  "bio": {
    "whatDoes": "ok",
    "whereOperates": "nok",
    "authority": "ok",
    "cta": "ok",
    "linkInBio": "ok",
    "linkTracking": false
  },
  "highlights": {
    "whoAmI": "ok",
    "socialProof": "nok",
    "authority": "nok",
    "differential": "nok"
  },
  "pinned": {
    "whoAmI": "nok",
    "socialProof": "nok",
    "servicesOrMethod": "nok"
  },
  "content": {
    "feedFrequency": "3x_week",
    "storiesFrequency": "daily"
  },
  "profileSummary": "Resumo objetivo do perfil em 3-5 frases em português: o que está bem, o que está faltando, e o impacto no negócio."
}`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageData, detail: 'high' } },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = (errBody as any)?.error?.message || response.statusText;
    throw new Error(`OpenAI API (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Resposta vazia do GPT');

  return parseJSON(text) as InstagramAnalysisResult;
}

// ── Groq Vision (fallback interno) ───────────────────────────────────────────
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function analyzeInstagramImage(base64: string): Promise<string> {
  try {
    const imageData = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Você é um analista de marketing digital. Analise este print do perfil do Instagram e descreva objetivamente apenas o que está VISÍVEL na imagem:
- Nome do perfil e @ (se legível)
- Texto completo da bio (se legível)
- Tipo de foto de perfil (pessoal/logo/outro)
- Número de seguidores, seguindo e posts (se visível)
- Quantos destaques existem e quais são os títulos visíveis
- Quantos posts fixados e o que mostram
- Tipo de conteúdo dos últimos posts visíveis
- Link na bio (se visível)
Seja factual. Descreva apenas o que vê claramente. Se algo não está legível, não invente.`,
            },
            { type: 'image_url', image_url: { url: imageData } },
          ],
        }],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

function parseJSON(raw: string): any {
  // Strip markdown code blocks if present
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the outermost JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // Last resort: remove control characters and retry
        const sanitized = cleaned.slice(start, end + 1).replace(/[\x00-\x1F\x7F]/g, (c) =>
          c === '\n' || c === '\r' || c === '\t' ? c : ''
        );
        return JSON.parse(sanitized);
      }
    }
    throw new Error(`JSON inválido retornado pela IA: ${cleaned.slice(0, 200)}`);
  }
}

function ok(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return 'não avaliado';
  return val ? 'Sim' : 'Não';
}

function okNok(val: 'ok' | 'nok' | null | undefined): string {
  if (val === null || val === undefined) return 'não avaliado';
  return val === 'ok' ? 'Sim' : 'Não';
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
    '5min': 'até 5 minutos (~5 min)',
    '30min': '5-30 minutos (~30 min)',
    '1h': '30min-1h (~60 min)',
    '2h': '1-2 horas (~120 min)',
    '24h': '2-24 horas (~480 min)',
    '24h+': 'mais de 24 horas (>1440 min)',
  };
  return map[v] || v || 'Não informado';
}

function followUpLabel(v: string): string {
  const map: Record<string, string> = { '0': 'nenhum', '1': '1 follow-up', '2-3': '2-3 follow-ups', '4+': '4 ou mais follow-ups' };
  return map[v] || v || 'Não informado';
}

/**
 * Generates a complete executive summary for a digital audit report using AI.
 */
export async function generateExecutiveSummaryWithAI(
  site: SiteSection,
  instagram: InstagramSection,
  gmn: GMNSection,
  paidTraffic: PaidTrafficSection,
  commercial: CommercialSection,
  clientName: string,
  disabledSections?: Record<string, boolean>,
  profilePrintBase64?: string,
  profileSummary?: string
): Promise<ExecutiveSummary> {
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
REGRA CRÍTICA: O perfil do profissional EXISTE — estes dados foram coletados dele. Não mencione "perfil inexistente" como problema. O campo "perfil separado da clínica" abaixo é de BAIXO IMPACTO e deve ser ignorado na análise de problemas.
- Perfil separado da clínica (baixo impacto, ignore em problems): ${ok(instagram.profile.hasOwnProfile)}
- @ (username): ${okNok(instagram.profile.handle)}
- Nome do perfil: ${okNok(instagram.profile.name)}
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)}
- Bio — O que faz (especialidade clara): ${okNok(instagram.bio.whatDoes)}
- Bio — Onde atua (cidade/região): ${okNok(instagram.bio.whereOperates)}
- Bio — Método próprio visível na bio: ${okNok(instagram.bio.authority)} (BAIXO IMPACTO — diferencial, não obrigação)
- Bio — CTA (chamada para ação, ex: "Agende ↓"): ${okNok(instagram.bio.cta)}
- Bio — Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link de rastreamento na bio: ${ok(instagram.bio.linkTracking)}
- Destaques existentes no perfil:
  - Destaque "Quem Sou Eu": ${okNok(instagram.highlights.whoAmI)} ${instagram.highlights.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Destaque "Prova Social" (depoimentos, antes/depois): ${okNok(instagram.highlights.socialProof)} ${instagram.highlights.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Destaque "Método" (método exclusivo do profissional): ${okNok(instagram.highlights.authority)} ${instagram.highlights.authority === 'ok' ? '(EXISTE)' : '(AUSENTE)'} (BAIXO IMPACTO)
  - Destaque "Diferencial": ${okNok(instagram.highlights.differential)} ${instagram.highlights.differential === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
- Posts fixados no topo do perfil:
  - Post fixado "Quem Sou Eu": ${okNok(instagram.pinned.whoAmI)} ${instagram.pinned.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Post fixado "Prova Social": ${okNok(instagram.pinned.socialProof)} ${instagram.pinned.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Post fixado "Serviços ou Método": ${okNok(instagram.pinned.servicesOrMethod)} ${instagram.pinned.servicesOrMethod === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
ATENÇÃO: mencione apenas destaques/fixados AUSENTES — nunca diga que algo "não existe" se está marcado como (EXISTE)
- Frequência do feed: ${feedLabel(instagram.content.feedFrequency)} (ideal: ≥3x/semana)
- Frequência de stories: ${storiesLabel(instagram.content.storiesFrequency)} (ideal: diário)
- Observações do auditor: ${instagram.observations || 'Nenhuma'}`;

  const gmnPart = disabledSections?.gmn ? '' : `
### GOOGLE MEU NEGÓCIO / GMN (Score: ${gmn.score}/100 | Peso no score geral: 20%)
- Número de avaliações: ${gmn.reviewCount ?? 'N/A'} avaliações
- Posição vs. concorrência (avaliações): ${gmn.reviewComparison === 'above' ? 'Acima da média' : gmn.reviewComparison === 'average' ? 'Na média' : gmn.reviewComparison === 'below' ? 'Abaixo da média — concorrentes têm mais avaliações' : 'Não avaliado'}
- Nota média: ${gmn.averageRating ?? 'N/A'}/5.0${gmn.averageRating !== null && gmn.averageRating < 4.0 ? ' ⚠️ CRÍTICO: abaixo de 4.0' : gmn.averageRating !== null && gmn.averageRating < 4.5 ? ' (ideal ≥4.5)' : ''}
- Posição da nota vs. concorrência: ${gmn.ratingComparison === 'above' ? 'Acima da média' : gmn.ratingComparison === 'average' ? 'Na média' : gmn.ratingComparison === 'below' ? 'Abaixo da média' : 'Não avaliado'}
- Completude da ficha (health score): ${gmn.healthScore ?? 'N/A'}/100${gmn.healthScore !== null && gmn.healthScore < 70 ? ' ⚠️ abaixo de 70 = informações desatualizadas' : ''}
- Checklist GMN:
  - NAP consistente: ${ok(gmn.checklist.napConsistent)}
  - Horários atualizados: ${ok(gmn.checklist.hoursUpdated)}
  - Categorias relevantes: ${ok(gmn.checklist.relevantCategories)}
  - Fotos e vídeos atualizados: ${ok(gmn.checklist.photosVideosUpdated)}
  - Avaliações respondidas pelo proprietário: ${ok(gmn.checklist.reviewsManaged)}
  - Posts regulares no GMN: ${ok(gmn.checklist.regularPosts)}
- Observações do auditor: ${gmn.observations || 'Nenhuma'}`;

  const trafficPart = disabledSections?.paidTraffic ? '' : `
### TRÁFEGO PAGO (Score: ${paidTraffic.score}/100 | Peso no score geral: 10%)
GOOGLE ADS (canal de intenção — usuário pesquisa ativamente):
- Anunciando no Google Ads: ${ok(paidTraffic.googleAds.isAdvertising)}
- Quantidade de campanhas Google Ads: ${paidTraffic.googleAds.campaignCount ?? 'N/A'} (ideal ≥3 campanhas ativas)
- Criativos em vídeo no Google Ads: ${ok(paidTraffic.googleAds.hasVideoCreatives)} (vídeos têm 2-3x mais CTR que imagens)

META ADS / FACEBOOK (canal de posicionamento e brand lift):
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

  // Análise visual do perfil (GPT-4o-mini summary tem prioridade)
  const visualPart = profileSummary && !disabledSections?.instagram
    ? `\n### RESUMO DA ANÁLISE VISUAL DO PERFIL (GPT-4o-mini)\n${profileSummary}\nPrioritize este resumo para validar e complementar os dados estruturados acima.\n`
    : profilePrintBase64 && !disabledSections?.instagram
      ? await analyzeInstagramImage(profilePrintBase64).then(v => v ? `\n### ANÁLISE VISUAL DO PERFIL (print do Instagram)\n${v}\n` : '')
      : '';

  const prompt = `Você é um especialista sênior em marketing digital para clínicas médicas no Brasil.

Analise APENAS os dados fornecidos da auditoria do cliente "${clientName}" e gere um relatório executivo objetivo.

IMPORTANTE: Você NÃO coletou os dados. Eles foram preenchidos manualmente por um auditor humano.
- NÃO invente dados
- NÃO faça suposições
- NÃO analise além do que está explícito
- Se algo não estiver nos dados, IGNORE

## OBJETIVO DO RELATÓRIO
Este relatório será entregue diretamente ao dono da clínica.
O objetivo é mostrar:
1) onde existem perdas de oportunidade
2) onde existem oportunidades de crescimento
3) quais ações têm maior impacto financeiro

Tom: consultor experiente, direto e respeitoso. Sem dramatização. Sem exageros.

## REGRAS DE ESCRITA
• Seja direto — sem frases de enchimento
• Cada frase precisa ter impacto prático
• PROIBIDO: "Perfil não é profissional", "falta qualidade", "precisa melhorar"
• Sempre explique: o que falta → qual impacto → o que muda quando corrigido

## REGRA CRÍTICA
NUNCA sugira criar algo que JÁ EXISTE nos dados.
Se bio.cta = Sim → NÃO sugerir colocar CTA
Se pixelInstalled = Sim → NÃO falar de pixel

## LINGUAGEM
Traduza termos técnicos:
UTM → link de rastreamento
Pixel → código de remarketing
PageSpeed → velocidade no celular
GTM → código de rastreamento
Domain Authority → força do site no Google

## ANÁLISE DE PRIORIDADE
🔴 CRÍTICO — impacto direto em receita ou geração de leads
🟠 ALTO IMPACTO — afeta conversão ou autoridade
🟡 MÉDIO IMPACTO — melhorias estruturais
🟢 BAIXO IMPACTO — otimizações secundárias

## DADOS DA AUDITORIA
${sitePart}
${igPart}
${visualPart}
${gmnPart}
${trafficPart}
${commercialPart}
${disabledSections?.commercial ? '\nSEÇÃO COMERCIAL: não se aplica a este cliente — NUNCA mencione follow-up, tempo de resposta ou processos comerciais.' : ''}
${disabledSections?.instagram ? '\nSEÇÃO INSTAGRAM: não se aplica — não mencione Instagram em nenhum item.' : ''}
${disabledSections?.gmn ? '\nSEÇÃO GMN: não se aplica — não mencione Google Meu Negócio ou avaliações.' : ''}
${disabledSections?.paidTraffic ? '\nSEÇÃO TRÁFEGO PAGO: não se aplica — não mencione Google Ads, Meta Ads ou tráfego pago.' : ''}
${disabledSections?.site ? '\nSEÇÃO SITE: não se aplica — não mencione site, SEO ou velocidade.' : ''}

## FORMATO DA RESPOSTA
Retorne SOMENTE JSON válido, sem markdown:

{
  "topProblems": [
    { "title": "...", "priority": "urgent|high|medium|low", "description": "..." }
  ],
  "topOpportunities": [
    { "title": "...", "priority": "urgent|high|medium|low", "description": "..." }
  ],
  "recommendedPlan": {
    "days7": ["ação específica baseada nos dados"],
    "days30": ["ação específica baseada nos dados"],
    "days90": ["ação específica baseada nos dados"]
  }
}

REGRAS DO RESULTADO:
- topProblems: 3 a 5 problemas, ordenados por prioridade, sem duplicação
- topOpportunities: 2 a 4 oportunidades, não repetir problemas
- recommendedPlan: ações específicas para este cliente, não genéricas, baseadas nos dados
- A descrição NUNCA deve repetir o título — deve complementar com impacto concreto`;

  const raw = await callAI(prompt);
  const parsed = parseJSON(raw);

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
 */
export async function generateSectionTextsWithAI(
  site: SiteSection,
  instagram: InstagramSection,
  gmn: GMNSection,
  paidTraffic: PaidTrafficSection,
  commercial: CommercialSection,
  clientName: string,
  disabledSections?: Record<string, boolean>,
  profilePrintBase64?: string,
  profileSummary?: string
): Promise<SectionTexts> {
  const visualPart = profileSummary && !disabledSections?.instagram
    ? `\n### RESUMO VISUAL DO PERFIL (GPT-4o-mini)\n${profileSummary}\nUse este resumo para validar os dados e tornar as observações mais precisas e específicas.\n`
    : profilePrintBase64 && !disabledSections?.instagram
      ? await analyzeInstagramImage(profilePrintBase64).then(v => v ? `\n### ANÁLISE VISUAL DO PERFIL INSTAGRAM\n${v}\n` : '')
      : '';

  const prompt = `Você é um consultor sênior de marketing digital para clínicas médicas no Brasil.

Sua função é analisar os dados da auditoria e escrever observações e recomendações para cada seção do cliente "${clientName}".

IMPORTANTE: Os dados foram preenchidos manualmente por um auditor humano.
- NÃO invente dados
- NÃO faça suposições
- NÃO analise além do que está nos dados
- Se algo não estiver presente, ignore

## TOM
Parceiro de negócio. Direto. Respeitoso. Objetivo. Sem dramatização.

## REGRAS DE ESCRITA
Observations: 2 a 3 frases — comece pelo problema mais crítico — mencione impacto no negócio
Recommendations: 3 a 4 ações — da mais urgente para a menos urgente — cada ação = uma frase curta e específica

## PROIBIDO
❌ Sugerir criar algo que já existe nos dados (verifique Sim/Não antes de recomendar)
❌ Repetir recomendações entre seções
❌ Frases genéricas como "melhorar o Instagram" ou "o perfil precisa melhorar"
❌ Repetir o título na descrição

## LINGUAGEM
UTM → link de rastreamento | Pixel → código de remarketing | PageSpeed → velocidade no celular | GTM → código de rastreamento | Domain Authority → força do site no Google

## DADOS DA AUDITORIA
${disabledSections?.site ? '' : `
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
- Observações existentes: ${site.observations || 'nenhuma'}`}
${disabledSections?.instagram ? '' : `
### INSTAGRAM (Score: ${instagram.score}/100)
REGRA CRÍTICA: O perfil do profissional EXISTE — estes dados foram coletados dele. Não mencione "perfil inexistente". O campo "perfil separado da clínica" é BAIXO IMPACTO e deve ser ignorado.
- Perfil separado da clínica (baixo impacto, ignore): ${ok(instagram.profile.hasOwnProfile)}
- @ profissional: ${okNok(instagram.profile.handle)}
- Nome do perfil: ${okNok(instagram.profile.name)}
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)}
- Bio — o que faz: ${okNok(instagram.bio.whatDoes)}
- Bio — onde atua: ${okNok(instagram.bio.whereOperates)}
- Bio — método próprio na bio: ${okNok(instagram.bio.authority)} (BAIXO IMPACTO)
- Bio — CTA: ${okNok(instagram.bio.cta)}
- Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link de rastreamento na bio: ${ok(instagram.bio.linkTracking)}
- Destaques no perfil:
  - "Quem Sou Eu": ${okNok(instagram.highlights.whoAmI)} ${instagram.highlights.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Prova Social": ${okNok(instagram.highlights.socialProof)} ${instagram.highlights.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Método" (método exclusivo, protocolo próprio): ${okNok(instagram.highlights.authority)} ${instagram.highlights.authority === 'ok' ? '(EXISTE)' : '(AUSENTE)'} (BAIXO IMPACTO)
  - "Diferencial": ${okNok(instagram.highlights.differential)} ${instagram.highlights.differential === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
- Posts fixados:
  - "Quem Sou Eu": ${okNok(instagram.pinned.whoAmI)} ${instagram.pinned.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Prova Social": ${okNok(instagram.pinned.socialProof)} ${instagram.pinned.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Serviços/Método": ${okNok(instagram.pinned.servicesOrMethod)} ${instagram.pinned.servicesOrMethod === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
ATENÇÃO: mencione apenas o que está (AUSENTE) — nunca diga que algo não existe se está marcado como (EXISTE)
- Frequência feed: ${feedLabel(instagram.content.feedFrequency)}
- Frequência stories: ${storiesLabel(instagram.content.storiesFrequency)}
- Observações existentes: ${instagram.observations || 'nenhuma'}
${visualPart}`}
${disabledSections?.gmn ? '' : `
### GOOGLE MEU NEGÓCIO (Score: ${gmn.score}/100)
- Avaliações: ${gmn.reviewCount ?? 'N/A'} avaliações
- Posição vs. concorrência (avaliações): ${gmn.reviewComparison === 'above' ? 'Acima da média' : gmn.reviewComparison === 'average' ? 'Na média' : gmn.reviewComparison === 'below' ? 'Abaixo da média' : 'não avaliado'}
- Nota média: ${gmn.averageRating ?? 'N/A'}/5.0${gmn.averageRating !== null && gmn.averageRating < 4.0 ? ' ⚠️ abaixo de 4.0' : ''}
- Posição da nota vs. concorrência: ${gmn.ratingComparison === 'above' ? 'Acima da média' : gmn.ratingComparison === 'average' ? 'Na média' : gmn.ratingComparison === 'below' ? 'Abaixo da média' : 'não avaliado'}
- Completude da ficha: ${gmn.healthScore ?? 'N/A'}/100
- NAP consistente: ${ok(gmn.checklist.napConsistent)}
- Horários atualizados: ${ok(gmn.checklist.hoursUpdated)}
- Categorias relevantes: ${ok(gmn.checklist.relevantCategories)}
- Fotos/vídeos atualizados: ${ok(gmn.checklist.photosVideosUpdated)}
- Avaliações respondidas: ${ok(gmn.checklist.reviewsManaged)}
- Posts regulares: ${ok(gmn.checklist.regularPosts)}
- Observações existentes: ${gmn.observations || 'nenhuma'}`}
${disabledSections?.paidTraffic ? '' : `
### TRÁFEGO PAGO (Score: ${paidTraffic.score}/100)
- Google Ads ativo: ${ok(paidTraffic.googleAds.isAdvertising)}
- Campanhas Google Ads: ${paidTraffic.googleAds.campaignCount ?? 'N/A'}
- Vídeos no Google Ads: ${ok(paidTraffic.googleAds.hasVideoCreatives)}
- Meta Ads ativo: ${ok(paidTraffic.facebookAds.isAdvertising)}
- Campanhas Meta Ads: ${paidTraffic.facebookAds.campaignCount ?? 'N/A'}
- Vídeos no Meta Ads: ${ok(paidTraffic.facebookAds.hasVideoCreatives)}
- Observações existentes: ${paidTraffic.observations || 'nenhuma'}`}
${disabledSections?.commercial ? '' : `
### COMERCIAL (Score: ${commercial.score}/100)
- Tempo de resposta ao lead: ${responseTimeLabel(commercial.leadResponseTime)}
- Follow-ups realizados: ${followUpLabel(commercial.followUps)}
- Detalhe follow-up: ${commercial.followUpObservation || 'não informado'}
- Observações existentes: ${commercial.observations || 'nenhuma'}`}

## SEÇÕES DESABILITADAS
${disabledSections?.commercial ? 'COMERCIAL: não se aplica — pule completamente, retorne strings vazias.' : ''}
${disabledSections?.instagram ? 'INSTAGRAM: não se aplica — pule completamente, retorne strings vazias.' : ''}
${disabledSections?.gmn ? 'GMN: não se aplica — pule completamente, retorne strings vazias.' : ''}
${disabledSections?.paidTraffic ? 'TRÁFEGO PAGO: não se aplica — pule completamente, retorne strings vazias.' : ''}
${disabledSections?.site ? 'SITE: não se aplica — pule completamente, retorne strings vazias.' : ''}

## FORMATO DA RESPOSTA
Retorne SOMENTE JSON válido, sem markdown:

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

  const raw = await callAI(prompt);
  const parsed = parseJSON(raw);

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

const sectionNameMap: Record<string, string> = {
  site: 'Site',
  instagram: 'Instagram',
  gmn: 'Google Meu Negócio',
  paidTraffic: 'Tráfego Pago',
  commercial: 'Comercial',
};

/**
 * Generates or complements Rodrigo's observations for a specific section using AI.
 */
export async function generateRodrigoObservationsWithAI(
  sectionKey: 'site' | 'instagram' | 'gmn' | 'paidTraffic' | 'commercial',
  sectionData: any,
  existingObservations: string,
  clientName: string
): Promise<string> {
  const sectionName = sectionNameMap[sectionKey];

  // Traduz valores técnicos do JSON para linguagem humana antes de enviar ao modelo
  const humanizeSectionData = (key: string, data: any): any => {
    if (key !== 'instagram' || !data) return data;
    const feedMap: Record<string, string> = { daily: 'diário', '3x_week': '3x por semana', '1x_week': '1x por semana', less: 'menos de 1x por semana' };
    const storiesMap: Record<string, string> = { daily: 'diário', few_weekly: 'algumas vezes por semana', rare: 'raro' };
    return {
      ...data,
      content: data.content ? {
        feedFrequency: feedMap[data.content.feedFrequency] ?? data.content.feedFrequency,
        storiesFrequency: storiesMap[data.content.storiesFrequency] ?? data.content.storiesFrequency,
      } : data.content,
    };
  };

  const sectionJson = JSON.stringify(humanizeSectionData(sectionKey, sectionData)).slice(0, 1500);

  const complementOrCreate = existingObservations.trim()
    ? `Observações atuais: "${existingObservations}". NÃO repita. Complemente com 1-2 insights novos que agreguem valor real.`
    : `Escreva as observações do zero.`;

  const prompt = `Você é Rodrigo, consultor de marketing digital para clínicas médicas no Brasil.
Você está escrevendo observações diretamente para o cliente.
Fale como um mentor experiente que analisou os dados do negócio.

## CONTEXTO
Cliente: ${clientName}
Seção analisada: ${sectionName}
Dados da auditoria: ${sectionJson}

${complementOrCreate}

## REGRAS
• Fale em primeira pessoa
• Linguagem humana e natural
• Cite um dado específico presente no JSON acima — NÃO invente nem infira dados ausentes
• Mostre impacto no negócio (pacientes ou receita)
• Aponte direção prática — o que fazer, não só o que está errado
• PROIBIDO: jargões técnicos, nomes de campos do JSON (ex: "feedFrequency"), frameworks, linguagem robótica, frases genéricas

## ESTILO
"Olhando para o seu ${sectionName}, o que mais me chama atenção é que..."
"O ponto que mais impacta aqui é..."
"Se você ajustar isso, a tendência é..."

## TAMANHO
2 a 3 frases no máximo. Cada frase precisa ter peso.

Responda APENAS com JSON válido:
{ "observations": "texto aqui" }`;

  const raw = await callAI(prompt);
  return parseJSON(raw).observations ?? '';
}
