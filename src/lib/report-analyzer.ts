import {
  SiteSection,
  InstagramSection,
  GMNSection,
  PaidTrafficSection,
  CommercialSection,
  SummaryItem,
} from '@/types';

/**
 * Intelligent Report Analyzer
 * Generates personalized problems, opportunities, and recommendations
 * based on actual data, not pre-written templates
 */

// ─── SITE SECTION ANALYZER ─────────────────────────────────────────

export function analyzeSite(site: SiteSection, isDisabled: boolean) {
  const result = {
    problems: [] as SummaryItem[],
    opportunities: [] as SummaryItem[],
    recommendations: [] as string[],
  };

  if (isDisabled || !site || site.score === 0) {
    return result;
  }

  // Analyze PageSpeed Mobile (most critical)
  if (site.pageSpeed.mobileScore !== null) {
    if (site.pageSpeed.mobileScore < 50) {
      result.problems.push({
        title: 'PageSpeed Mobile crítico',
        priority: 'urgent',
        description: `Score de ${site.pageSpeed.mobileScore} — muito abaixo do recomendado (80+). Usuários desistem antes de carregar.`,
      });
      result.recommendations.push('Otimizar imagens com compressão e lazy loading');
      result.recommendations.push('Minificar CSS/JS e implementar cache do navegador');
    } else if (site.pageSpeed.mobileScore < 80) {
      result.problems.push({
        title: 'PageSpeed Mobile baixo',
        priority: 'high',
        description: `Score de ${site.pageSpeed.mobileScore} — abaixo do ideal (80+). Afeta ranking no Google.`,
      });
      result.recommendations.push('Comprimir imagens e implementar lazy loading');
    } else {
      result.opportunities.push({
        title: 'PageSpeed Mobile otimizado',
        priority: 'low',
        description: `Score de ${site.pageSpeed.mobileScore} está bom. Continue acompanhando.`,
      });
    }
  }

  // Analyze Pixel installation
  if (site.pixelTag.pixelInstalled === false) {
    result.problems.push({
      title: 'Pixel do Facebook não instalado',
      priority: 'high',
      description: 'Impossível fazer remarketing para visitantes. Você está perdendo conversões conhecidas.',
    });
    result.recommendations.push('Instalar Pixel do Facebook imediatamente');
  }

  // Analyze CTA on first page
  if (site.checklist.ctaFirstPage === false) {
    result.problems.push({
      title: 'Sem CTA acima da dobra',
      priority: 'high',
      description: 'Visitantes precisam rolar para encontrar ação principal. Reduz conversão em 30-40%.',
    });
    result.recommendations.push('Adicionar botão de ação principal (Agendar, Contato) no topo da home');
  }

  // Analyze SEO
  if (site.seo.organicKeywords !== null && site.seo.organicKeywords < 50) {
    result.opportunities.push({
      title: 'Oportunidade SEO',
      priority: 'medium',
      description: `Apenas ${site.seo.organicKeywords} keywords ranqueadas. Potencial para crescimento.`,
    });
    result.recommendations.push('Realizar pesquisa de keywords e otimizar blog/conteúdo');
  }

  return result;
}

// ─── INSTAGRAM SECTION ANALYZER ────────────────────────────────────

export function analyzeInstagram(instagram: InstagramSection, isDisabled: boolean) {
  const result = {
    problems: [] as SummaryItem[],
    opportunities: [] as SummaryItem[],
    recommendations: [] as string[],
  };

  if (isDisabled || !instagram || instagram.score === 0) {
    return result;
  }

  // Include auditor observations as context
  const auditorContext = instagram.observations?.toLowerCase() || '';

  // Check profile setup
  if (instagram.profile.hasOwnProfile === false) {
    result.problems.push({
      title: 'Sem perfil próprio',
      priority: 'urgent',
      description: 'Perfil pessoal ou de terceiros. Recomendação: criar Business Profile.',
    });
    result.recommendations.push('Migrar para Instagram Business Profile para acesso a métricas');
  }

  if (instagram.profile.handle !== 'ok') {
    result.problems.push({
      title: 'Username não otimizado',
      priority: 'medium',
      description: 'Handle difícil de lembrar ou sem relação com negócio.',
    });
    result.recommendations.push('Usar username que reflita o negócio (clínica, serviço, marca)');
  }

  // Check bio completeness + link tracking
  const bioIssues = [];
  if (instagram.bio.whatDoes !== 'ok') {
    bioIssues.push('descrição do negócio/serviço');
  }
  if (instagram.bio.whereOperates !== 'ok') {
    bioIssues.push('localização ou área de atuação');
  }
  if (instagram.bio.authority !== 'ok') {
    bioIssues.push('credencial ou selo de autoridade');
  }
  if (instagram.bio.cta !== 'ok') {
    bioIssues.push('call-to-action claro');
  }
  if (instagram.bio.linkInBio !== 'ok') {
    bioIssues.push('link funcional na bio');
  }

  if (bioIssues.length > 0) {
    result.problems.push({
      title: 'Bio incompleta ou ineficaz',
      priority: 'high',
      description: `Faltam: ${bioIssues.join(', ')}. Visitantes não sabem como agir.`,
    });
    result.recommendations.push('Atualizar bio com: descrição, localização, credencial, e CTA (ex: "Agende ↓")');
  }

  // Check link tracking (now in bio)
  if (instagram.bio.linkTracking === false) {
    result.opportunities.push({
      title: 'Link na bio sem rastreamento UTM',
      priority: 'medium',
      description: 'Você está perdendo dados sobre cliques. Não sabe de onde vem o tráfego.',
    });
    result.recommendations.push('Adicionar UTM parameters ao link (utm_source=instagram_bio)');
  } else if (instagram.bio.linkTracking === true) {
    result.opportunities.push({
      title: 'Link rastreado na bio',
      priority: 'low',
      description: 'Ótimo! Você consegue medir o que funciona.',
    });
  }

  // Check highlights including differential
  const missingHighlights = [];
  if (instagram.highlights.whoAmI !== 'ok') missingHighlights.push('Quem Sou');
  if (instagram.highlights.socialProof !== 'ok') missingHighlights.push('Prova Social');
  if (instagram.highlights.authority !== 'ok') missingHighlights.push('Autoridade');
  if (instagram.highlights.differential !== 'ok') missingHighlights.push('Diferenciais');

  if (missingHighlights.length > 0) {
    result.problems.push({
      title: 'Destaques incompletos - falta credibilidade',
      priority: 'high',
      description: `Faltam destaques de: ${missingHighlights.join(', ')}. Reduz confiança e decisão de compra.`,
    });
    result.recommendations.push(`Criar destaques: ${missingHighlights.join(', ')}`);
  }

  // Special attention to differentials (methodology/unique selling point)
  if (instagram.highlights.differential !== 'ok') {
    result.problems.push({
      title: 'Diferenciais/Metodologia não expostos',
      priority: 'medium',
      description: 'Sua proposta única não fica clara. Você aparece genérico como os concorrentes.',
    });
    result.recommendations.push('Criar destaque mostrando sua metodologia única, processo ou diferencial principal');
    result.recommendations.push('Exemplos: "Resultado em 3 sessões com XYZ", "Único com certificação ABC", etc');
  }

  // Check content frequency
  if (instagram.content.feedFrequency === '' || instagram.content.feedFrequency === 'rare') {
    result.problems.push({
      title: 'Frequência de postagem muito baixa',
      priority: 'high',
      description: 'Posts raros = Instagram não impulsiona seu conteúdo. Você fica invisível.',
    });
    result.recommendations.push('Aumentar para mínimo 3-4x/semana no feed + 5-7 stories/dia');
    result.recommendations.push('Criar conteúdo em batches para manter consistência');
  } else if (!instagram.content.feedFrequency?.includes('daily') && !instagram.content.feedFrequency?.includes('3x')) {
    result.opportunities.push({
      title: 'Potencial de maior frequência',
      priority: 'medium',
      description: `Frequência atual: ${instagram.content.feedFrequency}. Teste aumentar para 3-4x/semana.`,
    });
  }

  // Stories frequency
  if (instagram.content.storiesFrequency === '' || instagram.content.storiesFrequency === 'rare') {
    result.recommendations.push('Aumentar stories para quotidianamente (mínimo 5/dia)');
    result.recommendations.push('Usar stickers interativos (polls, perguntas) para aumentar engajamento');
  }

  // Use auditor observations to enrich analysis
  if (auditorContext) {
    if (auditorContext.includes('baixo engajamento') || auditorContext.includes('poucos likes')) {
      result.problems.push({
        title: 'Baixo engajamento',
        priority: 'high',
        description: 'Taxa de engajamento abaixo do esperado. Conteúdo não conecta com audiência.',
      });
      result.recommendations.push('Fazer polls, perguntas e conteúdo mais pessoal/educativo');
      result.recommendations.push('Responder todos os comentários nos primeiros 60 minutos após postar');
    }

    if (auditorContext.includes('falta') && auditorContext.includes('conteúdo')) {
      result.problems.push({
        title: 'Falta de variedade de conteúdo',
        priority: 'medium',
        description: 'Conteúdo repetitivo ou sem estratégia clara.',
      });
      result.recommendations.push('Criar calendário editorial: educativo, inspiracional, depoimentos, bts');
    }
  }

  return result;
}

// ─── GMN SECTION ANALYZER ──────────────────────────────────────────

export function analyzeGMN(gmn: GMNSection, isDisabled: boolean) {
  const result = {
    problems: [] as SummaryItem[],
    opportunities: [] as SummaryItem[],
    recommendations: [] as string[],
  };

  if (isDisabled || !gmn || gmn.score === 0) {
    return result;
  }

  // Analyze review count
  if (gmn.reviewComparison === 'below') {
    result.problems.push({
      title: 'Poucas avaliações',
      priority: 'high',
      description: `${gmn.reviewCount || 0} avaliações — concorrentes têm mais. Clientes não confiam em pouca prova social.`,
    });
    result.recommendations.push('Solicitar avaliações pós-consulta via WhatsApp e QR Code na recepção');
  }

  // Analyze rating
  if (gmn.averageRating !== null && gmn.averageRating < 4.0) {
    result.problems.push({
      title: 'Nota média baixa',
      priority: 'high',
      description: `Nota ${gmn.averageRating} — abaixo do esperado. Afeta decisão de compra.`,
    });
    result.recommendations.push('Responder todas avaliações (negativas e positivas) em até 48h');
    result.recommendations.push('Identificar padrão de reclamações e resolver problemas');
  }

  // Analyze health score
  if (gmn.healthScore !== null && gmn.healthScore < 70) {
    result.problems.push({
      title: 'Health score baixo',
      priority: 'medium',
      description: `Score de ${gmn.healthScore}% — informações desatualizadas. Atualize fotos, horários, categoria.`,
    });
    result.recommendations.push('Atualizar fotos profissionais e informações da empresa');
  }

  // Analyze checklist
  const missingItems = [];
  if (gmn.checklist.napConsistent === false) missingItems.push('NAP consistente');
  if (gmn.checklist.hoursUpdated === false) missingItems.push('Horários atualizados');
  if (gmn.checklist.photosVideosUpdated === false) missingItems.push('Fotos/vídeos atualizados');
  if (gmn.checklist.reviewsManaged === false) missingItems.push('Avaliações respondidas');

  if (missingItems.length > 0) {
    result.recommendations.push(`Completar: ${missingItems.join(', ')}`);
  }

  return result;
}

// ─── PAID TRAFFIC SECTION ANALYZER ─────────────────────────────────

export function analyzePaidTraffic(paidTraffic: PaidTrafficSection, isDisabled: boolean) {
  const result = {
    problems: [] as SummaryItem[],
    opportunities: [] as SummaryItem[],
    recommendations: [] as string[],
  };

  if (isDisabled || !paidTraffic || paidTraffic.score === 0) {
    return result;
  }

  // Analyze Google Ads
  if (paidTraffic.googleAds.isAdvertising === false) {
    result.opportunities.push({
      title: 'Google Ads não ativo',
      priority: 'high',
      description: 'Você está deixando clientes interessados irem para a concorrência.',
    });
    result.recommendations.push('Criar campanhas Google Ads com orçamento mínimo de início');
  }

  // Analyze Facebook Ads
  if (paidTraffic.facebookAds.isAdvertising === false) {
    result.opportunities.push({
      title: 'Meta Ads não ativo',
      priority: 'high',
      description: 'Perda de oportunidade para retargeting e lookalike audiences.',
    });
    result.recommendations.push('Estruturar campanhas Meta Ads segmentadas por interesse');
  }

  // Analyze video creatives
  if (paidTraffic.googleAds.isAdvertising === true && paidTraffic.googleAds.hasVideoCreatives === false) {
    result.opportunities.push({
      title: 'Google Ads sem vídeos',
      priority: 'medium',
      description: 'Vídeos têm 2-3x melhor CTR que imagens estáticas.',
    });
    result.recommendations.push('Criar vídeos criativos rápidos (15-30s) para Google Ads');
  }

  return result;
}

// ─── COMMERCIAL SECTION ANALYZER ───────────────────────────────────

export function analyzeCommercial(commercial: CommercialSection, isDisabled: boolean) {
  const result = {
    problems: [] as SummaryItem[],
    opportunities: [] as SummaryItem[],
    recommendations: [] as string[],
  };

  if (isDisabled || !commercial || commercial.score === 0) {
    return result;
  }

  // Check response time
  const responseText = commercial.leadResponseTime.toLowerCase();
  if (responseText.includes('24') || responseText.includes('dia')) {
    result.problems.push({
      title: 'Tempo de resposta muito lento',
      priority: 'urgent',
      description: 'Leads esperando 24h já agendaram com concorrência. Pesquisas mostram: responder em 5 min = 21x mais conversão.',
    });
    result.recommendations.push('Configurar alertas automáticos para novos leads');
    result.recommendations.push('Reduzir tempo de resposta para menos de 5 minutos');
  } else if (responseText.includes('hora') && !responseText.includes('5')) {
    result.problems.push({
      title: 'Tempo de resposta lento',
      priority: 'high',
      description: `${commercial.leadResponseTime} é aceitável mas pode melhorar. Ideal é menos de 5 minutos.`,
    });
    result.recommendations.push('Implementar sistema de alertas para WhatsApp/email');
  }

  // Check follow-ups
  const followUpMatch = commercial.followUps.match(/\d+/);
  const followUpCount = followUpMatch ? parseInt(followUpMatch[0]) : 0;

  if (followUpCount < 3) {
    result.problems.push({
      title: `Poucos follow-ups (${followUpCount})`,
      priority: 'high',
      description: '80% das vendas acontecem entre o 5º e 12º contato. Você está desistindo muito cedo.',
    });
    result.recommendations.push('Implementar cadência de no mínimo 5 follow-ups com scripts padronizados');
    result.recommendations.push('Usar CRM (Pipedrive, HubSpot) para gerenciar pipeline');
  }

  return result;
}

/**
 * Generate smart fallback recommendations when none are available
 */
function generateSmartFallbackRecommendations(sections: {
  site: SiteSection;
  instagram: InstagramSection;
  gmn: GMNSection;
  paidTraffic: PaidTrafficSection;
  commercial: CommercialSection;
  disabledSections?: Record<string, boolean>;
}): string[] {
  const recommendations: string[] = [];

  if (!sections.disabledSections?.site) {
    recommendations.push('Realizar auditoria técnica completa do site');
    recommendations.push('Melhorar experiência do usuário (UX) nos dispositivos móveis');
  }

  if (!sections.disabledSections?.instagram) {
    recommendations.push('Aumentar frequência de postagens e engajamento no Instagram');
    recommendations.push('Criar conteúdo mais diversificado (Reels, Stories, Carrosel)');
  }

  if (!sections.disabledSections?.gmn) {
    recommendations.push('Incentivar clientes a deixar avaliações no Google');
    recommendations.push('Manter informações do Google Meu Negócio sempre atualizadas');
  }

  if (!sections.disabledSections?.paidTraffic) {
    recommendations.push('Iniciar campanhas estruturadas de tráfego pago');
    recommendations.push('Testar diferentes plataformas (Google Ads, Facebook, Instagram)');
  }

  if (!sections.disabledSections?.commercial) {
    recommendations.push('Implementar sistema de follow-up automático de leads');
    recommendations.push('Criar scripts de venda padronizados');
  }

  return recommendations.slice(0, 8);
}

/**
 * Generate generic recommendation by index
 */
function generateGenericRecommendation(index: number): string {
  const genericRecommendations = [
    'Estabelecer métricas de sucesso e KPIs para acompanhar progresso',
    'Investir em treinamento de equipe para melhorar processos',
    'Implementar ferramentas de automação para eficiência',
    'Realizar testes A/B para otimizar estratégias',
    'Documentar processos e criar playbooks de ação',
    'Análisar concorrentes para identificar oportunidades',
    'Criar calendário editorial estruturado',
    'Implementar sistema de CRM para gestão de relacionamento',
  ];
  return genericRecommendations[index % genericRecommendations.length];
}

/**
 * Generate smart fallback problems
 */
function generateSmartFallbackProblems(_sections?: any): SummaryItem[] {
  const problems: SummaryItem[] = [];

  // Always mention general challenges
  problems.push({
    title: 'Análise em Progresso',
    priority: 'medium',
    description: 'Presença digital requer acompanhamento contínuo. Revisite esta análise regularmente para acompanhar melhorias.',
  });

  problems.push({
    title: 'Oportunidades de Otimização',
    priority: 'medium',
    description: 'Existem sempre espaços para melhorar em diferentes canais. Priorize baseado em seus objetivos.',
  });

  return problems;
}

/**
 * Generate smart fallback opportunities
 */
function generateSmartFallbackOpportunities(sections: any): SummaryItem[] {
  const opportunities: SummaryItem[] = [];

  opportunities.push({
    title: 'Potencial de Crescimento',
    priority: 'high',
    description: 'Sua presença digital tem espaço para crescimento significativo. Implemente as recomendações para ver resultados.',
  });

  opportunities.push({
    title: 'Diferenciação no Mercado',
    priority: 'medium',
    description: 'Destaque-se dos concorrentes com estratégia coerente em todos os canais.',
  });

  return opportunities;
}

/**
 * Consolidate all analyses into executive summary
 */
export function generateExecutiveSummary(
  site: SiteSection,
  instagram: InstagramSection,
  gmn: GMNSection,
  paidTraffic: PaidTrafficSection,
  commercial: CommercialSection,
  disabledSections?: Record<string, boolean>
) {
  const analyses = {
    site: analyzeSite(site, disabledSections?.site || false),
    instagram: analyzeInstagram(instagram, disabledSections?.instagram || false),
    gmn: analyzeGMN(gmn, disabledSections?.gmn || false),
    paidTraffic: analyzePaidTraffic(paidTraffic, disabledSections?.paidTraffic || false),
    commercial: analyzeCommercial(commercial, disabledSections?.commercial || false),
  };

  // Consolidate all problems, sorted by priority
  const allProblems = [
    ...analyses.site.problems,
    ...analyses.instagram.problems,
    ...analyses.gmn.problems,
    ...analyses.paidTraffic.problems,
    ...analyses.commercial.problems,
  ].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - 
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  // Consolidate all opportunities
  const allOpportunities = [
    ...analyses.site.opportunities,
    ...analyses.instagram.opportunities,
    ...analyses.gmn.opportunities,
    ...analyses.paidTraffic.opportunities,
    ...analyses.commercial.opportunities,
  ].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - 
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  // Consolidate all recommendations and remove duplicates
  let allRecommendations = Array.from(
    new Set([
      ...analyses.site.recommendations,
      ...analyses.instagram.recommendations,
      ...analyses.gmn.recommendations,
      ...analyses.paidTraffic.recommendations,
      ...analyses.commercial.recommendations,
    ])
  );

  // FALLBACK: If no recommendations generated, create intelligent defaults based on enabled sections
  if (allRecommendations.length === 0) {
    // Generate smart fallback recommendations based on what's enabled
    allRecommendations = generateSmartFallbackRecommendations(disabledSections);
  }

  // Ensure we have at least 8 recommendations for full plan coverage
  while (allRecommendations.length < 8) {
    allRecommendations.push(generateGenericRecommendation(allRecommendations.length));
  }

  // Generate time-based action plan - ALWAYS populated
  const recommendedPlan = {
    days7: allRecommendations.slice(0, Math.max(2, Math.ceil(allRecommendations.length / 4))),
    days30: allRecommendations.slice(
      Math.ceil(allRecommendations.length / 4),
      Math.ceil(allRecommendations.length / 2)
    ),
    days90: allRecommendations.slice(Math.ceil(allRecommendations.length / 2)),
  };

  return {
    topProblems: allProblems.length > 0 ? allProblems.slice(0, 3) : generateSmartFallbackProblems(disabledSections),
    topOpportunities: allOpportunities.length > 0 ? allOpportunities.slice(0, 3) : generateSmartFallbackOpportunities(disabledSections),
    recommendedPlan,
  };
}
