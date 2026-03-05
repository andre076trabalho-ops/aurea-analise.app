import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import logoAurea from '@/assets/logo-aurea.png';
import { useAppStore } from '@/stores/useAppStore';
import { sampleSections } from '@/data/sampleSections';
import { calculateOverallScore } from '@/lib/scoring';
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
  Phone,
  Mail,
  MapPinned,
  Star,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Client Info ──────────────────────────────────────────
const CLIENT = {
  name: 'Dra. Renata Vilela',
  clinic: 'Stetic & SPA',
  location: 'Ipanema, Rio de Janeiro',
  address: 'Rua Visconde de Pirajá, 595 - Loja 211 - Ipanema, Rio de Janeiro',
  phone: '(21) 96484-1221',
  whatsapp: '5521964841221',
  email: 'drarenatavilela@gmail.com',
  instagram: '@drarenatavilela',
  instagramUrl: 'https://www.instagram.com/drarenatavilela/',
  website: 'clinicarenatavilela.com.br',
  logoUrl: 'https://static.wixstatic.com/media/ce7c82_05b51eade51e4cd8ab978e86898e3b30~mv2.png/v1/fill/w_334,h_93,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ce7c82_05b51eade51e4cd8ab978e86898e3b30~mv2.png',
  photoUrl: 'https://static.wixstatic.com/media/ce7c82_cfb916eb62e44b6b89af1e56a0634b8d~mv2.jpg/v1/crop/x_0,y_0,w_853,h_852/fill/w_201,h_201,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_3898_Easy-Resize_com.jpg',
  clinicPhotoUrl: 'https://static.wixstatic.com/media/ce7c82_d099f0fb5e5b4d90bc3fee3941626ade~mv2.jpeg/v1/fill/w_960,h_660,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ce7c82_d099f0fb5e5b4d90bc3fee3941626ade~mv2.jpeg',
  procedures: [
    'Toxina Botulínica (Botox)',
    'Preenchimento com Ácido Hialurônico',
    'Bioestimulador de Colágeno',
    'Fios de PDO',
    'Peeling Químico',
    'Skinbooster',
    'Hidragloss',
  ],
  spaServices: [
    'Massagem Relaxante',
    'Drenagem Linfática',
    'Limpeza de Pele',
    'Hidratação Facial',
    'Revitalização Facial',
  ],
  bio: 'Mineira morando no Rio, formada há 10 anos, atuando exclusivamente com Harmonização Orofacial. 90% das pacientes são por indicação.',
};

const REPORT_DATE = new Date('2024-03-15');

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
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
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
          transition={{ duration: 1.4, ease: 'easeOut' }}
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

// ── Section Card ─────────────────────────────────────────
function SectionBlock({
  icon: Icon, title, score, children, index, contextNote,
}: {
  icon: any; title: string; score: number; children: React.ReactNode; index: number; contextNote?: string;
}) {
  return (
    <motion.section
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
        {contextNote && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-accent/50 border border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
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

function Recommendations({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/15">
      <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> Recomendações para a {CLIENT.clinic}
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

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-secondary/30 rounded-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function ClientLandingPage2() {
  const { currentReportSections, setCurrentReportSections } = useAppStore();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

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

  const overallScore = calculateOverallScore(
    s.site.score,
    s.instagram.score,
    s.gmn.score,
    s.paidTraffic.score,
    s.commercial.score,
    s.disabledSections
  );

  const pillars = [
    { icon: Globe, label: 'Site', score: s.site.score },
    { icon: Instagram, label: 'Instagram', score: s.instagram.score },
    { icon: MapPin, label: 'Google Meu Negócio', score: s.gmn.score },
    { icon: Megaphone, label: 'Tráfego Pago', score: s.paidTraffic.score },
    { icon: Briefcase, label: 'Comercial', score: s.commercial.score },
  ];

  const whatsappCTA = `https://wa.me/${CLIENT.whatsapp}?text=${encodeURIComponent('Olá Dra. Renata, vi o relatório de auditoria digital da clínica e gostaria de conversar sobre as melhorias recomendadas.')}`;

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(160_84%_39%/0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(30_60%_50%/0.06),transparent_60%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        >
          {/* Áurea Logo */}
          <motion.img
            src={logoAurea}
            alt="Áurea Performance"
            className="h-14 md:h-16 mx-auto mb-4 object-contain"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
          {/* Clinic Logo */}
          <motion.img
            src={CLIENT.logoUrl}
            alt={`Logo ${CLIENT.name} ${CLIENT.clinic}`}
            className="h-12 md:h-14 mx-auto mb-6 object-contain"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Auditoria de Presença Digital
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-3">
            {CLIENT.name}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-2">
            {CLIENT.clinic}
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-10">
            <MapPinned className="w-4 h-4" />
            {CLIENT.location}
          </p>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <ScoreRing score={overallScore} size={160} />
            <p className="text-muted-foreground mt-3 text-sm font-medium">Score Geral da Presença Digital</p>
          </motion.div>

          {/* Report date */}
          <p className="text-xs text-muted-foreground mt-6">
            Relatório gerado em {REPORT_DATE.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground"
        >
          <span className="text-xs">Veja o relatório completo</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* ── ABOUT THE CLINIC ─────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
              <div className="relative h-56 md:h-auto">
                <img
                  src={CLIENT.clinicPhotoUrl}
                  alt={`Clínica ${CLIENT.name}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <img src={CLIENT.photoUrl} alt={CLIENT.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
                  <div>
                    <h3 className="font-bold text-foreground">{CLIENT.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                  {CLIENT.bio}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CLIENT.procedures.slice(0, 5).map((p) => (
                    <span key={p} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {p}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPinned className="w-4 h-4" /> {CLIENT.location}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {CLIENT.phone}</span>
                  <span className="flex items-center gap-1.5"><Instagram className="w-4 h-4" /> {CLIENT.instagram}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PILLARS OVERVIEW ─────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4"
          >
            Diagnóstico Digital da {CLIENT.clinic}
          </motion.h2>
          <motion.p
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-muted-foreground text-center mb-12 max-w-lg mx-auto"
          >
            Análise dos 5 pilares que impactam a captação de pacientes para procedimentos estéticos em {CLIENT.location}
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
                `Site em Wix com PageSpeed Mobile de 45 — pacientes buscando "${CLIENT.procedures[0]}" em Ipanema vão desistir antes de carregar`,
                'Pixel do Facebook não instalado — impossível fazer remarketing para quem visitou a página de procedimentos',
                'Sem CTA acima da dobra — paciente precisa rolar para encontrar o "Agendar agora"',
                `Apenas 47 avaliações no Google — clínicas de estética em Ipanema têm média de ~120`,
                'Tempo de resposta a leads de 2 horas — paciente já agendou com a concorrência',
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
                'Ativar Facebook/Meta Ads segmentado para mulheres 25-55 em Ipanema, Leblon e Copacabana',
                'Produzir Reels de antes/depois de harmonizações com autorização das pacientes',
                `90% das pacientes vêm por indicação — implementar programa de referral com benefício`,
                'Criar campanha pós-procedimento solicitando avaliação no Google com QR Code na recepção',
                'Instagram @drarenatavilela tem potencial de autoridade — faltam destaques de prova social',
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
          <SectionBlock
            icon={Globe} title="Site" score={s.site.score} index={0}
            contextNote={`Analisamos ${CLIENT.website} — site em Wix com foco em procedimentos estéticos. A performance mobile é crítica: pacientes buscam "botox ipanema" no celular.`}
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
              <p className="text-sm text-muted-foreground leading-relaxed">{s.site.observations}</p>
            )}
            <Recommendations items={[
              'Otimizar imagens dos procedimentos (Toxina, Preenchimento) com lazy loading para PageSpeed 80+',
              'Instalar Pixel do Facebook para remarketing de visitantes das páginas de procedimentos',
              'Adicionar CTA "Agende sua avaliação" com link do WhatsApp acima da dobra na home',
              'Corrigir botão de WhatsApp na página de contato que está quebrado',
            ]} />
          </SectionBlock>

          {/* INSTAGRAM */}
          <SectionBlock
            icon={Instagram} title="Instagram" score={s.instagram.score} index={1}
            contextNote={`Perfil analisado: ${CLIENT.instagram} — presença com potencial de autoridade em harmonização orofacial, mas comunicação pode ser otimizada.`}
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
              <p className="text-sm text-muted-foreground leading-relaxed">{s.instagram.observations}</p>
            )}
            <Recommendations items={[
              'Adicionar "Harmonização Orofacial em Ipanema 📍" e CTA "Agende ↓" na bio',
              'Criar destaques: "Resultados", "Depoimentos", "Procedimentos", "Clínica", "SPA"',
              'Aumentar frequência para 3-4x/semana com Reels de procedimentos e dicas de skincare',
              'Configurar UTM no link da bio para rastrear quantas pacientes vieram do Instagram',
            ]} />
          </SectionBlock>

          {/* GMN */}
          <SectionBlock
            icon={MapPin} title="Google Meu Negócio" score={s.gmn.score} index={2}
            contextNote={`Ficha do Google Maps da clínica em Rua Visconde de Pirajá, 595 — Ipanema. Concorrentes diretos na região têm em média 120+ avaliações.`}
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
              <p className="text-sm text-muted-foreground leading-relaxed">{s.gmn.observations}</p>
            )}
            <Recommendations items={[
              'Colocar QR Code com link de avaliação na recepção e enviar por WhatsApp pós-procedimento',
              'Responder todas avaliações (positivas e negativas) em até 48h — humaniza a marca',
              'Atualizar fotos do Google com imagens profissionais da clínica, SPA e recepção',
              'Publicar posts semanais com dicas de estética e novidades da Stetic & SPA',
            ]} />
          </SectionBlock>

          {/* TRÁFEGO PAGO */}
          <SectionBlock
            icon={Megaphone} title="Tráfego Pago" score={s.paidTraffic.score} index={3}
            contextNote={`Clínicas de estética em Ipanema investem forte em Google Ads para termos como "harmonização facial ipanema" e "botox zona sul rio". Meta Ads é essencial para brand awareness.`}
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
              <p className="text-sm text-muted-foreground leading-relaxed">{s.paidTraffic.observations}</p>
            )}
            <Recommendations items={[
              'Criar campanhas de Meta Ads segmentadas para mulheres 25-55 em Ipanema, Leblon e Copacabana',
              'Produzir vídeos curtos (15-30s) mostrando o ambiente do SPA e resultados de harmonizações',
              'Adicionar campanhas de YouTube Ads com vídeos de depoimentos de pacientes satisfeitas',
              'Implementar funil: awareness (Meta) → consideração (YouTube) → conversão (Google Search)',
            ]} />
          </SectionBlock>

          {/* COMERCIAL */}
          <SectionBlock
            icon={Briefcase} title="Comercial" score={s.commercial.score} index={4}
            contextNote={`O WhatsApp (21) 96484-1221 é o principal canal de agendamento da clínica. Tempo de resposta é fator decisivo para pacientes de estética.`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Metric label="Tempo de Resposta" value={s.commercial.leadResponseTime || '—'} />
              <Metric label="Follow-ups" value={s.commercial.followUps || '—'} />
              <Metric label="Observação" value={s.commercial.followUpObservation || '—'} />
            </div>
            {s.commercial.observations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{s.commercial.observations}</p>
            )}
            <Recommendations items={[
              'Configurar resposta automática no WhatsApp Business com menu de procedimentos',
              'Implementar cadência de 5+ follow-ups: confirmação → lembrete → pós-procedimento → retorno',
              'Criar templates de mensagens personalizadas por procedimento (Botox, Preenchimento, SPA)',
              'Considerar CRM simples (Pipedrive ou HubSpot Free) para gerenciar pipeline de pacientes',
            ]} />
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Próximos Passos para a {CLIENT.clinic}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                period: '7 dias',
                subtitle: 'Correções urgentes',
                color: 'border-error/30 bg-error/5',
                icon: Zap,
                iconColor: 'text-error',
                tasks: [
                  'Instalar Pixel do Facebook no site Wix',
                  'Adicionar CTA "Agende sua avaliação" acima da dobra',
                  'Configurar resposta automática no WhatsApp Business',
                  'Imprimir QR Code de avaliação para a recepção',
                ],
              },
              {
                period: '30 dias',
                subtitle: 'Otimizações de base',
                color: 'border-warning/30 bg-warning/5',
                icon: TrendingUp,
                iconColor: 'text-warning',
                tasks: [
                  'Otimizar PageSpeed Mobile do site (meta: 80+)',
                  'Criar destaques do Instagram com prova social',
                  'Atualizar fotos do Google Maps com imagens profissionais',
                  'Lançar campanha de solicitação de avaliações pós-procedimento',
                ],
              },
              {
                period: '90 dias',
                subtitle: 'Crescimento acelerado',
                color: 'border-success/30 bg-success/5',
                icon: Shield,
                iconColor: 'text-success',
                tasks: [
                  'Lançar campanhas de Meta Ads para zona sul do Rio',
                  'Produzir vídeos de depoimentos de pacientes para Reels e YouTube',
                  'Implementar cadência de 5+ follow-ups com scripts por procedimento',
                  'Frequência 3-4x/semana no Instagram com Reels de procedimentos',
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
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <img src={CLIENT.photoUrl} alt={CLIENT.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {CLIENT.name}, vamos elevar a presença digital da {CLIENT.clinic}?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Entre em contato para implementar as recomendações e atrair mais pacientes para procedimentos estéticos em Ipanema.
          </p>
          <a
            href={whatsappCTA}
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
      <footer className="py-8 border-t border-border text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Relatório personalizado para <strong className="text-foreground">{CLIENT.name} — {CLIENT.clinic}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Gerado por Audit Report Builder • {REPORT_DATE.toLocaleDateString('pt-BR')}
        </p>
      </footer>
    </div>
  );
}
