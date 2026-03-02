// Client types
export interface Client {
  id: string;
  name: string;
  niche: string;
  contact: string;
  logoUrl?: string;
  createdAt: Date;
}

// Brand Kit types
export interface BrandKit {
  id: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  neutralColor: string;
  font: string;
  style: 'clean' | 'premium';
}

// Report types
export interface Report {
  id: string;
  clientId: string;
  title: string;
  date: Date;
  owner: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  overallScore: number;
  executiveSummary?: ExecutiveSummary;
  createdAt: Date;
}

export interface ExecutiveSummary {
  topProblems: SummaryItem[];
  topOpportunities: SummaryItem[];
  recommendedPlan: {
    days7: string[];
    days30: string[];
    days90: string[];
  };
}

export interface SummaryItem {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
}

// Evidence types
export interface Evidence {
  id: string;
  reportId: string;
  sectionName: string;
  fieldKey: string;
  fileUrl: string;
  extractedText?: string;
  confidence: number;
  createdAt: Date;
}

// Section data types
export interface PageSpeedData {
  desktopScore: number | null;
  mobileScore: number | null;
  evidence?: Evidence;
}

export interface PixelTagData {
  pixelInstalled: boolean | null;
  tagInstalled: boolean | null;
  evidence?: Evidence;
}

export interface SeoData {
  organicKeywords: number | null;
  organicTraffic: number | null;
  domainAuthority: number | null;
  backlinks: number | null;
  evidence?: Evidence;
}

export interface SiteChecklist {
  credibleDesign: boolean | null;
  buttonsWorking: boolean | null;
  socialAccessible: boolean | null;
  ctaFirstPage: boolean | null;
}

export interface SiteSection {
  siteUrl?: string;
  pageSpeed: PageSpeedData;
  pixelTag: PixelTagData;
  seo: SeoData;
  checklist: SiteChecklist;
  observations: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendations: string[];
  score: number;
}

export interface InstagramProfile {
  hasOwnProfile: boolean | null;
  handle: 'ok' | 'nok' | null;
  name: 'ok' | 'nok' | null;
  profilePhoto: 'ok' | 'nok' | null;
}

export interface InstagramBio {
  whatDoes: 'ok' | 'nok' | null;
  whereOperates: 'ok' | 'nok' | null;
  authority: 'ok' | 'nok' | null;
  cta: 'ok' | 'nok' | null;
  linkInBio: 'ok' | 'nok' | null;
}

export interface InstagramHighlights {
  whoAmI: 'ok' | 'nok' | null;
  socialProof: 'ok' | 'nok' | null;
  authority: 'ok' | 'nok' | null;
  differential: 'ok' | 'nok' | null;
}

export interface InstagramPinned {
  whoAmI: 'ok' | 'nok' | null;
  socialProof: 'ok' | 'nok' | null;
  servicesOrMethod: 'ok' | 'nok' | null;
}

export interface InstagramContent {
  feedFrequency: string;
  storiesFrequency: string;
}

export interface InstagramLink {
  withTracking: boolean | null;
  withoutTracking: boolean | null;
}

export interface InstagramSection {
  instagramUrls?: string[];
  profile: InstagramProfile;
  bio: InstagramBio;
  highlights: InstagramHighlights;
  pinned: InstagramPinned;
  content: InstagramContent;
  link: InstagramLink;
  evidence?: Evidence[];
  observations: string;
  recommendations: string[];
  score: number;
}

export interface GMNSection {
  gmnUrl?: string;
  reviewCount: number | null;
  reviewComparison: 'below' | 'average' | 'above' | null;
  averageRating: number | null;
  ratingComparison: 'below' | 'average' | 'above' | null;
  healthScore: number | null;
  checklist: {
    napConsistent: boolean | null;
    hoursUpdated: boolean | null;
    relevantCategories: boolean | null;
    photosVideosUpdated: boolean | null;
    reviewsManaged: boolean | null;
    regularPosts: boolean | null;
  };
  evidence?: Evidence;
  observations: string;
  recommendations: string[];
  score: number;
}

export interface PaidTrafficPlatform {
  isAdvertising: boolean | null;
  campaignCount: number | null;
  hasVideoCreatives: boolean | null;
  evidence?: Evidence;
}

export interface PaidTrafficSection {
  googleAdsUrl?: string;
  facebookAdsUrl?: string;
  googleAds: PaidTrafficPlatform;
  facebookAds: PaidTrafficPlatform;
  observations: string;
  recommendations: string[];
  score: number;
}

export interface CommercialSection {
  whatsappNumbers?: string[];
  leadResponseTime: string;
  followUps: string;
  followUpObservation: string;
  evidence?: Evidence;
  observations: string;
  recommendations: string[];
  score: number;
}

export interface ReportSections {
  site: SiteSection;
  instagram: InstagramSection;
  gmn: GMNSection;
  paidTraffic: PaidTrafficSection;
  commercial: CommercialSection;
}

// Extraction result
export interface ExtractionResult {
  fieldKey: string;
  value: string | number | boolean;
  confidence: number;
  needsReview: boolean;
}
