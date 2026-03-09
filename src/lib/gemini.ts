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
  profilePrintBase64?: string
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
- Perfil próprio da empresa/clínica: ${ok(instagram.profile.hasOwnProfile)} ${instagram.profile.hasOwnProfile ? '← PERFIL JÁ EXISTE, não sugira criar' : '← PERFIL NÃO EXISTE, prioridade máxima'}
- @ (username): ${okNok(instagram.profile.handle)} (deve ser profissional e fácil de encontrar)
- Nome do perfil: ${okNok(instagram.profile.name)} (deve conter especialidade e/ou cidade)
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)} (deve ser foto profissional do médico ou logo)
- Bio — O que faz (especialidade clara): ${okNok(instagram.bio.whatDoes)}
- Bio — Onde atua (cidade/região): ${okNok(instagram.bio.whereOperates)}
- Bio — Autoridade (especializações visíveis, pós-graduação, metodologia própria): ${okNok(instagram.bio.authority)}
- Bio — CTA (chamada para ação, ex: "Agende ↓"): ${okNok(instagram.bio.cta)}
- Bio — Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link de rastreamento na bio (para saber de onde vêm os pacientes): ${ok(instagram.bio.linkTracking)}
- Destaques existentes no perfil:
  - Destaque "Quem Sou Eu": ${okNok(instagram.highlights.whoAmI)} ${instagram.highlights.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Destaque "Prova Social" (depoimentos, antes/depois): ${okNok(instagram.highlights.socialProof)} ${instagram.highlights.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Destaque "Autoridade" (especializações, diplomas): ${okNok(instagram.highlights.authority)} ${instagram.highlights.authority === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Destaque "Diferencial" (método exclusivo do profissional): ${okNok(instagram.highlights.differential)} ${instagram.highlights.differential === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
- Posts fixados no topo do perfil:
  - Post fixado "Quem Sou Eu": ${okNok(instagram.pinned.whoAmI)} ${instagram.pinned.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Post fixado "Prova Social": ${okNok(instagram.pinned.socialProof)} ${instagram.pinned.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - Post fixado "Serviços ou Método": ${okNok(instagram.pinned.servicesOrMethod)} ${instagram.pinned.servicesOrMethod === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
ATENÇÃO: ao analisar, mencione apenas destaques/fixados que estão AUSENTES — nunca diga que algo "não existe" se está marcado como (EXISTE)
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

  // Análise visual do perfil (se imagem disponível)
  const visualAnalysis = profilePrintBase64 && !disabledSections?.instagram
    ? await analyzeInstagramImage(profilePrintBase64)
    : '';
  const visualPart = visualAnalysis
    ? `\n### ANÁLISE VISUAL DO PERFIL (print do Instagram)\n${visualAnalysis}\nUse esta análise visual para complementar e corrigir os dados acima quando houver contradições.\n`
    : '';

  const prompt = `Você é um especialista sênior em marketing digital e presença online para clínicas médicas e de estética. Você acabou de realizar uma auditoria digital completa do cliente "${clientName}" e precisa gerar um relatório executivo personalizado, direto e impactante.

## REGRAS DE LINGUAGEM — LEIA ANTES DE TUDO (OBRIGATÓRIO)
- Escreva para o DONO DA CLÍNICA — respeitoso, objetivo, encorajador
- NUNCA diga que algo "não é profissional" ou "não transmite credibilidade" — aponte o que FALTA e o impacto positivo de corrigir
- NUNCA sugira "criar" algo que já existe — verifique os dados antes
- Use linguagem de oportunidade: "Incluir X pode aumentar Y" em vez de "X está faltando"
- PROIBIDO usar estes termos técnicos na saída:
  - "UTM" → escreva "link de rastreamento para saber de onde vêm os pacientes"
  - "PageSpeed" → escreva "velocidade de abertura no celular"
  - "Pixel" → escreva "código que permite reconhecer visitantes e anunciar novamente para eles"
  - "CTR" → escreva "proporção de cliques"
  - "Domain Authority" → escreva "autoridade do site no Google"
  - "GTM" / "tag" → escreva "código de rastreamento"
  - "score" → descreva o que significa na prática
- Mencione números reais dos dados (avaliações, nota, velocidade)
- ZERO duplicatas: cada assunto aparece uma única vez no JSON inteiro

## CONTEXTO E PROPÓSITO DO RELATÓRIO
Este relatório é entregue diretamente ao dono da clínica como ferramenta de valor. O objetivo é mostrar, de forma clara e respeitosa, que o negócio tem potencial de crescimento e quais são os pontos mais urgentes a trabalhar. O tom é de um consultor experiente que enxerga oportunidades — não de um auditor que aponta falhas. O cliente deve terminar de ler pensando: "esse profissional entende do que está falando e quer me ajudar a crescer."

## FRAMEWORKS QUE VOCÊ DEVE USAR NA ANÁLISE

### Gatilhos Mentais (aplique ao avaliar Instagram e Site)
Os elementos abaixo correspondem a gatilhos mentais que impactam diretamente a conversão de visitantes em pacientes:
- **Autoridade** → Bio com especialização/pós-graduação/metodologia própria visível; Destaque de Autoridade; CRM visível
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

🟠 ALTO IMPACTO — geram perda direta de receita:
6. CTA ausente acima da dobra (sem scroll) → visitante não sabe como agir
7. Bio do Instagram incompleta (sem CTA, sem autoridade, sem "onde atua") → lead não converte
8. Link na bio sem rastreamento → não sabe de onde vêm os pacientes, impossível medir o retorno do conteúdo
9. Follow-ups ≤ 2 → 80% das vendas ocorrem entre o 5º e 12º contato; abandono prematuro
10. Site lento no celular (50–80) → afeta ranking no Google e aumenta rejeição
11. Perfil Instagram inexistente → ausência total de presença social

🟡 MÉDIO IMPACTO — reduzem credibilidade e autoridade percebida:
12. Destaques Instagram incompletos: Quem Sou, Prova Social, Autoridade, Diferencial/Metodologia
13. Posts fixados ausentes → primeiros conteúdos vistos não direcionam o visitante
14. GMN health score < 70 → informações desatualizadas diminuem confiança
15. Poucas avaliações no GMN vs. média do nicho → perde pacientes para concorrentes
16. Sem Google Ads ativo → ausente no momento em que paciente pesquisa o serviço
17. Sem Meta Ads ativo → sem brand lift nem retargeting

🟢 BAIXO IMPACTO — otimizações incrementais de longo prazo:
18. Frequência de feed/stories abaixo do ideal
19. Sem criativos em vídeo nos anúncios (vídeos têm 2-3x mais cliques que imagens)
20. Domain Authority baixo / poucos backlinks
21. Posts regulares no GMN ausentes

Analise os dados com base nessa hierarquia. Priorize problems de nível 🔴 e 🟠. Gere análise PERSONALIZADA e ESPECÍFICA para este cliente.

## GLOSSÁRIO DE TERMOS (use sempre a versão "simples")
- "score" → descreva o que o número significa na prática
- "UTM" → "link de rastreamento (para saber de onde vêm os pacientes)"
- "PageSpeed baixo" → "site demora para abrir no celular"
- "Pixel não instalado" → "o site não consegue reconhecer visitantes para anunciar novamente para eles"
- "CTR" → "proporção de pessoas que clicam no anúncio"
- "Domain Authority" → "autoridade do site no Google"
- "Google Tag/GTM" → "código de rastreamento do Google"
- "autoridade" (no contexto do Instagram) → SIGNIFICA: o médico/profissional exibir publicamente suas especializações, pós-graduações, cursos relevantes ou metodologia própria — não um "selo" ou certificado genérico

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
  profilePrintBase64?: string
): Promise<SectionTexts> {
  const visualAnalysis = profilePrintBase64 && !disabledSections?.instagram
    ? await analyzeInstagramImage(profilePrintBase64)
    : '';
  const visualPart = visualAnalysis
    ? `\n### ANÁLISE VISUAL DO PERFIL INSTAGRAM\n${visualAnalysis}\nUse esta análise para validar os dados e tornar as observações mais precisas.\n`
    : '';

  const prompt = `Você é um consultor sênior de marketing digital especializado em clínicas médicas e de estética. Você realizou uma auditoria digital completa e precisa redigir as observações e recomendações de cada seção do relatório para o cliente "${clientName}".

## REGRAS DE LINGUAGEM — LEIA ANTES DE TUDO (OBRIGATÓRIO)
- Escreva para o DONO DA CLÍNICA — respeitoso, objetivo, encorajador
- NUNCA diga que algo "não é profissional" — aponte o que falta e o impacto positivo de corrigir
- NUNCA sugira "criar" algo que já existe nos dados
- Use linguagem de oportunidade: "Incluir X pode aumentar Y"
- PROIBIDO na saída:
  - "UTM" → "link de rastreamento para saber de onde vêm os pacientes"
  - "PageSpeed" → "velocidade de abertura no celular"
  - "Pixel" → "código que reconhece visitantes para anunciar novamente"
  - "CTR" → "proporção de cliques"
  - "Domain Authority" → "autoridade do site no Google"
  - "GTM" / "tag manager" → "código de rastreamento"
  - "score" → descreva o que significa na prática
- ZERO duplicatas entre seções

## CONTEXTO E PROPÓSITO
Este relatório é entregue ao dono da clínica como ferramenta de valor e prospecção. Ele precisa transmitir: "esse consultor é bom no que faz e enxerga o que precisa melhorar." O tom é de parceiro de negócio — respeitoso, encorajador e com profundidade técnica traduzida em linguagem simples. Mostre o que está funcionando bem E o que pode melhorar.

## FRAMEWORKS QUE VOCÊ DEVE USAR NA ANÁLISE

### Gatilhos Mentais (aplique ao avaliar Instagram e Site)
Cada elemento do Instagram corresponde a um gatilho que impacta conversão:
- **Autoridade** → Bio com especialização/metodologia visível; Destaque de Autoridade; credenciais expostas
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
- Perfil próprio da clínica/médico existe: ${ok(instagram.profile.hasOwnProfile)} ${instagram.profile.hasOwnProfile ? '← PERFIL JÁ EXISTE, não sugira criar' : '← PERFIL NÃO EXISTE, este é o problema principal'}
- @ profissional: ${okNok(instagram.profile.handle)}
- Nome do perfil: ${okNok(instagram.profile.name)}
- Foto de perfil: ${okNok(instagram.profile.profilePhoto)}
- Bio — o que faz: ${okNok(instagram.bio.whatDoes)}
- Bio — onde atua: ${okNok(instagram.bio.whereOperates)}
- Bio — autoridade: ${okNok(instagram.bio.authority)}
- Bio — CTA: ${okNok(instagram.bio.cta)}
- Link na bio: ${okNok(instagram.bio.linkInBio)}
- Link de rastreamento na bio (para saber de onde vêm os pacientes): ${ok(instagram.bio.linkTracking)}
- Destaques no perfil:
  - "Quem Sou Eu": ${okNok(instagram.highlights.whoAmI)} ${instagram.highlights.whoAmI === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Prova Social": ${okNok(instagram.highlights.socialProof)} ${instagram.highlights.socialProof === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Autoridade" (especializações, diplomas): ${okNok(instagram.highlights.authority)} ${instagram.highlights.authority === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
  - "Diferencial" (método exclusivo): ${okNok(instagram.highlights.differential)} ${instagram.highlights.differential === 'ok' ? '(EXISTE)' : '(AUSENTE)'}
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
- Instagram: Perfil não existe
- GMN: Nota < 4.0
- Comercial: Resposta ao lead > 2h

🟠 ALTO IMPACTO:
- Site: CTA ausente acima da dobra, PageSpeed Mobile 50–80
- Instagram: Bio sem CTA/autoridade/onde atua, link sem UTM, perfil não profissional
- GMN: Health score < 70, poucas avaliações vs. concorrência
- Comercial: Follow-ups ≤ 2, resposta entre 30min–2h
- Tráfego: Sem Google Ads ativo, sem Meta Ads ativo

🟡 MÉDIO IMPACTO:
- Instagram: Destaques incompletos, posts fixados ausentes, frequência baixa
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
- "autoridade" (Instagram) → SIGNIFICA: exibir publicamente especializações, pós-graduações, cursos relevantes ou metodologia própria — não "um selo" genérico

## REGRAS DE TOM E LINGUAGEM (OBRIGATÓRIO)
- Escreva para o DONO DA CLÍNICA — respeitoso, objetivo, encorajador
- NUNCA diga que algo "não é profissional" ou "não transmite credibilidade" diretamente — aponte o que FALTA e o impacto
- NUNCA sugira "criar" algo que já existe (verifique nos dados antes de recomendar criar um perfil, um site, etc.)
- Use linguagem de oportunidade: "Incluir X pode aumentar Y" em vez de "X está faltando"
- ZERO duplicatas: cada observação ou recomendação deve aparecer UMA única vez em toda a resposta (sem repetir entre seções)

## INSTRUÇÕES

Para cada seção, redija:
1. **observations**: Parágrafo de 3 a 5 frases. Direto, profissional, linguagem simples. Comece pelos pontos mais críticos (🔴 primeiro). Explique o impacto concreto no negócio (pacientes que não agendam, investimento desperdiçado, oportunidade perdida). Reconheça o que já funciona bem. Escreva em primeira pessoa do plural (ex: "Identificamos que...").
2. **recommendations**: Lista de 3 a 5 recomendações únicas, ordenadas da mais urgente para a menos urgente (🔴→🟢). Cada item é uma frase curta, acionável e específica para este cliente. Sem repetições entre seções.

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
    ? `As observações atuais são: "${existingObservations}". NÃO repita o que já foi escrito. Adicione novos insights estratégicos que complementem e enriqueçam as observações existentes.`
    : `Não há observações anteriores. Escreva observações frescas e impactantes para esta seção.`;

  const prompt = `Você é Rodrigo, especialista em marketing digital com mais de uma década de experiência trabalhando com centenas de clínicas médicas e de estética no Brasil. Você é mentor e consultor estratégico — não um auditor que lista problemas.

## FRAMEWORKS QUE VOCÊ USA
- 5 Consciências do Paciente: cada canal deve atender pacientes em diferentes estágios de consciência
- Mecanismo Único: o diferencial exclusivo do profissional que o posiciona acima da concorrência
- Prova Social: avaliações, depoimentos e resultados visíveis que constroem confiança
- Funil de Conteúdo: distribuição estratégica de conteúdo para atrair, educar e converter
- Gatilhos de Conversão: autoridade, urgência, identificação e prova social aplicados ao digital

## CLIENTE
Nome: ${clientName}

## SEÇÃO ANALISADA: ${sectionName}
Dados coletados: ${sectionJson}

## INSTRUÇÕES
${complementOrCreate}

Escreva em primeira pessoa (eu), como mentor e conselheiro estratégico, com foco em:
- Aquisição de pacientes e crescimento de receita
- Posicionamento de mercado e autoridade da marca
- Jornada do paciente e gatilhos de conversão
- Visão holística de negócio — não apenas técnica digital

Máximo de 3 a 5 frases. Seja conciso, impactante e estratégico.

Responda APENAS com JSON válido, sem texto antes ou depois:
{ "observations": "texto aqui" }`;

  const raw = await callAI(prompt);
  return parseJSON(raw).observations ?? '';
}
