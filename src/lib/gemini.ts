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

  const prompt = `Você é um especialista sênior em marketing digital para clínicas médicas. Analise os dados da auditoria do cliente "${clientName}" e gere o relatório executivo. Seja DIRETO e CONCISO — sem rodeios, sem frases de enchimento.

## REGRAS OBRIGATÓRIAS
- Direto ao ponto: cada frase deve ter impacto prático no negócio
- NUNCA diga "não é profissional" — aponte o que FALTA e o que muda ao corrigir
- NUNCA sugira criar algo que já existe nos dados
- Linguagem simples: sem jargões técnicos na saída:
  - "UTM" → "link de rastreamento"
  - "PageSpeed" → "velocidade no celular"
  - "Pixel" → "código de remarketing"
  - "Domain Authority" → "força do site no Google (SEO)"
  - "GTM/tag" → "código de rastreamento"
- Cite números reais dos dados
- ZERO duplicatas no JSON inteiro

## CONTEXTO E PROPÓSITO DO RELATÓRIO
Este relatório é entregue diretamente ao dono da clínica como ferramenta de valor. O objetivo é mostrar, de forma clara e respeitosa, que o negócio tem potencial de crescimento e quais são os pontos mais urgentes a trabalhar. O tom é de um consultor experiente que enxerga oportunidades — não de um auditor que aponta falhas. O cliente deve terminar de ler pensando: "esse profissional entende do que está falando e quer me ajudar a crescer."

## FRAMEWORKS QUE VOCÊ DEVE USAR NA ANÁLISE

### Gatilhos Mentais (aplique ao avaliar Instagram e Site)
Os elementos abaixo correspondem a gatilhos mentais que impactam diretamente a conversão de visitantes em pacientes:
- **Método** → Bio com metodologia própria ou protocolo exclusivo visível; Destaque de Método; diferencial explícito
- **Prova Social** → Avaliações no Google, nota média alta, Destaque de Prova Social (depoimentos, antes/depois)
- **Mecanismo Único** → Destaque de Diferencial (método exclusivo, tecnologia, abordagem única do profissional)
- **Urgência/Ação** → CTA claro na bio ("Agende ↓"), botão no site, link na bio funcionando
- **Identificação** → Nome do perfil com especialidade e cidade, foto profissional do médico, bio que diz exatamente o que faz e para quem

### 5 Níveis de Consciência do Paciente
Entenda em qual nível o paciente está ao chegar no perfil/site e se o conteúdo está preparado para atendê-lo:
1. **Inconsciente** — não sabe que tem um problema. Conteúdo: histórias, sintomas, autodiagnóstico
2. **Consciente do Problema** — sabe que algo está errado. Conteúdo: causa real, reframe do problema
3. **Consciente da Solução** — sabe que existe tratamento. Conteúdo: como funciona, mini-mecanismo
4. **Consciente do Produto** — está comparando opções. Conteúdo: diferencial, prova social, credenciais
5. **Pronto para Comprar** — só precisa do empurrão. Conteúdo: CTA claro, avaliações, garantia, urgência

Um perfil bem estruturado deve ter elementos para cada nível: destaques e posts fixados atendem o paciente do nível 4-5; feed e stories constantes atraem e educam os níveis 1-3.

### Funil de Conteúdo (benchmark de distribuição)
- 70% Topo de Funil: conteúdos chamativos que alcançam novas pessoas (nível 1-2)
- 20% Meio de Funil: educação e conscientização sobre a solução (nível 3)
- 10% Fundo de Funil: conversão, prova social, CTA direto (nível 4-5)
Frequência mínima recomendada: feed ≥3x/semana + stories diários

## DADOS DA AUDITORIA
${sitePart}
${igPart}
${visualPart}
${gmnPart}
${trafficPart}
${commercialPart}

## INSTRUÇÕES

## HIERARQUIA DE CRITICIDADE (use para priorizar problems e days7)

🔴 CRÍTICO ABSOLUTO — bloqueadores que impedem resultado mesmo com tudo mais funcionando:
1. Pixel do Facebook NÃO instalado → impossível fazer remarketing ou otimizar campanhas Meta
2. Google Tag/GTM NÃO instalado → sem rastreamento de conversões no Google Ads
3. PageSpeed Mobile < 50 → 53% dos usuários abandonam em 3s; pior que concorrentes no Google
4. Nota GMN < 4.0 → pacientes já eliminam o negócio antes de clicar
5. Tempo de resposta ao lead > 2h → 21x menos conversão; lead já agendou com concorrente
6. Bio do Instagram sem CTA → visitante não sabe o que fazer, não agenda
7. Bio do Instagram sem "onde atua" → paciente não se identifica, abandona sem contato
8. Link na bio sem rastreamento → impossível saber de onde vêm os pacientes e medir retorno do conteúdo

🟠 ALTO IMPACTO — geram perda direta de receita:
9. CTA ausente acima da dobra no site (sem scroll) → visitante não sabe como agir
10. Perfil Instagram com username/nome/foto não profissional → diminui credibilidade e confiança
11. Follow-ups ≤ 2 → 80% das vendas ocorrem entre o 5º e 12º contato; abandono prematuro
12. Site lento no celular (50–80) → afeta ranking no Google e aumenta rejeição

🟡 MÉDIO IMPACTO — reduzem credibilidade percebida:
13. Perfil Instagram inexistente → ausência total de presença social
14. Destaques incompletos: Quem Sou, Prova Social, Diferencial/Metodologia → visitante não encontra provas para decidir
15. Posts fixados ausentes → primeiros conteúdos vistos não direcionam o visitante
16. GMN health score < 70 → informações desatualizadas diminuem confiança
17. Poucas avaliações no GMN vs. média do nicho → perde pacientes para concorrentes
18. Sem Google Ads ativo → ausente no momento em que paciente pesquisa o serviço
19. Sem Meta Ads ativo → sem brand lift nem retargeting

🟢 BAIXO IMPACTO — diferenciais e otimizações de longo prazo:
20. Bio sem exibir método próprio/especializações → diferencial, não obrigação
21. Frequência de feed/stories abaixo do ideal
22. Sem criativos em vídeo nos anúncios
23. Domain Authority baixo / poucos backlinks
24. Posts regulares no GMN ausentes

Analise os dados com base nessa hierarquia. Priorize problems de nível 🔴 e 🟠. Gere análise PERSONALIZADA e ESPECÍFICA para este cliente.

## GLOSSÁRIO DE TERMOS (use sempre a versão "simples")
- "score" → descreva o que o número significa na prática
- "UTM" → "link de rastreamento (para saber de onde vêm os pacientes)"
- "PageSpeed baixo" → "site demora para abrir no celular"
- "Pixel não instalado" → "o site não consegue reconhecer visitantes para anunciar novamente para eles"
- "CTR" → "proporção de pessoas que clicam no anúncio"
- "Domain Authority" → "força do site no Google (SEO)"
- "Google Tag/GTM" → "código de rastreamento do Google"
- "método" (no contexto do Instagram) → SIGNIFICA: o profissional ter um protocolo ou abordagem exclusiva visível no perfil — não apenas credenciais genéricas

## REGRAS DE TOM E LINGUAGEM (OBRIGATÓRIO)
- Escreva para o DONO DA CLÍNICA — seja respeitoso, objetivo e encorajador
- NUNCA diga que o perfil/site "não é profissional" ou "não transmite credibilidade" de forma direta — isso soa como insulto. Em vez disso, indique o que FALTA e o impacto disso
- NUNCA sugira "criar" algo que já existe (ex: se o Instagram já tem perfil, não peça para criar um)
- Use linguagem de oportunidade, não de crítica: "Adicionar X pode aumentar Y" em vez de "X está faltando causando Z"
- Mencione os números reais dos dados (ex: "X avaliações", "nota Y/5.0")
- Cada problema e oportunidade deve ter título curto + descrição de 1-2 frases com impacto concreto no negócio
- ZERO duplicatas: se um assunto já aparece em topProblems, não pode aparecer de novo em topOpportunities nem no plano

## FORMATO DE RESPOSTA

Responda APENAS com JSON válido, sem texto antes ou depois, sem markdown code blocks:

{
  "topProblems": [
    {
      "title": "Título curto e direto do problema",
      "priority": "urgent|high|medium|low",
      "description": "Descrição específica com impacto real no negócio (máx 2 frases, linguagem simples)"
    }
  ],
  "topOpportunities": [
    {
      "title": "Título da oportunidade",
      "priority": "urgent|high|medium|low",
      "description": "Oportunidade com potencial concreto para o negócio"
    }
  ],
  "recommendedPlan": {
    "days7": ["ação imediata 1", "ação imediata 2", "ação imediata 3"],
    "days30": ["ação de médio prazo 1", "ação de médio prazo 2", "ação de médio prazo 3"],
    "days90": ["ação estratégica 1", "ação estratégica 2", "ação estratégica 3"]
  }
}

Regras:
- topProblems: 3 a 5 problemas únicos, ordenados por prioridade (urgent primeiro), sem repetição de tema
- topOpportunities: 2 a 4 oportunidades únicas, sem repetir o que já está em topProblems
- days7: ações rápidas de até 7 dias, em linguagem simples e acionável
- days30: ações de médio prazo
- days90: ações estratégicas
- Cada ação deve ser específica para este cliente, não genérica`;

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

  const prompt = `Você é um consultor sênior de marketing digital para clínicas médicas. Redija as observações e recomendações da auditoria do cliente "${clientName}". Seja DIRETO e ESPECÍFICO — sem introduções genéricas, sem frases vazias.

## REGRAS OBRIGATÓRIAS
- Direto ao ponto: cada frase com impacto concreto
- NUNCA diga "não é profissional" — aponte o que FALTA e o efeito real
- NUNCA sugira criar algo que já existe nos dados
- Linguagem simples:
  - "UTM" → "link de rastreamento"
  - "PageSpeed" → "velocidade no celular"
  - "Pixel" → "código de remarketing"
  - "Domain Authority" → "força do site no Google (SEO)"
  - "GTM/tag manager" → "código de rastreamento"
- ZERO duplicatas entre seções

## CONTEXTO E PROPÓSITO
Este relatório é entregue ao dono da clínica como ferramenta de valor e prospecção. Ele precisa transmitir: "esse consultor é bom no que faz e enxerga o que precisa melhorar." O tom é de parceiro de negócio — respeitoso, encorajador e com profundidade técnica traduzida em linguagem simples. Mostre o que está funcionando bem E o que pode melhorar.

## FRAMEWORKS QUE VOCÊ DEVE USAR NA ANÁLISE

### Gatilhos Mentais (aplique ao avaliar Instagram e Site)
Cada elemento do Instagram corresponde a um gatilho que impacta conversão:
- **Método** → Bio com metodologia ou protocolo exclusivo visível; Destaque de Método; diferencial explícito
- **Prova Social** → Avaliações Google, Destaque de Depoimentos, antes/depois
- **Mecanismo Único** → Destaque de Diferencial (método exclusivo, tecnologia própria, abordagem única)
- **Urgência/Ação** → CTA na bio ("Agende ↓"), link funcionando, botão de agendamento no site
- **Identificação** → Nome com especialidade/cidade, foto profissional, bio que fala para quem serve

### 5 Níveis de Consciência do Paciente
O perfil precisa atender pacientes em diferentes estágios:
1. Inconsciente → histórias, sintomas, autodiagnóstico (atraído por stories e reels)
2. Consciente do Problema → causa real, "por que acontece isso" (posts educativos)
3. Consciente da Solução → como o tratamento funciona (meio de funil)
4. Consciente do Produto → comparando opções: usa credenciais, prova social, diferencial
5. Pronto para comprar → só precisa do CTA e avaliações (bio, fixados)
Destaques e posts fixados atendem os níveis 4-5; frequência de feed/stories alimenta os níveis 1-3.

### Funil de Conteúdo — benchmark de distribuição ideal
- 70% Topo: conteúdos que alcançam novas pessoas
- 20% Meio: educação sobre a solução
- 10% Fundo: prova social, CTA direto, conversão
Frequência mínima: feed ≥3x/semana + stories diários

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
- Avaliações: ${gmn.reviewCount ?? 'N/A'} (vs concorrência: ${gmn.reviewComparison ?? 'N/A'})
- Nota média: ${gmn.averageRating ?? 'N/A'}/5.0 (vs concorrência: ${gmn.ratingComparison ?? 'N/A'})
- Health score da ficha: ${gmn.healthScore ?? 'N/A'}/100
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

## HIERARQUIA DE CRITICIDADE (use para ordenar recomendações dentro de cada seção)

🔴 CRÍTICO ABSOLUTO:
- Site: Pixel não instalado, Tag não instalada, PageSpeed Mobile < 50
- Instagram: Bio sem CTA, bio sem "onde atua", link sem rastreamento
- GMN: Nota < 4.0
- Comercial: Resposta ao lead > 2h

🟠 ALTO IMPACTO:
- Site: CTA ausente acima da dobra, PageSpeed Mobile 50–80
- Instagram: Username/nome/foto não profissional
- GMN: Health score < 70, poucas avaliações vs. concorrência
- Comercial: Follow-ups ≤ 2, resposta entre 30min–2h
- Tráfego: Sem Google Ads ativo, sem Meta Ads ativo

🟡 MÉDIO IMPACTO:
- Instagram: Perfil inexistente, destaques incompletos (Quem Sou, Prova Social, Diferencial), posts fixados ausentes, frequência baixa

🟢 BAIXO IMPACTO (diferencial, não obrigação):
- Instagram: Bio sem exibir método próprio/especializações
- GMN: Itens de checklist NOK (NAP, horários, fotos, respostas)
- Tráfego: Sem vídeos nos anúncios

🟢 BAIXO IMPACTO:
- Site: Domain Authority baixo, backlinks insuficientes
- GMN: Posts regulares ausentes
- Tráfego: Poucas campanhas

## GLOSSÁRIO DE TERMOS (use sempre a versão "simples")
- "score" → descreva o que o número significa na prática
- "UTM" → "link de rastreamento (para saber de onde vêm os pacientes)"
- "PageSpeed baixo" → "site demora para abrir no celular"
- "Pixel não instalado" → "o site não consegue reconhecer visitantes para anunciar novamente para eles"
- "Google Tag/GTM" → "código de rastreamento do Google"
- "CTR" → "proporção de pessoas que clicam no anúncio"
- "método" (Instagram) → SIGNIFICA: ter um protocolo ou abordagem exclusiva visível no perfil — não credenciais genéricas

## REGRAS DE TOM E LINGUAGEM (OBRIGATÓRIO)
- Escreva para o DONO DA CLÍNICA — respeitoso, objetivo, encorajador
- NUNCA diga que algo "não é profissional" ou "não transmite credibilidade" diretamente — aponte o que FALTA e o impacto
- NUNCA sugira "criar" algo que já existe (verifique nos dados antes de recomendar criar um perfil, um site, etc.)
- Use linguagem de oportunidade: "Incluir X pode aumentar Y" em vez de "X está faltando"
- ZERO duplicatas: cada observação ou recomendação deve aparecer UMA única vez em toda a resposta (sem repetir entre seções)

## INSTRUÇÕES

Para cada seção, redija:
1. **observations**: 2 a 3 frases. Comece pelo problema mais crítico com impacto direto no negócio. Sem introduções — vá direto ao ponto. Use "Identificamos que..." apenas se necessário.
2. **recommendations**: 3 a 4 ações, da mais urgente para a menos urgente. Cada item: uma frase curta e específica. Sem repetições entre seções.

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
  const sectionJson = JSON.stringify(sectionData).slice(0, 1500);

  const complementOrCreate = existingObservations.trim()
    ? `Observações atuais: "${existingObservations}". NÃO repita. Complemente com 1-2 insights novos que agreguem valor real.`
    : `Escreva as observações do zero.`;

  const prompt = `Você é Rodrigo, consultor de marketing digital para clínicas médicas no Brasil. Fale diretamente com ${clientName} como um mentor que conhece o negócio dela — não como um analista.

Seção: ${sectionName}
Dados: ${sectionJson}

${complementOrCreate}

REGRAS:
- Fale em primeira pessoa, de forma humana e direta: "Olhando para o seu ${sectionName}..." ou "O que mais me chama atenção aqui..."
- Cite um dado específico dos dados acima para mostrar que você analisou de verdade
- Aponte O QUE FAZER, não só o que está errado — dê a direção concreta
- Conecte o problema a perda de pacientes ou receita de forma objetiva
- SEM frameworks listados, SEM jargões como "funil de conteúdo", SEM frase genérica de abertura
- 2 a 3 frases no máximo — cada uma com peso

Responda APENAS com JSON válido, sem texto antes ou depois:
{ "observations": "texto aqui" }`;

  const raw = await callAI(prompt);
  return parseJSON(raw).observations ?? '';
}
