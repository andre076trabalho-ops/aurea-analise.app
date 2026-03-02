import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/ui/score-badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Globe, 
  Instagram, 
  MapPin, 
  Megaphone, 
  Briefcase,
  Eye,
  ExternalLink,
  Save,
  Wand2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
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
  const { reports, clients, currentReportSections, currentReportId, setCurrentReport, updateReport, setReportBranding, getReportSections, saveReportSections, getReportBranding, setReportBrandingForId } = useAppStore();
  const [activeTab, setActiveTab] = useState('site');
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    const weights = { site: 40, instagram: 25, gmn: 20, paidTraffic: 10, commercial: 5 };
    const total = 
      (currentReportSections.site.score * weights.site / 100) +
      (currentReportSections.instagram.score * weights.instagram / 100) +
      (currentReportSections.gmn.score * weights.gmn / 100) +
      (currentReportSections.paidTraffic.score * weights.paidTraffic / 100) +
      (currentReportSections.commercial.score * weights.commercial / 100);
    return Math.round(total);
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

  const handleDetectBranding = async () => {
    const siteUrl = currentReportSections?.site?.siteUrl;
    if (!siteUrl) {
      toast({ title: 'URL do site não informada', description: 'Preencha a URL do site na aba "Site" primeiro.', variant: 'destructive' });
      return;
    }

    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-branding', {
        body: { url: siteUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.branding) {
        setReportBranding(data.branding);
        toast({ title: 'Branding detectado!', description: 'Dados do site foram extraídos. Clique em "Gerar Página" para verificar e gerar.' });
      }
    } catch (err) {
      console.error('Branding detection error:', err);
      toast({ title: 'Erro ao detectar branding', description: String(err), variant: 'destructive' });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGeneratePage = async () => {
    if (!id || !currentReportSections) return;

    // First save
    handleSave();

    const siteUrl = currentReportSections?.site?.siteUrl;
    const existingBranding = id ? getReportBranding(id) : null;

    if (!siteUrl) {
      // No URL, just navigate
      navigate(`/r/${id}`);
      return;
    }

    // If we have branding, run verification before navigating
    if (existingBranding) {
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke('verify-report', {
          body: { 
            url: siteUrl, 
            branding: existingBranding,
          },
        });

        if (!error && data?.verified && data?.branding) {
          setReportBrandingForId(id, data.branding);
          if (data.corrections?.length > 0) {
            const correctionList = data.corrections.map((c: any) => `• ${c.field}: ${c.reason}`).join('\n');
            toast({ 
              title: `${data.corrections.length} correção(ões) aplicada(s)`, 
              description: correctionList.substring(0, 200),
            });
          } else {
            toast({ title: 'Dados verificados!', description: 'Todas as informações conferem com o site.' });
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        // Continue anyway, just warn
        toast({ title: 'Aviso', description: 'Não foi possível verificar os dados. Página gerada com dados existentes.', variant: 'destructive' });
      } finally {
        setIsGenerating(false);
      }
    } else {
      // No branding yet, try to extract + verify in one go
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke('extract-branding', {
          body: { url: siteUrl },
        });

        if (!error && data?.branding) {
          // Now verify
          const { data: verifyData } = await supabase.functions.invoke('verify-report', {
            body: { url: siteUrl, branding: data.branding },
          });

          const finalBranding = verifyData?.verified ? verifyData.branding : data.branding;
          setReportBrandingForId(id, finalBranding);
          setReportBranding(finalBranding);
        }
      } catch (err) {
        console.error('Generate page error:', err);
      } finally {
        setIsGenerating(false);
      }
    }

    navigate(`/r/${id}`);
  };

  return (
    <MainLayout>
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
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleDetectBranding} 
              disabled={isDetecting}
            >
              {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isDetecting ? 'Detectando...' : 'Detectar Branding'}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <ScoreBadge score={calculateOverallScore()} size="sm" />
            <Link to={`/reports/${id}/preview`}>
              <Button variant="secondary" className="gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              className="gap-2" 
              onClick={handleGeneratePage}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {isGenerating ? 'Verificando...' : 'Gerar Página'}
            </Button>
            <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
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
            <TabsContent value="site" className="mt-0">
              <SiteSectionEditor />
            </TabsContent>
            <TabsContent value="instagram" className="mt-0">
              <InstagramSectionEditor />
            </TabsContent>
            <TabsContent value="gmn" className="mt-0">
              <GMNSectionEditor />
            </TabsContent>
            <TabsContent value="traffic" className="mt-0">
              <PaidTrafficSectionEditor />
            </TabsContent>
            <TabsContent value="commercial" className="mt-0">
              <CommercialSectionEditor />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
