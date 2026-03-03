import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import logoAureaEmblem from '@/assets/logo-aurea-emblem.png';
import { ScoreBadge } from '@/components/ui/score-badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { 
  ArrowLeft, 
  Download, 
  Pencil,
  Globe,
  Instagram,
  MapPin,
  Megaphone,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { exportReportToPDF, exportReportToHTML } from '@/lib/pdf-export';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { defaultSections, sampleSections } from '@/data/sampleSections';

// Áurea brand palette
const brand = {
  gold: '#C4A265',
  goldLight: '#D4C49E',
  bg: '#FAF9F5',
  graphite: '#2D2D2D',
  graphiteLight: '#595959',
  border: '#DDD8CE',
  espresso: '#2E2420',
  white: '#FFFFFF',
  green: '#0E2216',
};

const SectionPreview = ({ 
  icon: Icon, 
  title, 
  score,
  items,
  url,
}: { 
  icon: any; 
  title: string; 
  score: number;
  items: { label: string; value: any }[];
  url?: string;
}) => (
  <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: brand.white, border: `1px solid ${brand.border}` }}>
    <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${brand.border}`, backgroundColor: `${brand.gold}08` }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brand.gold}15` }}>
          <Icon className="w-5 h-5" style={{ color: brand.gold }} />
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <h3 className="font-semibold" style={{ color: brand.graphite }}>{title}</h3>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: brand.gold }} />
          </a>
        ) : (
          <h3 className="font-semibold" style={{ color: brand.graphite }}>{title}</h3>
        )}
      </div>
      <ScoreBadge score={score} size="sm" />
    </div>
    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs" style={{ color: brand.graphiteLight }}>{item.label}</p>
          <p className="text-sm font-medium" style={{ color: brand.graphite }}>
            {typeof item.value === 'boolean' ? (
              <StatusIndicator value={item.value} size="sm" />
            ) : (
              item.value ?? '—'
            )}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default function ReportPreviewPage() {
  const { id } = useParams();
  const { reports, clients, currentReportSections, currentReportId, setCurrentReport, brandKit, reportBranding, setReportBranding, getReportSections, getReportBranding } = useAppStore();

  const report = reports.find(r => r.id === id);
  const client = report ? clients.find(c => c.id === report.clientId) : null;
  const [isExporting, setIsExporting] = useState(false);

  // Load persisted sections for this report
  useEffect(() => {
    if (!id) return;
    if (currentReportId !== id) {
      const saved = getReportSections(id);
      if (saved) {
        setCurrentReport(id, saved);
      } else {
        const initialData = id === '2' ? sampleSections : defaultSections;
        setCurrentReport(id, initialData);
      }
      
      const savedBranding = getReportBranding(id);
      if (savedBranding) {
        setReportBranding(savedBranding);
      } else {
        setReportBranding(null);
      }
    }
  }, [id, currentReportId]);

  const activeBranding = {
    logoUrl: reportBranding?.logoUrl || brandKit.logoUrl,
    font: brandKit.font,
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filename = `${client?.name || 'Relatorio'}-${new Date(report.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      await exportReportToPDF('report-content', filename);
      toast({ title: 'PDF exportado com sucesso!' });
    } catch (err) {
      toast({ title: 'Erro ao exportar PDF', description: String(err), variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = () => {
    setIsExporting(true);
    try {
      const filename = `${client?.name || 'Relatorio'}-${new Date(report.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      exportReportToHTML('report-content', filename);
      toast({ title: 'HTML exportado com sucesso!' });
    } catch (err) {
      toast({ title: 'Erro ao exportar HTML', description: String(err), variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  if (!report) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: brand.graphite }}>Relatório não encontrado</h2>
            <Link to="/reports">
              <Button variant="secondary">Voltar para Relatórios</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const sections = currentReportSections;

  // Extract URLs for clickable sections
  const siteUrl = sections?.site?.siteUrl || '';
  const instagramUrls = sections?.instagram?.instagramUrls || [];
  const instagramUrl = instagramUrls[0] || (reportBranding?.instagramHandle ? `https://www.instagram.com/${reportBranding.instagramHandle.replace('@', '')}/` : '');
  const gmnUrl = sections?.gmn?.gmnUrl || '';

  return (
    <MainLayout>
      <Header 
        title="Preview do Relatório"
        subtitle={report.title}
      />
      
      <div className="p-6" style={{ backgroundColor: brand.bg }}>
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link to={`/reports/${id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Editor
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to={`/reports/${id}`}>
              <Button variant="secondary" className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={handleExportHTML} disabled={isExporting}>
              <FileText className="w-4 h-4" />
              {isExporting ? 'Gerando...' : 'Exportar HTML'}
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleExportPDF} 
              disabled={isExporting}
              style={{ backgroundColor: brand.gold, color: brand.white }}
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        {/* PDF Preview Container */}
        <div id="report-content" className="max-w-4xl mx-auto">
          {/* Cover Page */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden mb-6 aspect-[8.5/11]"
            style={{ backgroundColor: brand.white, border: `1px solid ${brand.border}` }}
          >
            <div 
              className="h-full flex flex-col items-center justify-center p-12 text-center"
              style={{ fontFamily: activeBranding.font }}
            >
              {/* Client logo or Áurea emblem */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {activeBranding.logoUrl ? (
                  <img 
                    src={activeBranding.logoUrl} 
                    alt="Logo" 
                    className="h-24 object-contain mb-10 mx-auto"
                  />
                ) : (
                  <img 
                    src={logoAureaEmblem} 
                    alt="Áurea Performance" 
                    className="h-20 object-contain mb-10 mx-auto"
                  />
                )}
              </motion.div>

              <motion.h1 
                className="text-4xl font-bold mb-3"
                style={{ color: brand.gold, fontFamily: "'Cinzel', serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                Relatório de Auditoria
              </motion.h1>

              <motion.p 
                className="text-xl mb-2"
                style={{ color: brand.graphiteLight }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.7 }}
              >
                Presença Digital
              </motion.p>

              <motion.div 
                className="w-20 h-0.5 rounded-full my-8" 
                style={{ backgroundColor: brand.gold }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />

              <motion.p 
                className="text-lg font-medium"
                style={{ color: brand.gold }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95, duration: 0.7 }}
              >
                {client?.name}
              </motion.p>

              <motion.p 
                className="mt-3 text-sm"
                style={{ color: brand.graphiteLight }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.7 }}
              >
                {new Date(report.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </motion.p>
            </div>
          </motion.div>

          {/* Executive Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-8 mb-6"
            style={{ backgroundColor: brand.white, border: `1px solid ${brand.border}` }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: brand.graphite }}>Resumo Executivo</h2>
            
            {/* Score Overview */}
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <ScoreBadge score={report.overallScore} size="lg" showLabel />
                <p className="mt-2" style={{ color: brand.graphiteLight }}>Score Geral</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { icon: Globe, label: 'Site', score: sections?.site.score ?? 0 },
                { icon: Instagram, label: 'Instagram', score: sections?.instagram.score ?? 0 },
                { icon: MapPin, label: 'GMN', score: sections?.gmn.score ?? 0 },
                { icon: Megaphone, label: 'Tráfego', score: sections?.paidTraffic.score ?? 0 },
                { icon: Briefcase, label: 'Comercial', score: sections?.commercial.score ?? 0 },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${brand.gold}08`, border: `1px solid ${brand.border}` }}>
                  <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: brand.gold }} />
                  <p className="text-xs" style={{ color: brand.graphiteLight }}>{item.label}</p>
                  <p className={cn(
                    "text-2xl font-bold mt-1",
                  )} style={{ color: item.score >= 80 ? brand.green : item.score >= 60 ? brand.gold : '#C0392B' }}>
                    {item.score}
                  </p>
                </div>
              ))}
            </div>

            {/* Key Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ backgroundColor: '#C0392B0D', border: '1px solid #C0392B20' }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" style={{ color: '#C0392B' }} />
                  <h3 className="font-semibold" style={{ color: brand.graphite }}>Problemas Críticos</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: '#C0392B' }}>•</span>
                    PageSpeed mobile abaixo de 80
                  </li>
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: '#C0392B' }}>•</span>
                    Pixel não instalado
                  </li>
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: '#C0392B' }}>•</span>
                    Falta CTA na primeira página
                  </li>
                </ul>
              </div>
              
              <div className="p-6 rounded-xl" style={{ backgroundColor: `${brand.green}0D`, border: `1px solid ${brand.green}20` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5" style={{ color: brand.green }} />
                  <h3 className="font-semibold" style={{ color: brand.graphite }}>Oportunidades</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: brand.green }}>•</span>
                    Iniciar campanhas no Google Ads
                  </li>
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: brand.green }}>•</span>
                    Melhorar frequência de posts no Instagram
                  </li>
                  <li className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                    <span style={{ color: brand.green }}>•</span>
                    Implementar follow-up automatizado
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: `${brand.gold}0D`, border: `1px solid ${brand.gold}20` }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" style={{ color: brand.gold }} />
                <h3 className="font-semibold" style={{ color: brand.graphite }}>Plano de Ação Recomendado</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>7 dias</p>
                  <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                    <li>• Instalar Pixel e Tags</li>
                    <li>• Adicionar CTA no site</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>30 dias</p>
                  <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                    <li>• Otimizar PageSpeed</li>
                    <li>• Organizar destaques do Instagram</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>90 dias</p>
                  <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                    <li>• Lançar campanhas de tráfego</li>
                    <li>• Implementar cadência comercial</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Details */}
          {sections && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <SectionPreview 
                icon={Globe}
                title="Site"
                score={sections.site.score}
                url={siteUrl || undefined}
                items={[
                  { label: 'PageSpeed Desktop', value: sections.site.pageSpeed.desktopScore },
                  { label: 'PageSpeed Mobile', value: sections.site.pageSpeed.mobileScore },
                  { label: 'Pixel Instalado', value: sections.site.pixelTag.pixelInstalled },
                  { label: 'Tag Instalada', value: sections.site.pixelTag.tagInstalled },
                  { label: 'Keywords Orgânicas', value: sections.site.seo.organicKeywords },
                  { label: 'Domain Authority', value: sections.site.seo.domainAuthority },
                ]}
              />
              
              <SectionPreview 
                icon={Instagram}
                title="Instagram"
                score={sections.instagram.score}
                url={instagramUrl || undefined}
                items={[
                  { label: 'Perfil Próprio', value: sections.instagram.profile.hasOwnProfile },
                  { label: 'Bio Completa', value: sections.instagram.bio.whatDoes === 'ok' },
                  { label: 'CTA na Bio', value: sections.instagram.bio.cta === 'ok' },
                  { label: 'Link na Bio', value: sections.instagram.bio.linkInBio === 'ok' },
                  { label: 'Frequência Feed', value: sections.instagram.content.feedFrequency || '—' },
                  { label: 'Frequência Stories', value: sections.instagram.content.storiesFrequency || '—' },
                ]}
              />
              
              <SectionPreview 
                icon={MapPin}
                title="Google Meu Negócio"
                score={sections.gmn.score}
                url={gmnUrl || undefined}
                items={[
                  { label: 'Avaliações', value: sections.gmn.reviewCount },
                  { label: 'Nota Média', value: sections.gmn.averageRating },
                  { label: 'NAP Consistente', value: sections.gmn.checklist.napConsistent },
                  { label: 'Horário Atualizado', value: sections.gmn.checklist.hoursUpdated },
                  { label: 'Fotos Atualizadas', value: sections.gmn.checklist.photosVideosUpdated },
                  { label: 'Posts Regulares', value: sections.gmn.checklist.regularPosts },
                ]}
              />
              
              <SectionPreview 
                icon={Megaphone}
                title="Tráfego Pago"
                score={sections.paidTraffic.score}
                items={[
                  { label: 'Google Ads Ativo', value: sections.paidTraffic.googleAds.isAdvertising },
                  { label: 'Campanhas Google', value: sections.paidTraffic.googleAds.campaignCount },
                  { label: 'Vídeos Google', value: sections.paidTraffic.googleAds.hasVideoCreatives },
                  { label: 'Facebook Ads Ativo', value: sections.paidTraffic.facebookAds.isAdvertising },
                  { label: 'Campanhas Facebook', value: sections.paidTraffic.facebookAds.campaignCount },
                  { label: 'Vídeos Facebook', value: sections.paidTraffic.facebookAds.hasVideoCreatives },
                ]}
              />
              
              <SectionPreview 
                icon={Briefcase}
                title="Comercial"
                score={sections.commercial.score}
                items={[
                  { label: 'Tempo de Resposta', value: sections.commercial.leadResponseTime || '—' },
                  { label: 'Follow-ups', value: sections.commercial.followUps || '—' },
                ]}
              />
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 py-6 text-center"
            style={{ borderTop: `1px solid ${brand.border}` }}
          >
            <p className="text-sm" style={{ color: brand.graphiteLight }}>
              Relatório gerado por <span style={{ color: brand.gold, fontWeight: 600 }}>Áurea Performance</span> • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
