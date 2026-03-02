import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { sampleSections } from '@/data/sampleSections';
import {
  Globe,
  Instagram,
  MapPin,
  Megaphone,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Calendar,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────
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
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Score Ring ────────────────────────────────────────────
function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(142 76% 36%)' : score >= 60 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(217 33% 17%)" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', scoreColor(score), size >= 100 ? 'text-4xl' : 'text-2xl')}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      {label && <p className="text-sm text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}

// ── Bool Badge ───────────────────────────────────────────
function BoolBadge({ value, labelTrue, labelFalse }: { value: boolean | null; labelTrue?: string; labelFalse?: string }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-success text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" /> {labelTrue || 'Sim'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-error text-sm font-medium">
      <XCircle className="w-4 h-4" /> {labelFalse || 'Não'}
    </span>
  );
}

// ── Section Card ─────────────────────────────────────────
function SectionBlock({
  icon: Icon, title, score, children, index,
}: {
  icon: any; title: string; score: number; children: React.ReactNode; index: number;
}) {
  return (
    <motion.section
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="relative"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className={cn('text-sm font-semibold', scoreColor(score))}>{scoreLabel(score)}</p>
            </div>
          </div>
          <ScoreRing score={score} size={72} />
        </div>
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </motion.section>
  );
}

// ── Recommendation List ──────────────────────────────────
function Recommendations({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/15">
      <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> Recomendações
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Metric Grid Item ─────────────────────────────────────
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-secondary/30 rounded-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── Main Page ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function ClientLandingPage() {
  const { brandKit, currentReportSections, setCurrentReportSections } = useAppStore();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Initialise sample data
  useEffect(() => {
    if (!currentReportSections) {
      setCurrentReportSections(sampleSections);
      setTimeout(() => {
        const store = useAppStore.getState();
        if (store.currentReportSections) {
          store.updateSection('site', {});
          store.updateSection('instagram', {});
          store.updateSection('gmn', {});
          store.updateSection('paidTraffic', {});
          store.updateSection('commercial', {});
        }
      }, 0);
    }
  }, [currentReportSections, setCurrentReportSections]);

  const s = currentReportSections || sampleSections;
  const client = { name: 'Clínica Bem Estar', niche: 'Saúde' };
  const reportDate = new Date('2024-03-15');

  const overallScore = Math.round(
    (s.site.score * 0.4) + (s.instagram.score * 0.25) + (s.gmn.score * 0.2) +
    (s.paidTraffic.score * 0.1) + (s.commercial.score * 0.05)
  );

  const pillars = [
    { icon: Globe, label: 'Site', score: s.site.score },
    { icon: Instagram, label: 'Instagram', score: s.instagram.score },
    { icon: MapPin, label: 'Google Meu Negócio', score: s.gmn.score },
    { icon: Megaphone, label: 'Tráfego Pago', score: s.paidTraffic.score },
    { icon: Briefcase, label: 'Comercial', score: s.commercial.score },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(160_84%_39%/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(217_33%_22%/0.4),transparent_60%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Auditoria de Presença Digital
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
            {client.name}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
            Relatório completo de auditoria digital — {reportDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <ScoreRing score={overallScore} size={160} />
            <p className="text-muted-foreground mt-3 text-sm font-medium">Score Geral</p>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
        >
          <span className="text-xs">Veja o relatório completo</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* ── PILLARS OVERVIEW ─────────────────────────────── */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4"
          >
            Visão Geral
          </motion.h2>
          <motion.p
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-muted-foreground text-center mb-12 max-w-lg mx-auto"
          >
            Análise detalhada dos 5 pilares da presença digital
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                custom={i + 2}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all hover:scale-[1.03]',
                  scoreBg(p.score)
                )}
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
              <h3 className="text-xl font-bold text-foreground">Problemas Críticos</h3>
            </div>
            <ul className="space-y-3">
              {[
                'PageSpeed Mobile em 45 — muito abaixo do aceitável (80+)',
                'Pixel do Facebook não instalado — impossível fazer remarketing',
                'Sem CTA acima da dobra na home page',
                'Apenas 47 avaliações no Google (média regional ~120)',
                'Tempo de resposta a leads de 2 horas (ideal <5 min)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
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
                'Ativar campanhas de Facebook/Meta Ads para brand awareness',
                'Produzir vídeos curtos (15-30s) com depoimentos de pacientes',
                'Implementar cadência de 5+ follow-ups com scripts padronizados',
                'Campanha ativa de solicitação de avaliações pós-consulta',
                'Configurar UTM no link da bio do Instagram',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
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
          <SectionBlock icon={Globe} title="Site" score={s.site.score} index={0}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="PageSpeed Desktop" value={s.site.pageSpeed.desktopScore ?? '—'} />
              <Metric label="PageSpeed Mobile" value={s.site.pageSpeed.mobileScore ?? '—'} />
              <Metric label="Domain Authority" value={s.site.seo.domainAuthority ?? '—'} />
              <Metric label="Keywords Orgânicas" value={s.site.seo.organicKeywords ?? '—'} />
              <Metric label="Pixel Instalado" value={<BoolBadge value={s.site.pixelTag.pixelInstalled} />} />
              <Metric label="Tag Instalada" value={<BoolBadge value={s.site.pixelTag.tagInstalled} />} />
            </div>
            {s.site.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.site.observations}</p>
            )}
            <Recommendations items={s.site.recommendations} />
          </SectionBlock>

          {/* INSTAGRAM */}
          <SectionBlock icon={Instagram} title="Instagram" score={s.instagram.score} index={1}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Perfil Próprio" value={<BoolBadge value={s.instagram.profile.hasOwnProfile} />} />
              <Metric label="Bio Completa" value={<BoolBadge value={s.instagram.bio.whatDoes === 'ok'} />} />
              <Metric label="CTA na Bio" value={<BoolBadge value={s.instagram.bio.cta === 'ok'} />} />
              <Metric label="Link na Bio" value={<BoolBadge value={s.instagram.bio.linkInBio === 'ok'} />} />
              <Metric label="Frequência Feed" value={s.instagram.content.feedFrequency || '—'} />
              <Metric label="Frequência Stories" value={s.instagram.content.storiesFrequency || '—'} />
            </div>
            {s.instagram.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.instagram.observations}</p>
            )}
            <Recommendations items={s.instagram.recommendations} />
          </SectionBlock>

          {/* GMN */}
          <SectionBlock icon={MapPin} title="Google Meu Negócio" score={s.gmn.score} index={2}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Avaliações" value={s.gmn.reviewCount ?? '—'} />
              <Metric label="Nota Média" value={s.gmn.averageRating ?? '—'} />
              <Metric label="Health Score" value={s.gmn.healthScore ?? '—'} />
              <Metric label="NAP Consistente" value={<BoolBadge value={s.gmn.checklist.napConsistent} />} />
              <Metric label="Fotos Atualizadas" value={<BoolBadge value={s.gmn.checklist.photosVideosUpdated} />} />
              <Metric label="Posts Regulares" value={<BoolBadge value={s.gmn.checklist.regularPosts} />} />
            </div>
            {s.gmn.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.gmn.observations}</p>
            )}
            <Recommendations items={s.gmn.recommendations} />
          </SectionBlock>

          {/* TRÁFEGO PAGO */}
          <SectionBlock icon={Megaphone} title="Tráfego Pago" score={s.paidTraffic.score} index={3}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Google Ads Ativo" value={<BoolBadge value={s.paidTraffic.googleAds.isAdvertising} />} />
              <Metric label="Campanhas Google" value={s.paidTraffic.googleAds.campaignCount ?? '—'} />
              <Metric label="Vídeos Google" value={<BoolBadge value={s.paidTraffic.googleAds.hasVideoCreatives} />} />
              <Metric label="Facebook Ads Ativo" value={<BoolBadge value={s.paidTraffic.facebookAds.isAdvertising} />} />
              <Metric label="Campanhas Facebook" value={s.paidTraffic.facebookAds.campaignCount ?? '—'} />
              <Metric label="Vídeos Facebook" value={<BoolBadge value={s.paidTraffic.facebookAds.hasVideoCreatives} />} />
            </div>
            {s.paidTraffic.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.paidTraffic.observations}</p>
            )}
            <Recommendations items={s.paidTraffic.recommendations} />
          </SectionBlock>

          {/* COMERCIAL */}
          <SectionBlock icon={Briefcase} title="Comercial" score={s.commercial.score} index={4}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Tempo de Resposta" value={s.commercial.leadResponseTime || '—'} />
              <Metric label="Follow-ups" value={s.commercial.followUps || '—'} />
              <Metric label="Observação Follow-up" value={s.commercial.followUpObservation || '—'} />
            </div>
            {s.commercial.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.commercial.observations}</p>
            )}
            <Recommendations items={s.commercial.recommendations} />
          </SectionBlock>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Próximos Passos</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                period: '7 dias',
                color: 'border-error/30 bg-error/5',
                icon: Zap,
                iconColor: 'text-error',
                tasks: [
                  'Instalar Pixel do Facebook e Google Tag',
                  'Adicionar CTA acima da dobra no site',
                  'Configurar alertas de leads para resposta <5 min',
                ],
              },
              {
                period: '30 dias',
                color: 'border-warning/30 bg-warning/5',
                icon: TrendingUp,
                iconColor: 'text-warning',
                tasks: [
                  'Otimizar PageSpeed Mobile (meta: 80+)',
                  'Criar destaques de prova social no Instagram',
                  'Implementar campanha de avaliações no Google',
                  'Adotar CRM para gestão de leads',
                ],
              },
              {
                period: '90 dias',
                color: 'border-success/30 bg-success/5',
                icon: Shield,
                iconColor: 'text-success',
                tasks: [
                  'Lançar campanhas de Facebook/Meta Ads',
                  'Produzir vídeo-depoimentos de pacientes',
                  'Cadência de 5+ follow-ups com scripts',
                  'Frequência 3x/semana no feed Instagram',
                ],
              },
            ].map((phase, i) => (
              <motion.div
                key={phase.period}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={cn('p-6 rounded-2xl border', phase.color)}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-background/50', phase.iconColor)}>
                    <phase.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{phase.period}</h3>
                </div>
                <ul className="space-y-3">
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
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pronto para transformar sua presença digital?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Entre em contato para implementar as recomendações e elevar o score da {client.name}.
          </p>
          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1%2C+vi+o+relat%C3%B3rio+de+auditoria+da+Cl%C3%ADnica+Bem+Estar+e+gostaria+de+saber+mais!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Falar com um especialista
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="py-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Relatório gerado por Audit Report Builder • {reportDate.toLocaleDateString('pt-BR')}
        </p>
      </footer>
    </div>
  );
}
