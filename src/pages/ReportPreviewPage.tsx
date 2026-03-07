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
  PencilOff,
  Globe,
  Instagram,
  MapPin,
  Megaphone,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Calendar,
  FileText,
  ExternalLink,
  Send,
  Copy,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { exportReportToPDF, exportReportToHTML } from '@/lib/pdf-export';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { defaultSections, sampleSections } from '@/data/sampleSections';
import { generateExecutiveSummary } from '@/lib/report-analyzer';

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
  observations,
  recommendations,
  editable,
}: {
  icon: any;
  title: string;
  score: number;
  items: { label: string; value: any }[];
  url?: string;
  observations?: string;
  recommendations?: string[];
  editable?: boolean;
}) => {
  const ep = editable ? { contentEditable: true as const, suppressContentEditableWarning: true } : {};
  return (
  <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: brand.white, border: `1px solid ${brand.border}`, pageBreakInside: 'avoid' }}>
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
    {observations && (
      <div className="px-4 pb-3">
        <p className="text-xs font-medium mb-1" style={{ color: brand.graphiteLight }}>Observações do auditor:</p>
        <p className="text-sm leading-relaxed" style={{ color: brand.graphite }} {...ep}>{observations}</p>
      </div>
    )}
    {recommendations && recommendations.length > 0 && (
      <div className="px-4 pb-4">
        <p className="text-xs font-medium mb-2" style={{ color: brand.gold }}>Recomendações:</p>
        <ul className="space-y-1">
          {recommendations.map((rec, i) => (
            <li key={i} className="text-sm flex items-start gap-2" style={{ color: brand.graphite }} {...ep}>
              <span style={{ color: brand.gold }}>•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
  );
};

// Success modal after deploy
function DeploySuccessModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{ backgroundColor: brand.white, border: `1px solid ${brand.border}` }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${brand.gold}15` }}>
          <Send className="w-8 h-8" style={{ color: brand.gold }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: brand.graphite }}>
          Relatório publicado no Vercel! 🎉
        </h2>
        <p className="text-sm mb-6" style={{ color: brand.graphiteLight }}>
          Copie o link abaixo e envie para o seu cliente.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: brand.bg, border: `1px solid ${brand.border}` }}>
          <p className="flex-1 text-sm truncate text-left font-mono" style={{ color: brand.graphite }}>{url}</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              backgroundColor: copied ? '#22c55e' : brand.gold,
              color: brand.white,
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => window.open(url, '_blank')}
          style={{ backgroundColor: brand.gold, color: brand.white }}
        >
          <ExternalLink className="w-4 h-4" />
          Abrir página do cliente
        </Button>
      </motion.div>
    </div>
  );
}

export default function ReportPreviewPage() {
  const { id } = useParams();
  const { reports, clients, currentReportSections, currentReportId, setCurrentReport, updateReport, brandKit, reportBranding, setReportBranding, getReportSections, getReportBranding } = useAppStore();

  const report = reports.find(r => r.id === id);
  const client = report ? clients.find(c => c.id === report.clientId) : null;
  const [isExporting, setIsExporting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
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
  }, [id]);

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

  const handleSendToClient = async () => {
    if (!report || !client || !sections) return;

    setIsDeploying(true);
    try {
      // 1. Save to Supabase
      const payload = {
        id,
        report_title: report.title,
        report_date: report.date instanceof Date ? report.date.toISOString() : report.date,
        client_name: client.name,
        client_contact: client.contact || null,
        doctor_name: client.doctorName || null,
        city: client.city || null,
        sections: sections as any,
        branding: reportBranding as any,
        overall_score: report.overallScore,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('published_reports')
        .upsert(payload, { onConflict: 'id' });

      if (dbError) throw new Error(dbError.message);

      updateReport(id!, { publishedAt: new Date().toISOString(), status: 'completed' });

      // 2. Generate direct link (no separate deploy needed)
      const url = `https://aurea-analise-digital.vercel.app/r/${id}`;
      window.open(url, '_blank');
      setDeployUrl(url);
    } catch (err) {
      toast({ title: 'Erro ao publicar', description: String(err), variant: 'destructive' });
    } finally {
      setIsDeploying(false);
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

      {deployUrl && (
        <DeploySuccessModal url={deployUrl} onClose={() => setDeployUrl(null)} />
      )}

      {/* Floating edit texts button */}
      {isEditing && (
        <style>{`
          .report-editable h1, .report-editable h2, .report-editable h3, .report-editable h4,
          .report-editable p, .report-editable li, .report-editable span {
            cursor: text;
          }
          .report-editable h1:hover, .report-editable h2:hover, .report-editable h3:hover,
          .report-editable p:hover, .report-editable li:hover {
            outline: 2px dashed rgba(196,162,101,0.4);
            outline-offset: 2px;
            border-radius: 4px;
          }
          .report-editable [contenteditable]:focus {
            outline: 2px solid rgba(196,162,101,0.7);
            outline-offset: 2px;
            border-radius: 4px;
            background: rgba(196,162,101,0.05);
          }
        `}</style>
      )}
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all font-medium text-sm"
        style={{
          backgroundColor: isEditing ? brand.gold : brand.white,
          color: isEditing ? brand.white : brand.graphite,
          border: `1px solid ${brand.border}`,
        }}
      >
        {isEditing ? (
          <><PencilOff className="w-4 h-4" />Sair da edição</>
        ) : (
          <><Pencil className="w-4 h-4" />Editar textos</>
        )}
      </button>

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
            <Button variant="outline" className="gap-2" onClick={handleExportHTML} disabled={isExporting || isDeploying}>
              <FileText className="w-4 h-4" />
              Baixar HTML
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={isExporting || isDeploying}>
              <Download className="w-4 h-4" />
              {isExporting ? 'Gerando...' : 'Baixar PDF'}
            </Button>
            <Button
              className="gap-2"
              onClick={handleSendToClient}
              disabled={isDeploying || isExporting}
              style={{ backgroundColor: brand.gold, color: brand.white }}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar para o Cliente
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PDF Preview Container */}
        <div id="report-content" className={cn("max-w-4xl mx-auto", isEditing && "report-editable")}>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {activeBranding.logoUrl ? (
                  <img
                    src={activeBranding.logoUrl}
                    alt="Logo"
                    className="h-40 object-contain mb-10 mx-auto"
                  />
                ) : (
                  <img
                    src={logoAureaEmblem}
                    alt="Áurea Performance"
                    className="h-40 object-contain mb-10 mx-auto"
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

            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <ScoreBadge score={report.overallScore} size="lg" showLabel />
                <p className="mt-2" style={{ color: brand.graphiteLight }}>Score Geral</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { icon: Globe, label: 'Site', score: sections?.site.score ?? 0, disabled: sections?.disabledSections?.site },
                { icon: Instagram, label: 'Instagram', score: sections?.instagram.score ?? 0, disabled: sections?.disabledSections?.instagram },
                { icon: MapPin, label: 'GMN', score: sections?.gmn.score ?? 0, disabled: sections?.disabledSections?.gmn },
                { icon: Megaphone, label: 'Tráfego', score: sections?.paidTraffic.score ?? 0, disabled: sections?.disabledSections?.paidTraffic },
                { icon: Briefcase, label: 'Comercial', score: sections?.commercial.score ?? 0, disabled: sections?.disabledSections?.commercial },
              ].filter(item => !item.disabled).map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${brand.gold}08`, border: `1px solid ${brand.border}` }}>
                  <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: brand.gold }} />
                  <p className="text-xs" style={{ color: brand.graphiteLight }}>{item.label}</p>
                  <p className={cn("text-2xl font-bold mt-1")} style={{ color: item.score >= 80 ? brand.green : item.score >= 60 ? brand.gold : '#C0392B' }}>
                    {item.score}
                  </p>
                </div>
              ))}
            </div>

            {sections && (
              <>
                {(() => {
                  const analysis = report.executiveSummary ?? generateExecutiveSummary(
                    sections.site,
                    sections.instagram,
                    sections.gmn,
                    sections.paidTraffic,
                    sections.commercial,
                    sections.disabledSections
                  );

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-xl" style={{ backgroundColor: '#C0392B0D', border: '1px solid #C0392B20' }}>
                        <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-5 h-5" style={{ color: '#C0392B' }} />
                          <h3 className="font-semibold" style={{ color: brand.graphite }}>
                            {analysis.topProblems.length > 0 ? 'Problemas Críticos' : 'Nenhum Problema Crítico'}
                          </h3>
                        </div>
                        {analysis.topProblems.length > 0 ? (
                          <ul className="space-y-2">
                            {analysis.topProblems.map((problem, i) => (
                              <li key={i} className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                                <span style={{ color: '#C0392B' }}>•</span>
                                <span>
                                  <strong>{problem.title}</strong>
                                  {problem.description && ` — ${problem.description}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm" style={{ color: brand.graphiteLight }}>
                            Nenhum problema crítico detectado. Excelente trabalho!
                          </p>
                        )}
                      </div>

                      <div className="p-6 rounded-xl" style={{ backgroundColor: `${brand.green}0D`, border: `1px solid ${brand.green}20` }}>
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="w-5 h-5" style={{ color: brand.green }} />
                          <h3 className="font-semibold" style={{ color: brand.graphite }}>Oportunidades</h3>
                        </div>
                        {analysis.topOpportunities.length > 0 ? (
                          <ul className="space-y-2">
                            {analysis.topOpportunities.map((opp, i) => (
                              <li key={i} className="text-sm flex items-start gap-2" style={{ color: brand.graphite }}>
                                <span style={{ color: brand.green }}>•</span>
                                <span>
                                  <strong>{opp.title}</strong>
                                  {opp.description && ` — ${opp.description}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm" style={{ color: brand.graphiteLight }}>
                            Nenhuma oportunidade próxima. Continue otimizando!
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {sections && (
              <>
                {(() => {
                  const analysis = report.executiveSummary ?? generateExecutiveSummary(
                    sections.site,
                    sections.instagram,
                    sections.gmn,
                    sections.paidTraffic,
                    sections.commercial,
                    sections.disabledSections
                  );

                  const { days7, days30, days90 } = analysis.recommendedPlan;

                  return (
                    <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: `${brand.gold}0D`, border: `1px solid ${brand.gold}20` }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5" style={{ color: brand.gold }} />
                        <h3 className="font-semibold" style={{ color: brand.graphite }}>Plano de Ação Recomendado</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>7 dias</p>
                          {days7.length > 0 ? (
                            <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                              {days7.map((rec, i) => <li key={i}>• {rec}</li>)}
                            </ul>
                          ) : (
                            <p className="text-xs" style={{ color: brand.graphiteLight }}>Nenhuma ação prioritária</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>30 dias</p>
                          {days30.length > 0 ? (
                            <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                              {days30.map((rec, i) => <li key={i}>• {rec}</li>)}
                            </ul>
                          ) : (
                            <p className="text-xs" style={{ color: brand.graphiteLight }}>Nenhuma ação de médio prazo</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: brand.gold }}>90 dias</p>
                          {days90.length > 0 ? (
                            <ul className="text-sm space-y-1" style={{ color: brand.graphite }}>
                              {days90.map((rec, i) => <li key={i}>• {rec}</li>)}
                            </ul>
                          ) : (
                            <p className="text-xs" style={{ color: brand.graphiteLight }}>Nenhuma ação de longo prazo</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </motion.div>

          {/* Section Details */}
          {sections && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {!sections?.disabledSections?.site && (
                <SectionPreview
                  editable={isEditing}
                  icon={Globe}
                  title="Site"
                  score={sections.site.score}
                  url={siteUrl || undefined}
                  observations={sections.site.observations}
                  recommendations={sections.site.recommendations}
                  items={[
                    { label: 'PageSpeed Desktop', value: sections.site.pageSpeed.desktopScore },
                    { label: 'PageSpeed Mobile', value: sections.site.pageSpeed.mobileScore },
                    { label: 'Pixel Instalado', value: sections.site.pixelTag.pixelInstalled },
                    { label: 'Tag Instalada', value: sections.site.pixelTag.tagInstalled },
                    { label: 'Keywords Orgânicas', value: sections.site.seo.organicKeywords },
                    { label: 'Domain Authority', value: sections.site.seo.domainAuthority },
                  ]}
                />
              )}

              {!sections?.disabledSections?.instagram && (
                <SectionPreview
                  editable={isEditing}
                  icon={Instagram}
                  title="Instagram"
                  score={sections.instagram.score}
                  url={instagramUrl || undefined}
                  observations={sections.instagram.observations}
                  recommendations={sections.instagram.recommendations}
                  items={[
                    { label: 'Perfil Próprio', value: sections.instagram.profile.hasOwnProfile },
                    { label: 'Bio Completa', value: sections.instagram.bio.whatDoes === 'ok' },
                    { label: 'CTA na Bio', value: sections.instagram.bio.cta === 'ok' },
                    { label: 'Link na Bio', value: sections.instagram.bio.linkInBio === 'ok' },
                    { label: 'Link com rastreamento (UTM)', value: sections.instagram.bio.linkTracking },
                    { label: 'Frequência Feed', value: sections.instagram.content.feedFrequency || '—' },
                    { label: 'Frequência Stories', value: sections.instagram.content.storiesFrequency || '—' },
                  ]}
                />
              )}

              {!sections?.disabledSections?.gmn && (
                <SectionPreview
                  editable={isEditing}
                  icon={MapPin}
                  title="Google Meu Negócio"
                  score={sections.gmn.score}
                  url={gmnUrl || undefined}
                  observations={sections.gmn.observations}
                  recommendations={sections.gmn.recommendations}
                  items={[
                    { label: 'Avaliações', value: sections.gmn.reviewCount },
                    { label: 'Nota Média', value: sections.gmn.averageRating },
                    { label: 'NAP Consistente', value: sections.gmn.checklist.napConsistent },
                    { label: 'Horário Atualizado', value: sections.gmn.checklist.hoursUpdated },
                    { label: 'Fotos Atualizadas', value: sections.gmn.checklist.photosVideosUpdated },
                    { label: 'Posts Regulares', value: sections.gmn.checklist.regularPosts },
                  ]}
                />
              )}

              {!sections?.disabledSections?.paidTraffic && (
                <SectionPreview
                  editable={isEditing}
                  icon={Megaphone}
                  title="Tráfego Pago"
                  score={sections.paidTraffic.score}
                  observations={sections.paidTraffic.observations}
                  recommendations={sections.paidTraffic.recommendations}
                  items={[
                    { label: 'Google Ads Ativo', value: sections.paidTraffic.googleAds.isAdvertising },
                    { label: 'Campanhas Google', value: sections.paidTraffic.googleAds.campaignCount },
                    { label: 'Vídeos Google', value: sections.paidTraffic.googleAds.hasVideoCreatives },
                    { label: 'Facebook Ads Ativo', value: sections.paidTraffic.facebookAds.isAdvertising },
                    { label: 'Campanhas Facebook', value: sections.paidTraffic.facebookAds.campaignCount },
                    { label: 'Vídeos Facebook', value: sections.paidTraffic.facebookAds.hasVideoCreatives },
                  ]}
                />
              )}

              {!sections?.disabledSections?.commercial && (
                <SectionPreview
                  editable={isEditing}
                  icon={Briefcase}
                  title="Comercial"
                  score={sections.commercial.score}
                  observations={sections.commercial.observations}
                  recommendations={sections.commercial.recommendations}
                  items={[
                    { label: 'Tempo de Resposta', value: sections.commercial.leadResponseTime || '—' },
                    { label: 'Follow-ups', value: sections.commercial.followUps || '—' },
                  ]}
                />
              )}
            </motion.div>
          )}

          {/* CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-8 mt-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-2">
              {client?.doctorName ? `${client.doctorName}, ` : client?.name ? `${client.name}, ` : ''}vamos elevar a presença digital do seu negócio?
            </h2>
            <p className="mb-4">
              Entre em contato para implementar as recomendações e atrair mais pacientes para procedimentos estéticos em {client?.city || 'sua cidade'}.
            </p>
            <a href="https://wa.me/5511999718595" target="_blank" rel="noopener noreferrer">
              <Button style={{ backgroundColor: brand.gold, color: brand.white }}>
                Falar com um especialista
              </Button>
            </a>
          </motion.div>

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
