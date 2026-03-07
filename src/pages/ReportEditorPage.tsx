import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/ui/score-badge';
import { toast } from '@/hooks/use-toast';
import { calculateOverallScore as calculateWeightedScore } from '@/lib/scoring';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Globe,
  Instagram,
  MapPin,
  Megaphone,
  Briefcase,
  Download,
  FileText,
  Send,
  Save,
  Eye,
  Sparkles,
} from 'lucide-react';
import { generateSectionTextsWithAI } from '@/lib/gemini';
import { motion } from 'framer-motion';
import { SiteSectionEditor } from '@/components/report/SiteSectionEditor';
import { InstagramSectionEditor } from '@/components/report/InstagramSectionEditor';
import { GMNSectionEditor } from '@/components/report/GMNSectionEditor';
import { PaidTrafficSectionEditor } from '@/components/report/PaidTrafficSectionEditor';
import { CommercialSectionEditor } from '@/components/report/CommercialSectionEditor';
import { defaultSections, sampleSections } from '@/data/sampleSections';

const tabs = [
  { id: 'site', label: 'Site', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'gmn', label: 'GMN', icon: MapPin },
  { id: 'traffic', label: 'Tráfego Pago', icon: Megaphone },
  { id: 'commercial', label: 'Comercial', icon: Briefcase },
];

export default function ReportEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reports, clients, currentReportSections, currentReportId, setCurrentReport, updateReport, setReportBranding, getReportSections, saveReportSections, getReportBranding, setCurrentReportSections, updateSection } = useAppStore();
  const [activeTab, setActiveTab] = useState('site');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const report = reports.find(r => r.id === id);
  const client = report ? clients.find(c => c.id === report.clientId) : null;

  useEffect(() => {
    if (!id) return;
    
    // Load saved sections for this report, or use defaults
    if (currentReportId !== id) {
      const saved = getReportSections(id);
      if (saved) {
        setCurrentReport(id, saved);
      } else {
        const initialData = id === '2' ? sampleSections : defaultSections;
        setCurrentReport(id, initialData);
        saveReportSections(id, initialData);
        
        if (id === '2') {
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
      }
      
      // Load saved branding for this report
      const savedBranding = useAppStore.getState().getReportBranding(id);
      if (savedBranding) {
        setReportBranding(savedBranding);
      } else {
        setReportBranding(null);
      }
    }
  }, [id, currentReportId]);

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

  const calculateOverallScore = () => {
    if (!currentReportSections) return 0;
    return calculateWeightedScore(
      currentReportSections.site.score,
      currentReportSections.instagram.score,
      currentReportSections.gmn.score,
      currentReportSections.paidTraffic.score,
      currentReportSections.commercial.score,
      currentReportSections.disabledSections
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const overallScore = calculateOverallScore();
    updateReport(report.id, { 
      overallScore,
      status: 'in_progress'
    });
    // Explicitly save sections too
    if (currentReportSections && id) {
      saveReportSections(id, currentReportSections);
    }
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: 'Relatório salvo!' });
    }, 500);
  };

  const handlePublishReport = async () => {
    if (!id || !currentReportSections || !report) return;

    // Save locally first
    const overallScore = calculateOverallScore();
    updateReport(report.id, { overallScore, status: 'in_progress' });
    if (currentReportSections) {
      saveReportSections(id, currentReportSections);
    }

    try {
      const branding = useAppStore.getState().getReportBranding(id);

      const payload = {
        id,
        report_title: report.title,
        report_date: report.date instanceof Date ? report.date.toISOString() : report.date,
        client_name: client?.name || 'Cliente',
        client_contact: client?.contact || null,
        doctor_name: client?.doctorName || null,
        city: client?.city || null,
        sections: currentReportSections as any,
        branding: branding as any,
        overall_score: overallScore,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('published_reports')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error publishing report:', error);
      toast({ title: 'Erro ao publicar', description: 'Tente novamente.', variant: 'destructive' });
      return false;
    }
  };

  const handleSendToClient = async () => {
    const published = await handlePublishReport();
    if (published) {
      const link = `${window.location.origin}/r/${id}`;
      navigator.clipboard.writeText(link);
      toast({
        title: 'Relatório publicado!',
        description: 'Link copiado para a área de transferência. Compartilhe com seu cliente.',
      });
    }
  };

  const handleDownloadPDF = async () => {
    const published = await handlePublishReport();
    if (published) {
      const url = `${window.location.origin}/r/${id}`;
      window.open(url, '_blank');
      setTimeout(() => {
        window.print();
      }, 1000);
      toast({
        title: 'PDF - Use a função Print',
        description: 'Abri a página. Use Ctrl+P (ou Cmd+P) para salvar como PDF.',
      });
    }
  };

  const handleDownloadHTML = async () => {
    const published = await handlePublishReport();
    if (published) {
      const url = `${window.location.origin}/r/${id}`;
      const response = await fetch(url);
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report-${report?.title.toLowerCase().replace(/\s+/g, '-')}.html`;
      link.click();
      toast({ title: 'HTML baixado com sucesso!' });
    }
  };

  const handlePreviewWithAI = async () => {
    if (!currentReportSections || !id) return;
    setIsAnalyzing(true);
    try {
      const result = await generateSectionTextsWithAI(
        currentReportSections.site,
        currentReportSections.instagram,
        currentReportSections.gmn,
        currentReportSections.paidTraffic,
        currentReportSections.commercial,
        client?.name || 'Cliente',
        currentReportSections.disabledSections as Record<string, boolean> | undefined
      );

      const store = useAppStore.getState();
      if (!currentReportSections.disabledSections?.site) {
        store.updateSection('site', { observations: result.site.observations, recommendations: result.site.recommendations });
      }
      if (!currentReportSections.disabledSections?.instagram) {
        store.updateSection('instagram', { observations: result.instagram.observations, recommendations: result.instagram.recommendations });
      }
      if (!currentReportSections.disabledSections?.gmn) {
        store.updateSection('gmn', { observations: result.gmn.observations, recommendations: result.gmn.recommendations });
      }
      if (!currentReportSections.disabledSections?.paidTraffic) {
        store.updateSection('paidTraffic', { observations: result.paidTraffic.observations, recommendations: result.paidTraffic.recommendations });
      }
      if (!currentReportSections.disabledSections?.commercial) {
        store.updateSection('commercial', { observations: result.commercial.observations, recommendations: result.commercial.recommendations });
      }

      const overallScore = calculateOverallScore();
      updateReport(report.id, { overallScore, status: 'in_progress' });
      saveReportSections(id, useAppStore.getState().currentReportSections!);

      navigate(`/reports/${id}/preview`);
    } catch (err) {
      console.error('AI analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro na análise com IA', description: msg, variant: 'destructive' });
      setIsAnalyzing(false);
    }
  };

  // Handle Alt+S for edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // This could toggle edit mode in a future full-page editor
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MainLayout>
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            <p className="text-lg font-semibold text-foreground">Analisando com IA...</p>
            <p className="text-sm text-muted-foreground">Gerando observações e recomendações personalizadas</p>
          </div>
        </div>
      )}
      <Header
        title={report.title}
        subtitle={client?.name}
      />
      
      <div className="p-6">
        {/* Top Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link to="/reports">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          

          <div className="flex items-center gap-4">
            <ScoreBadge score={calculateOverallScore()} size="sm" />
            <Button onClick={handleSave} variant="secondary" className="gap-2" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button className="gap-2" onClick={handlePreviewWithAI} disabled={isAnalyzing}>
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border p-1 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {(['site', 'instagram', 'gmn', 'traffic', 'commercial'] as const).map((tabId) => {
              const sectionKey = tabId === 'traffic' ? 'paidTraffic' : tabId;
              const isDisabled = currentReportSections?.disabledSections?.[sectionKey as keyof NonNullable<typeof currentReportSections.disabledSections>] ?? false;
              
              const toggleDisabled = () => {
                if (!currentReportSections) return;
                updateSection('site', {}); // trigger re-render
                const newDisabled = {
                  ...currentReportSections.disabledSections,
                  [sectionKey]: !isDisabled,
                };
                // Use setCurrentReportSections to update disabledSections
                const store = useAppStore.getState();
                store.setCurrentReportSections({
                  ...currentReportSections,
                  disabledSections: newDisabled,
                });
                if (id) {
                  store.saveReportSections(id, {
                    ...currentReportSections,
                    disabledSections: newDisabled,
                  });
                }
              };
              
              const EditorComponent = {
                site: SiteSectionEditor,
                instagram: InstagramSectionEditor,
                gmn: GMNSectionEditor,
                traffic: PaidTrafficSectionEditor,
                commercial: CommercialSectionEditor,
              }[tabId];
              
              return (
                <TabsContent key={tabId} value={tabId} className="mt-0">
                  <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                    <input
                      type="checkbox"
                      id={`disable-${tabId}`}
                      checked={isDisabled}
                      onChange={toggleDisabled}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <label htmlFor={`disable-${tabId}`} className="text-sm font-medium text-foreground cursor-pointer">
                      Não se aplica
                    </label>
                    <span className="text-xs text-muted-foreground">
                      (esta seção não será incluída no relatório)
                    </span>
                  </div>
                  {isDisabled ? (
                    <div className="flex items-center justify-center p-16 rounded-2xl bg-muted/30 border border-border border-dashed">
                      <p className="text-muted-foreground text-sm">Seção marcada como "Não se aplica" — não será incluída no relatório.</p>
                    </div>
                  ) : (
                    <EditorComponent />
                  )}
                </TabsContent>
              );
            })}
          </motion.div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
