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

  // Check bio completeness
  const bioIssues = [];
  if (instagram.bio.whatDoes !== 'ok') {
    bioIssues.push('descrição do negócio');
  }
  if (instagram.bio.authority !== 'ok') {
    bioIssues.push('selo de autoridade');
  }
  if (instagram.bio.cta !== 'ok') {
    bioIssues.push('call-to-action claro');
  }

  if (bioIssues.length > 0) {
    result.problems.push({
      title: 'Bio incompleta',
      priority: 'high',
      description: `Faltam: ${bioIssues.join(', ')}. Visitantes não sabem o que você oferece.`,
    });
    result.recommendations.push('Atualizar bio com: o que faz, onde atua, CTA clara (ex: "Agende ↓")');
  }

  // Check highlights
  const missingHighlights = [];
  if (instagram.highlights.whoAmI !== 'ok') missingHighlights.push('Quem Sou');
  if (instagram.highlights.socialProof !== 'ok') missingHighlights.push('Prova Social');
  if (instagram.highlights.differential !== 'ok') missingHighlights.push('Diferenciais');

  if (missingHighlights.length > 0) {
    result.problems.push({
      title: 'Destaques incompletos',
      priority: 'medium',
      description: `Faltam destaques de: ${missingHighlights.join(', ')}. Reduz confiança do visitante.`,
    });
    result.recommendations.push(`Criar destaques: ${missingHighlights.join(', ')}`);
  }

  // Check content frequency
  if (instagram.content.feedFrequency === '' || instagram.content.feedFrequency === 'rare') {
    result.problems.push({
      title: 'Frequência de postagem muito baixa',
      priority: 'high',
      description: 'Posts raros = algoritmo não impulsiona. Você fica invisível.',
    });
    result.recommendations.push('Aumentar para mínimo 3x/semana no feed');
  }

  // Check link tracking
  if (instagram.link.withTracking === false && instagram.link.withoutTracking === true) {
    result.opportunities.push({
      title: 'Link sem rastreamento',
      priority: 'medium',
      description: 'Você não consegue medir quantas visitas/conversões vêm do Instagram.',
    });
    result.recommendations.push('Adicionar UTM parameters ao link da bio para rastrear conversões');
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
  const allRecommendations = Array.from(
    new Set([
      ...analyses.site.recommendations,
      ...analyses.instagram.recommendations,
      ...analyses.gmn.recommendations,
      ...analyses.paidTraffic.recommendations,
      ...analyses.commercial.recommendations,
    ])
  );

  // Generate time-based action plan
  const recommendedPlan = {
    days7: allRecommendations.slice(0, 2),
    days30: allRecommendations.slice(2, 4),
    days90: allRecommendations.slice(4, 6),
  };

  return {
    topProblems: allProblems.slice(0, 3),
    topOpportunities: allOpportunities.slice(0, 3),
    recommendedPlan,
  };
}
