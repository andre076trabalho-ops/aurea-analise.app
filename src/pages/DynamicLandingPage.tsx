import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import logoAurea from '@/assets/logo-aurea.png';
import { useAppStore } from '@/stores/useAppStore';
import { defaultSections } from '@/data/sampleSections';
import { supabase } from '@/integrations/supabase/client';
import { ReportSections, ReportBranding } from '@/types';
import {
  Globe, Instagram, MapPin, Megaphone, Briefcase,
  CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  Calendar, ArrowRight, TrendingUp, Shield, Zap,
  ChevronDown, Phone, Star, Sparkles, MapPinned, Loader2,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}
function scoreBg(score: number) {
  if (score >= 80) return 'bg-success/15 border-success/30';
  if (score >= 60) return 'bg-warning/15 border-warning/30';
  return 'bg-error/15 border-error/30';
}
function scoreLabel(score: number) {
  if (score >= 80) return 'Bom';
  if (score >= 60) return 'Regular';
  return 'Crítico';
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(142 76% 36%)' : score >= 60 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', scoreColor(score), size >= 100 ? 'text-4xl' : 'text-2xl')}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      {label && <p className="text-sm text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}

function BoolBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-success text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" /> Sim
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-error text-sm font-medium">
      <XCircle className="w-4 h-4" /> Não
    </span>
  );
}

function SectionBlock({ icon: Icon, title, score, children, index, contextNote, editable }: {
  icon: any; title: string; score: number; children: React.ReactNode; index: number; contextNote?: string; editable?: boolean;
}) {
  const eProps = editable ? { contentEditable: true, suppressContentEditableWarning: true } as const : {};
  return (
    <motion.section custom={index} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground" {...eProps}>{title}</h3>
              <p className={cn('text-sm font-semibold', scoreColor(score))}>{scoreLabel(score)}</p>
            </div>
          </div>
          <ScoreRing score={score} size={72} />
        </div>
        {contextNote && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-accent/50 border border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-2" {...eProps}>
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {contextNote}
            </p>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </motion.section>
  );
}

function Recommendations({ items, clientName, editable }: { items: string[]; clientName: string; editable?: boolean }) {
  if (!items.length) return null;
  const eProps = editable ? { contentEditable: true, suppressContentEditableWarning: true } as const : {};
  return (
    <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/15">
      <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> Recomendações para {clientName}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80" {...eProps}>
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-secondary/30 rounded-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function DynamicLandingPage() {
  const { reportId } = useParams();
  const { reports, clients, getReportSections, getReportBranding, brandKit, setReportBrandingForId, currentReportId, currentReportSections } = useAppStore();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const [isLoadingBranding, setIsLoadingBranding] = useState(false);
  const [dbData, setDbData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isEditing = false;

  // Try to load from database first (for shared links)
  useEffect(() => {
    if (!reportId) { setIsLoading(false); return; }
    
    supabase
      .from('published_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setDbData(data);
        }
        setIsLoading(false);
      });
  }, [reportId]);

  // Resolve data: DB first, then localStorage fallback
  const report = dbData 
    ? { id: dbData.id, clientId: '', title: dbData.report_title, date: new Date(dbData.report_date), owner: '', status: 'completed' as const, overallScore: dbData.overall_score, createdAt: new Date(dbData.published_at) }
    : reports.find(r => r.id === reportId);
  
  const client = dbData
    ? { id: '', name: dbData.client_name, contact: dbData.client_contact || '', doctorName: dbData.doctor_name || '', city: dbData.city || '', createdAt: new Date() }
    : (report ? clients.find(c => c.id === report.clientId) : null);

  const localSections = reportId ? getReportSections(reportId) : null;
  const sections = dbData?.sections 
    ? (dbData.sections as ReportSections) 
    : (localSections || (currentReportId === reportId && currentReportSections ? currentReportSections : null) || (report ? defaultSections : null));
  
  const branding = dbData?.branding 
    ? (dbData.branding as ReportBranding) 
    : (reportId ? getReportBranding(reportId) : null);

  // Auto-detect branding if not yet detected
  useEffect(() => {
    if (!reportId || !sections || branding) return;
    const siteUrl = sections.site?.siteUrl;
    if (!siteUrl) return;

    setIsLoadingBranding(true);
    supabase.functions.invoke('extract-branding', { body: { url: siteUrl } })
      .then(({ data, error }) => {
        if (!error && data?.branding) {
          setReportBrandingForId(reportId, data.branding);
        }
      })
      .finally(() => setIsLoadingBranding(false));
  }, [reportId, sections?.site?.siteUrl, branding]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report || !client || !sections) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Relatório não encontrado</h2>
          <p className="text-muted-foreground mb-4">Este relatório não existe ou ainda não foi preenchido.</p>
          <Link to="/reports" className="text-primary hover:underline">Voltar para Relatórios</Link>
        </div>
      </div>
    );
  }


  const s = sections;
  const executiveSummary = (s as any).executiveSummary as { recommendedPlan?: { days7: string[]; days30: string[]; days90: string[] } } | undefined;
  const disabled = s.disabledSections || {};
  const clientName = branding?.businessName || client.name;
  const clientLocation = branding?.location || '';

  const activeSections = {
    site: !disabled.site,
    instagram: !disabled.instagram,
    gmn: !disabled.gmn,
    paidTraffic: !disabled.paidTraffic,
    commercial: !disabled.commercial,
  };

  const activeScores = [
    activeSections.site && { weight: 0.4, score: s.site.score },
    activeSections.instagram && { weight: 0.25, score: s.instagram.score },
    activeSections.gmn && { weight: 0.2, score: s.gmn.score },
    activeSections.paidTraffic && { weight: 0.1, score: s.paidTraffic.score },
    activeSections.commercial && { weight: 0.05, score: s.commercial.score },
  ].filter(Boolean) as { weight: number; score: number }[];

  const totalWeight = activeScores.reduce((sum, a) => sum + a.weight, 0);
  const overallScore = totalWeight > 0
    ? Math.round(activeScores.reduce((sum, a) => sum + a.score * (a.weight / totalWeight), 0))
    : 0;

  const pillars = [
    activeSections.site && { icon: Globe, label: 'Site', score: s.site.score },
    activeSections.instagram && { icon: Instagram, label: 'Instagram', score: s.instagram.score },
    activeSections.gmn && { icon: MapPin, label: 'Google Meu Negócio', score: s.gmn.score },
    activeSections.paidTraffic && { icon: Megaphone, label: 'Tráfego Pago', score: s.paidTraffic.score },
    activeSections.commercial && { icon: Briefcase, label: 'Comercial', score: s.commercial.score },
  ].filter(Boolean) as { icon: any; label: string; score: number }[];

  const reportDate = new Date(report.date);

  // WhatsApp CTA - prefer branding data, fallback to commercial section
  const whatsappNumber = branding?.whatsappNumber || s.commercial.whatsappNumbers?.[0] || '';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
  const whatsappCTA = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Olá, vi o relatório de auditoria digital e gostaria de conversar sobre as melhorias recomendadas.`)}`
    : '';

  const hasAboutSection = branding && (branding.bio || branding.businessPhotoUrl || branding.professionalPhotoUrl || (branding.services && branding.services.length > 0));

  return (
    <div className="min-h-screen bg-background">

      {isLoadingBranding && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Personalizando com dados do site...</span>
        </div>
      )}

      {/* ── HERO — Clean white cover ────────────────────── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center bg-white">
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Client Logo (from branding detection) */}
          {branding?.logoUrl && (
            <motion.img
              src={branding.logoUrl}
              alt={`Logo ${clientName}`}
              className="h-16 md:h-20 mx-auto mb-10 object-contain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            />
          )}

          {/* If no client logo, show Áurea logo */}
          {!branding?.logoUrl && (
            <motion.img
              src={logoAurea}
              alt="Áurea Performance"
              className="h-14 md:h-16 mx-auto mb-10 object-contain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            />
          )}

          <motion.h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3"
            style={{ color: 'hsl(var(--primary))' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
                     >
            Relatório de Auditoria
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl font-medium mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
          >
            Presença Digital
          </motion.p>

          {/* Decorative line */}
          <motion.div
            className="w-16 h-0.5 mx-auto mb-8"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          />

          <motion.p
            className="text-base md:text-lg font-semibold mb-2"
            style={{ color: 'hsl(var(--primary))' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7 }}
          >
            {clientName}
          </motion.p>

          <motion.p
            className="text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.7 }}
          >
            {reportDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </motion.p>
        </div>

        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Veja o relatório completo</span>
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </motion.div>
      </section>

      {/* ── SCORE OVERVIEW (after scroll) ────────────────── */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <ScoreRing score={overallScore} size={160} />
            <p className="text-muted-foreground mt-3 text-sm font-medium">Score Geral da Presença Digital</p>
          </motion.div>
        </div>
      </section>

      {/* ── ABOUT THE BUSINESS (card matching reference) ───── */}
      {hasAboutSection && (
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                {/* Left: business/establishment photo */}
                {branding?.businessPhotoUrl && (
                  <div className="relative h-48 md:h-full min-h-[200px]">
                    <img
                      src={branding.businessPhotoUrl}
                      alt={clientName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Right: info */}
                <div className={cn("p-6 md:p-8 flex flex-col justify-center", !branding?.businessPhotoUrl && "md:col-span-2")}>
                  {/* Name row with avatar */}
                  <div className="flex items-center gap-4 mb-3">
                    {branding?.professionalPhotoUrl && (
                      <img
                        src={branding.professionalPhotoUrl}
                        alt={clientName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shrink-0"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">{clientName}</h3>
                    </div>
                  </div>

                  {/* Bio */}
                  {branding?.bio && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                      {branding.bio}
                    </p>
                  )}

                  {/* Services as tags */}
                  {branding?.services && branding.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {branding.services.slice(0, 7).map((svc) => (
                        <span key={svc} className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 text-foreground/70 border border-border">
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact row — only show verified data */}
                  {(clientLocation || (branding?.phone && branding.phone.length > 3) || (branding?.instagramHandle && branding.instagramHandle.length > 2)) && (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-border text-sm text-muted-foreground">
                      {clientLocation && (
                        <span className="flex items-center gap-1.5"><MapPinned className="w-3.5 h-3.5" /> {clientLocation}</span>
                      )}
                      {branding?.phone && branding.phone.length > 3 && (
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {branding.phone}</span>
                      )}
                      {branding?.instagramHandle && branding.instagramHandle.length > 2 && (
                        <a
                          href={`https://www.instagram.com/${branding.instagramHandle.replace('@', '')}/`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5" /> {branding.instagramHandle}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── PILLARS OVERVIEW ─────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4"
          >
            Diagnóstico Digital {clientName !== client.name ? `da ${clientName}` : ''}
          </motion.h2>
          <motion.p
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-muted-foreground text-center mb-12 max-w-lg mx-auto"
          >
            Análise dos 5 pilares que impactam a presença digital
            {clientLocation ? ` em ${clientLocation}` : ''}
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label} custom={i + 2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={cn('flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all hover:scale-[1.03]', scoreBg(p.score))}
              >
                <p.icon className={cn('w-7 h-7', scoreColor(p.score))} />
                <ScoreRing score={p.score} size={64} />
                <p className="text-sm font-medium text-foreground text-center">{p.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRITICAL ISSUES & OPPORTUNITIES ──────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="p-8 rounded-2xl bg-error/5 border border-error/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Problemas Identificados</h3>
            </div>
            <ul className="space-y-3">
              {[
                s.site.pageSpeed.mobileScore !== null && s.site.pageSpeed.mobileScore < 80 && `PageSpeed Mobile de ${s.site.pageSpeed.mobileScore} — abaixo do ideal (80+)`,
                !s.site.pixelTag.pixelInstalled && 'Pixel do Facebook não instalado — impossível fazer remarketing',
                !s.site.checklist.ctaFirstPage && 'Sem CTA na primeira página do site',
                !s.site.pixelTag.tagInstalled && 'Google Tag Manager não instalado',
                s.gmn.reviewCount !== null && s.gmn.reviewCount < 50 && `Apenas ${s.gmn.reviewCount} avaliações no Google`,
                !s.paidTraffic.googleAds.isAdvertising && 'Sem campanhas ativas no Google Ads',
                !s.paidTraffic.facebookAds.isAdvertising && 'Sem campanhas ativas no Facebook/Meta Ads',
              ].filter(Boolean).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80" {...(isEditing ? {contentEditable: true, suppressContentEditableWarning: true} : {})}>
                  <span className="w-1.5 h-1.5 rounded-full bg-error mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="p-8 rounded-2xl bg-success/5 border border-success/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Oportunidades</h3>
            </div>
            <ul className="space-y-3">
              {[
                ...s.site.recommendations.slice(0, 2),
                ...s.instagram.recommendations.slice(0, 2),
                ...s.gmn.recommendations.slice(0, 1),
              ].filter(Boolean).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80" {...(isEditing ? {contentEditable: true, suppressContentEditableWarning: true} : {})}>
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── DETAILED SECTIONS ────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* SITE */}
          {activeSections.site && (
          <SectionBlock icon={Globe} title="Site" score={s.site.score} index={0}                contextNote={s.site.siteUrl ? `Analisamos ${s.site.siteUrl}${clientLocation ? `. Performance mobile é crítica para buscas locais em ${clientLocation}.` : '.'}` : undefined}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="PageSpeed Desktop" value={s.site.pageSpeed.desktopScore ?? '—'} />
              <Metric label="PageSpeed Mobile" value={s.site.pageSpeed.mobileScore ?? '—'} />
              <Metric label="Domain Authority" value={s.site.seo.domainAuthority ?? '—'} />
              <Metric label="Keywords Orgânicas" value={s.site.seo.organicKeywords ?? '—'} />
              <Metric label="Pixel Instalado" value={<BoolBadge value={s.site.pixelTag.pixelInstalled} />} />
              <Metric label="Tag Instalada" value={<BoolBadge value={s.site.pixelTag.tagInstalled} />} />
            </div>
            {s.site.observations && (
              <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border mt-3">
                <img src="/rodrigo.png" alt="Rodrigo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                <div><p className="text-xs font-semibold text-foreground mb-1">Observações do Rodrigo</p><p className="text-sm text-muted-foreground leading-relaxed">{s.site.observations}</p></div>
              </div>
            )}
            <Recommendations items={s.site.recommendations} clientName={clientName} editable={isEditing} />
          </SectionBlock>
          )}

          {activeSections.instagram && (
          <SectionBlock icon={Instagram} title="Instagram" score={s.instagram.score} index={1}            contextNote={
              branding?.instagramHandle
                ? `Perfil analisado: ${branding.instagramHandle}.`
                : s.instagram.instagramUrls?.[0]
                  ? `Perfil analisado: ${s.instagram.instagramUrls[0]}`
                  : undefined
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Perfil Próprio" value={<BoolBadge value={s.instagram.profile.hasOwnProfile} />} />
              <Metric label="Bio Completa" value={<BoolBadge value={s.instagram.bio.whatDoes === 'ok'} />} />
              <Metric label="CTA na Bio" value={<BoolBadge value={s.instagram.bio.cta === 'ok'} />} />
              <Metric label="Link na Bio" value={<BoolBadge value={s.instagram.bio.linkInBio === 'ok'} />} />
              <Metric label="Frequência Feed" value={s.instagram.content.feedFrequency || '—'} />
              <Metric label="Frequência Stories" value={s.instagram.content.storiesFrequency || '—'} />
            </div>
            {s.instagram.observations && (
              <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border mt-3">
                <img src="/rodrigo.png" alt="Rodrigo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                <div><p className="text-xs font-semibold text-foreground mb-1">Observações do Rodrigo</p><p className="text-sm text-muted-foreground leading-relaxed">{s.instagram.observations}</p></div>
              </div>
            )}
            <Recommendations items={s.instagram.recommendations} clientName={clientName} editable={isEditing} />
          </SectionBlock>
          )}

          {activeSections.gmn && (
          <SectionBlock icon={MapPin} title="Google Meu Negócio" score={s.gmn.score} index={2}            contextNote={
              branding?.address
                ? `Ficha do Google Maps: ${branding.address}${clientLocation ? `. Concorrentes na região de ${clientLocation} são referência para comparação.` : '.'}`
                : undefined
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Avaliações" value={s.gmn.reviewCount ?? '—'} />
              <Metric label="Nota Média" value={
                <span className="flex items-center gap-1">
                  {s.gmn.averageRating ?? '—'}
                  <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                </span>
              } />
              <Metric label="Health Score" value={s.gmn.healthScore ?? '—'} />
              <Metric label="NAP Consistente" value={<BoolBadge value={s.gmn.checklist.napConsistent} />} />
              <Metric label="Fotos Atualizadas" value={<BoolBadge value={s.gmn.checklist.photosVideosUpdated} />} />
              <Metric label="Posts Regulares" value={<BoolBadge value={s.gmn.checklist.regularPosts} />} />
            </div>
            {s.gmn.observations && (
              <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border mt-3">
                <img src="/rodrigo.png" alt="Rodrigo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                <div><p className="text-xs font-semibold text-foreground mb-1">Observações do Rodrigo</p><p className="text-sm text-muted-foreground leading-relaxed">{s.gmn.observations}</p></div>
              </div>
            )}
            <Recommendations items={s.gmn.recommendations} clientName={clientName} editable={isEditing} />
          </SectionBlock>
          )}

          {activeSections.paidTraffic && (
          <SectionBlock icon={Megaphone} title="Tráfego Pago" score={s.paidTraffic.score} index={3}            contextNote={clientLocation
              ? `Investimentos em Google Ads e Meta Ads são críticos para captacão de clientes em ${clientLocation}.`
              : undefined
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Google Ads Ativo" value={<BoolBadge value={s.paidTraffic.googleAds.isAdvertising} />} />
              <Metric label="Campanhas Google" value={s.paidTraffic.googleAds.campaignCount ?? '—'} />
              <Metric label="Vídeos Google" value={<BoolBadge value={s.paidTraffic.googleAds.hasVideoCreatives} />} />
              <Metric label="Facebook Ads Ativo" value={<BoolBadge value={s.paidTraffic.facebookAds.isAdvertising} />} />
              <Metric label="Campanhas Facebook" value={s.paidTraffic.facebookAds.campaignCount ?? '—'} />
              <Metric label="Vídeos Facebook" value={<BoolBadge value={s.paidTraffic.facebookAds.hasVideoCreatives} />} />
            </div>
            {s.paidTraffic.observations && (
              <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border mt-3">
                <img src="/rodrigo.png" alt="Rodrigo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                <div><p className="text-xs font-semibold text-foreground mb-1">Observações do Rodrigo</p><p className="text-sm text-muted-foreground leading-relaxed">{s.paidTraffic.observations}</p></div>
              </div>
            )}
            <Recommendations items={s.paidTraffic.recommendations} clientName={clientName} editable={isEditing} />
          </SectionBlock>
          )}

          {activeSections.commercial && (
          <SectionBlock icon={Briefcase} title="Comercial" score={s.commercial.score} index={4}            contextNote={branding?.phone
              ? `O telefone ${branding.phone} é o principal canal de contato. Tempo de resposta é fator decisivo para conversão.`
              : undefined
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Tempo de Resposta" value={s.commercial.leadResponseTime || '—'} />
              <Metric label="Follow-ups" value={s.commercial.followUps || '—'} />
              <Metric label="Observação" value={s.commercial.followUpObservation || '—'} />
            </div>
            {s.commercial.observations && (
              <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border mt-3">
                <img src="/rodrigo.png" alt="Rodrigo" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                <div><p className="text-xs font-semibold text-foreground mb-1">Observações do Rodrigo</p><p className="text-sm text-muted-foreground leading-relaxed">{s.commercial.observations}</p></div>
              </div>
            )}
            <Recommendations items={s.commercial.recommendations} clientName={clientName} editable={isEditing} />
          </SectionBlock>
          )}
        </div>
      </section>

      {/* ── ACTION PLAN ──────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Calendar className="w-4 h-4" />
              Plano de Ação
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Próximos Passos para {clientName}
            </h2>
          </motion.div>

          {(() => {
            const ai7 = executiveSummary?.recommendedPlan?.days7 ?? [];
            const ai30 = executiveSummary?.recommendedPlan?.days30 ?? [];
            const ai90 = executiveSummary?.recommendedPlan?.days90 ?? [];

            const derived7 = [...s.site.recommendations.slice(0, 2), ...s.commercial.recommendations.slice(0, 1)].filter(Boolean);
            const derived30 = [...s.instagram.recommendations.slice(0, 2), ...s.gmn.recommendations.slice(0, 2)].filter(Boolean);
            const derived90 = [...s.paidTraffic.recommendations.slice(0, 2), ...s.instagram.recommendations.slice(2, 4)].filter(Boolean);

            const days7 = ai7.length ? ai7 : derived7.length ? derived7 : ['Auditar e atualizar todas as informações de contato nos canais digitais', 'Garantir resposta a leads em até 5 minutos para maximizar conversão'];
            const days30 = ai30.length ? ai30 : derived30.length ? derived30 : ['Criar calendário de conteúdo para Instagram com mínimo de 3 posts semanais', 'Implementar processo estruturado de follow-up com leads não convertidos'];
            const days90 = ai90.length ? ai90 : derived90.length ? derived90 : ['Estruturar campanhas de Google Ads para captar pacientes com intenção de busca', 'Produzir vídeos de autoridade para consolidar a presença digital e atrair novos pacientes'];

            return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { period: '7 dias', subtitle: 'Correções urgentes', color: 'border-error/30 bg-error/5', icon: Zap, iconColor: 'text-error', tasks: days7.slice(0, 4) },
              { period: '30 dias', subtitle: 'Otimizações de base', color: 'border-warning/30 bg-warning/5', icon: TrendingUp, iconColor: 'text-warning', tasks: days30.slice(0, 4) },
              { period: '90 dias', subtitle: 'Crescimento acelerado', color: 'border-success/30 bg-success/5', icon: Shield, iconColor: 'text-success', tasks: days90.slice(0, 4) },
            ].map((phase, i) => (
              <motion.div
                key={phase.period} custom={i + 1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className={cn('p-6 rounded-2xl border', phase.color)}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-background/50', phase.iconColor)}>
                    <phase.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{phase.period}</h3>
                    <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-3 mt-4">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                      <ArrowRight className={cn('w-4 h-4 mt-0.5 shrink-0', phase.iconColor)} />
                      {task}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
            );
          })()}
        </div>
      </section>

      {/* ── CTA (personalized with professional photo) ───── */}
      <section className="py-20 px-6">
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          {branding?.professionalPhotoUrl && (
            <img
              src={branding.professionalPhotoUrl}
              alt={clientName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 mx-auto mb-6"
            />
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4" {...(isEditing ? {contentEditable: true, suppressContentEditableWarning: true} : {})}>
            {clientName}, vamos elevar sua presença digital?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto" {...(isEditing ? {contentEditable: true, suppressContentEditableWarning: true} : {})}>
            Entre em contato para implementar as recomendações
            {clientLocation ? ` em ${clientLocation}` : ''}.
          </p>
          {whatsappCTA ? (
            <a
              href={whatsappCTA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Falar com um especialista
              <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Saiba mais
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="py-8 border-t border-border text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Relatório personalizado para <strong className="text-foreground">{clientName}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Gerado por Áurea Performance • {reportDate.toLocaleDateString('pt-BR')}
        </p>
      </footer>
    </div>
  );
}
