import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
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
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { exportReportToPDF } from '@/lib/pdf-export';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const SectionPreview = ({ 
  icon: Icon, 
  title, 
  score,
  items 
}: { 
  icon: any; 
  title: string; 
  score: number;
  items: { label: string; value: any }[];
}) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <ScoreBadge score={score} size="sm" />
    </div>
    <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium text-foreground">
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
  const { reports, clients, currentReportSections, brandKit } = useAppStore();

  const report = reports.find(r => r.id === id);
  const client = report ? clients.find(c => c.id === report.clientId) : null;

  if (!report) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Relatório não encontrado</h2>
            <Link to="/reports">
              <Button variant="secondary">Voltar para Relatórios</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Mock data for preview if no sections
  const sections = currentReportSections;

  return (
    <MainLayout>
      <Header 
        title="Preview do Relatório"
        subtitle={report.title}
      />
      
      <div className="p-6">
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
            <Button className="gap-2" onClick={handleExportPDF} disabled={isExporting}>
              <Download className="w-4 h-4" />
              {isExporting ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        {/* PDF Preview Container */}
        <div className="max-w-4xl mx-auto">
          {/* Cover Page */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden mb-6 aspect-[8.5/11]"
            style={{ backgroundColor: brandKit.secondaryColor }}
          >
            <div 
              className="h-full flex flex-col items-center justify-center p-12 text-center"
              style={{ fontFamily: brandKit.font }}
            >
              {brandKit.logoUrl ? (
                <img 
                  src={brandKit.logoUrl} 
                  alt="Logo" 
                  className="w-32 h-32 object-contain mb-8"
                />
              ) : (
                <div 
                  className="w-32 h-32 rounded-2xl mb-8 flex items-center justify-center"
                  style={{ backgroundColor: brandKit.primaryColor }}
                >
                  <Globe className="w-16 h-16 text-white" />
                </div>
              )}
              <h1 
                className="text-4xl font-bold mb-4"
                style={{ color: brandKit.primaryColor }}
              >
                Relatório de Auditoria
              </h1>
              <p className="text-2xl text-white/80 mb-2">Presença Digital</p>
              <div className="w-24 h-1 rounded-full my-8" style={{ backgroundColor: brandKit.primaryColor }} />
              <p className="text-xl text-white/90 font-medium">{client?.name}</p>
              <p className="text-white/60 mt-4">
                {new Date(report.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </motion.div>

          {/* Executive Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Resumo Executivo</h2>
            
            {/* Score Overview */}
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <ScoreBadge score={report.overallScore} size="lg" showLabel />
                <p className="text-muted-foreground mt-2">Score Geral</p>
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
                <div key={i} className="text-center p-4 bg-secondary/30 rounded-xl">
                  <item.icon className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn(
                    "text-2xl font-bold mt-1",
                    item.score >= 80 ? "text-success" : 
                    item.score >= 60 ? "text-warning" : "text-error"
                  )}>
                    {item.score}
                  </p>
                </div>
              ))}
            </div>

            {/* Key Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-error/10 border border-error/20 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <h3 className="font-semibold text-foreground">Problemas Críticos</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-error">•</span>
                    PageSpeed mobile abaixo de 80
                  </li>
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-error">•</span>
                    Pixel não instalado
                  </li>
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-error">•</span>
                    Falta CTA na primeira página
                  </li>
                </ul>
              </div>
              
              <div className="p-6 bg-success/10 border border-success/20 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-foreground">Oportunidades</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success">•</span>
                    Iniciar campanhas no Google Ads
                  </li>
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success">•</span>
                    Melhorar frequência de posts no Instagram
                  </li>
                  <li className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success">•</span>
                    Implementar follow-up automatizado
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Plan */}
            <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Plano de Ação Recomendado</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-primary mb-2">7 dias</p>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Instalar Pixel e Tags</li>
                    <li>• Adicionar CTA no site</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-2">30 dias</p>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Otimizar PageSpeed</li>
                    <li>• Organizar destaques do Instagram</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-2">90 dias</p>
                  <ul className="text-sm text-foreground space-y-1">
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
            className="mt-8 py-6 border-t border-border text-center"
          >
            <p className="text-sm text-muted-foreground">
              Relatório gerado por Audit Report Builder • {new Date().toLocaleDateString('pt-BR')}
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
