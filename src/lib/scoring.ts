import { 
  SiteSection, 
  InstagramSection, 
  GMNSection, 
  PaidTrafficSection, 
  CommercialSection 
} from '@/types';

/**
 * Calculate Site section score (max 100)
 * - PageSpeed Desktop >= 80: +15 pts
 * - PageSpeed Mobile >= 80: +20 pts (mobile-first)
 * - Pixel installed: +15 pts
 * - Tag installed: +15 pts
 * - SEO metrics: up to +20 pts
 * - Checklist (4 items): up to +15 pts
 */
export function calculateSiteScore(site: SiteSection): number {
  let score = 0;

  // PageSpeed Desktop (max 15 pts)
  if (site.pageSpeed.desktopScore !== null) {
    if (site.pageSpeed.desktopScore >= 90) score += 15;
    else if (site.pageSpeed.desktopScore >= 80) score += 12;
    else if (site.pageSpeed.desktopScore >= 60) score += 8;
    else if (site.pageSpeed.desktopScore >= 40) score += 4;
  }

  // PageSpeed Mobile (max 20 pts - mobile first)
  if (site.pageSpeed.mobileScore !== null) {
    if (site.pageSpeed.mobileScore >= 90) score += 20;
    else if (site.pageSpeed.mobileScore >= 80) score += 16;
    else if (site.pageSpeed.mobileScore >= 60) score += 10;
    else if (site.pageSpeed.mobileScore >= 40) score += 5;
  }

  // Pixel installed (15 pts)
  if (site.pixelTag.pixelInstalled === true) score += 15;

  // Tag installed (15 pts)
  if (site.pixelTag.tagInstalled === true) score += 15;

  // SEO metrics (max 20 pts)
  let seoScore = 0;
  if (site.seo.organicKeywords !== null && site.seo.organicKeywords >= 100) seoScore += 5;
  if (site.seo.organicTraffic !== null && site.seo.organicTraffic >= 500) seoScore += 5;
  if (site.seo.domainAuthority !== null && site.seo.domainAuthority >= 20) seoScore += 5;
  if (site.seo.backlinks !== null && site.seo.backlinks >= 50) seoScore += 5;
  score += seoScore;

  // Checklist (max 15 pts - 3.75 each)
  const checklistItems = [
    site.checklist.credibleDesign,
    site.checklist.buttonsWorking,
    site.checklist.socialAccessible,
    site.checklist.ctaFirstPage,
  ];
  const trueItems = checklistItems.filter(item => item === true).length;
  score += Math.round((trueItems / 4) * 15);

  return Math.min(100, score);
}

/**
 * Calculate Instagram section score (max 100)
 * - Profile setup: up to 20 pts
 * - Bio completeness: up to 25 pts
 * - Highlights: up to 20 pts
 * - Pinned posts: up to 15 pts
 * - Link tracking: up to 20 pts
 */
export function calculateInstagramScore(instagram: InstagramSection): number {
  let score = 0;

  // Profile (max 20 pts)
  if (instagram.profile.hasOwnProfile === true) score += 5;
  if (instagram.profile.handle === 'ok') score += 5;
  if (instagram.profile.name === 'ok') score += 5;
  if (instagram.profile.profilePhoto === 'ok') score += 5;

  // Bio (max 25 pts - 5 each)
  if (instagram.bio.whatDoes === 'ok') score += 5;
  if (instagram.bio.whereOperates === 'ok') score += 5;
  if (instagram.bio.authority === 'ok') score += 5;
  if (instagram.bio.cta === 'ok') score += 5;
  if (instagram.bio.linkInBio === 'ok') score += 5;

  // Highlights (max 20 pts - 5 each)
  if (instagram.highlights.whoAmI === 'ok') score += 5;
  if (instagram.highlights.socialProof === 'ok') score += 5;
  if (instagram.highlights.authority === 'ok') score += 5;
  if (instagram.highlights.differential === 'ok') score += 5;

  // Pinned posts (max 15 pts - 5 each)
  if (instagram.pinned.whoAmI === 'ok') score += 5;
  if (instagram.pinned.socialProof === 'ok') score += 5;
  if (instagram.pinned.servicesOrMethod === 'ok') score += 5;

  // Link tracking (max 20 pts)
  if (instagram.bio.linkTracking === true) score += 20;

  return Math.min(100, score);
}

/**
 * Calculate GMN section score (max 100)
 * - Review count vs competition: up to 15 pts
 * - Average rating: up to 20 pts
 * - Health score: up to 25 pts
 * - Checklist (6 items): up to 40 pts
 */
export function calculateGMNScore(gmn: GMNSection): number {
  let score = 0;

  // Review count comparison (max 15 pts)
  if (gmn.reviewComparison === 'above') score += 15;
  else if (gmn.reviewComparison === 'average') score += 8;
  else if (gmn.reviewComparison === 'below') score += 3;

  // Average rating (max 20 pts)
  if (gmn.averageRating !== null) {
    if (gmn.averageRating >= 4.5) score += 20;
    else if (gmn.averageRating >= 4.0) score += 15;
    else if (gmn.averageRating >= 3.5) score += 10;
    else if (gmn.averageRating >= 3.0) score += 5;
  }

  // Health score (max 25 pts)
  if (gmn.healthScore !== null) {
    score += Math.round((gmn.healthScore / 100) * 25);
  }

  // Checklist (max 40 pts - ~6.67 each)
  const checklistItems = [
    gmn.checklist.napConsistent,
    gmn.checklist.hoursUpdated,
    gmn.checklist.relevantCategories,
    gmn.checklist.photosVideosUpdated,
    gmn.checklist.reviewsManaged,
    gmn.checklist.regularPosts,
  ];
  const trueItems = checklistItems.filter(item => item === true).length;
  score += Math.round((trueItems / 6) * 40);

  return Math.min(100, score);
}

/**
 * Calculate Paid Traffic section score (max 100)
 * - Google Ads active: up to 30 pts
 * - Facebook Ads active: up to 30 pts
 * - Video creatives: up to 40 pts
 */
export function calculatePaidTrafficScore(paidTraffic: PaidTrafficSection): number {
  let score = 0;

  // Google Ads (max 50 pts)
  if (paidTraffic.googleAds.isAdvertising === true) {
    score += 20;
    if (paidTraffic.googleAds.campaignCount !== null && paidTraffic.googleAds.campaignCount >= 3) {
      score += 10;
    }
    if (paidTraffic.googleAds.hasVideoCreatives === true) score += 20;
  }

  // Facebook Ads (max 50 pts)
  if (paidTraffic.facebookAds.isAdvertising === true) {
    score += 20;
    if (paidTraffic.facebookAds.campaignCount !== null && paidTraffic.facebookAds.campaignCount >= 3) {
      score += 10;
    }
    if (paidTraffic.facebookAds.hasVideoCreatives === true) score += 20;
  }

  return Math.min(100, score);
}

/**
 * Calculate Commercial section score (max 100)
 * - Lead response time: up to 50 pts
 * - Follow-ups: up to 50 pts
 */
export function calculateCommercialScore(commercial: CommercialSection): number {
  let score = 0;

  // Lead response time (max 50 pts)
  const responseTime = commercial.leadResponseTime.toLowerCase();
  if (responseTime.includes('minuto') || responseTime.includes('imediato') || responseTime.includes('instant')) {
    score += 50;
  } else if (responseTime.includes('hora') || responseTime.includes('1h') || responseTime.includes('2h')) {
    score += 35;
  } else if (responseTime.includes('dia') || responseTime.includes('24h')) {
    score += 20;
  } else if (responseTime.length > 0) {
    score += 10; // At least something entered
  }

  // Follow-ups (max 50 pts)
  const followUps = commercial.followUps.toLowerCase();
  if (followUps.includes('3') || followUps.includes('4') || followUps.includes('5') || followUps.includes('+')) {
    score += 50;
  } else if (followUps.includes('2')) {
    score += 35;
  } else if (followUps.includes('1')) {
    score += 20;
  } else if (followUps.includes('não') || followUps.includes('nenhum') || followUps.includes('0')) {
    score += 0;
  } else if (followUps.length > 0) {
    score += 10; // At least something entered
  }

  return Math.min(100, score);
}

/**
 * Base weights for each section
 */
const BASE_WEIGHTS = {
  site: 0.40,
  instagram: 0.25,
  gmn: 0.20,
  paidTraffic: 0.10,
  commercial: 0.05,
};

/**
 * Calculate dynamic weights based on disabled sections
 * Redistributes weights of disabled sections proportionally to enabled ones
 * 
 * Example: If only Instagram is enabled and has base weight 0.25:
 * - Disabled sections total: 0.75
 * - Instagram final weight: 0.25 / 0.25 = 1.0 (100%)
 * 
 * If Instagram and Site are enabled (0.25 + 0.40 = 0.65):
 * - Site final weight: 0.40 / 0.65 ≈ 0.615 (61.5%)
 * - Instagram final weight: 0.25 / 0.65 ≈ 0.385 (38.5%)
 */
function calculateDynamicWeights(disabledSections?: {
  site?: boolean;
  instagram?: boolean;
  gmn?: boolean;
  paidTraffic?: boolean;
  commercial?: boolean;
}): typeof BASE_WEIGHTS {
  if (!disabledSections || Object.values(disabledSections).every(v => !v)) {
    return BASE_WEIGHTS;
  }

  // Calculate total weight of enabled sections
  let totalEnabledWeight = 0;
  const enabledSections: (keyof typeof BASE_WEIGHTS)[] = [];
  
  (Object.keys(BASE_WEIGHTS) as Array<keyof typeof BASE_WEIGHTS>).forEach(section => {
    if (!disabledSections[section]) {
      totalEnabledWeight += BASE_WEIGHTS[section];
      enabledSections.push(section);
    }
  });

  // If no sections are enabled, return base weights
  if (totalEnabledWeight === 0) {
    return BASE_WEIGHTS;
  }

  // Calculate proportional weights for enabled sections
  const dynamicWeights = { ...BASE_WEIGHTS };
  enabledSections.forEach(section => {
    dynamicWeights[section] = BASE_WEIGHTS[section] / totalEnabledWeight;
  });

  // Set disabled sections to 0
  (Object.keys(BASE_WEIGHTS) as Array<keyof typeof BASE_WEIGHTS>).forEach(section => {
    if (disabledSections[section]) {
      dynamicWeights[section] = 0;
    }
  });

  return dynamicWeights;
}

/**
 * Calculate overall weighted score with dynamic weight redistribution
 * 
 * Original weights:
 * - Site: 40%
 * - Instagram: 25%
 * - GMN: 20%
 * - Paid Traffic: 10%
 * - Commercial: 5%
 * 
 * When sections are marked as "não se aplica" (disabled), their weights are
 * redistributed proportionally to the applicable sections.
 * 
 * Example: If Instagram, Paid Traffic, and Commercial are disabled:
 * - Total enabled weight: 40% + 20% = 60%
 * - Site final weight: 40% / 60% ≈ 66.7%
 * - GMN final weight: 20% / 60% ≈ 33.3%
 */
export function calculateOverallScore(
  siteScore: number,
  instagramScore: number,
  gmnScore: number,
  paidTrafficScore: number,
  commercialScore: number,
  disabledSections?: {
    site?: boolean;
    instagram?: boolean;
    gmn?: boolean;
    paidTraffic?: boolean;
    commercial?: boolean;
  }
): number {
  const weights = calculateDynamicWeights(disabledSections);
  
  return Math.round(
    siteScore * weights.site +
    instagramScore * weights.instagram +
    gmnScore * weights.gmn +
    paidTrafficScore * weights.paidTraffic +
    commercialScore * weights.commercial
  );
}
