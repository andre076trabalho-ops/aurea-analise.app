import { useAppStore } from '@/stores/useAppStore';
import { SectionCard } from '@/components/ui/section-card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { EvidenceUpload } from '@/components/ui/evidence-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuditorNote } from '@/components/ui/auditor-note';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Gauge, Tag, Search, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function SiteSectionEditor({ onAIComplement }: { onAIComplement?: () => Promise<void> }) {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { site } = currentReportSections;

  const updatePageSpeed = (field: 'desktopScore' | 'mobileScore', value: number | null) => {
    updateSection('site', {
      pageSpeed: { ...site.pageSpeed, [field]: value }
    });
  };

  const updatePixelTag = (field: 'pixelInstalled' | 'tagInstalled', value: boolean | null) => {
    updateSection('site', {
      pixelTag: { ...site.pixelTag, [field]: value }
    });
  };

  const updateSeo = (field: keyof typeof site.seo, value: number | null) => {
    updateSection('site', {
      seo: { ...site.seo, [field]: value }
    });
  };

  const updateChecklist = (field: keyof typeof site.checklist, value: boolean | null) => {
    updateSection('site', {
      checklist: { ...site.checklist, [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      {/* PageSpeed Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={Gauge} title="PageSpeed" description="Performance do site">
          <div className="space-y-2 mb-6">
            <Label>URL do site</Label>
            <Input 
              type="url"
              placeholder="https://www.exemplo.com.br"
              value={site.siteUrl ?? ''}
              onChange={(e) => updateSection('site', { siteUrl: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Desktop Score (0-100)</Label>
              <Input 
                type="number" 
                min={0} 
                max={100}
                placeholder="Ex: 85"
                value={site.pageSpeed.desktopScore ?? ''}
                onChange={(e) => updatePageSpeed('desktopScore', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Score (0-100)</Label>
              <Input 
                type="number" 
                min={0} 
                max={100}
                placeholder="Ex: 72"
                value={site.pageSpeed.mobileScore ?? ''}
                onChange={(e) => updatePageSpeed('mobileScore', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
          <EvidenceUpload 
            label="Print do PageSpeed"
            description="PNG, JPG ou PDF do resultado"
          />
        </SectionCard>
      </motion.div>

      {/* Pixel & Tag Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard icon={Tag} title="Pixel e Tag" description="Rastreamento instalado">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Pixel instalado?</Label>
              <Select 
                value={site.pixelTag.pixelInstalled === null ? '' : site.pixelTag.pixelInstalled.toString()}
                onValueChange={(v) => updatePixelTag('pixelInstalled', v === '' ? null : v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tag instalada?</Label>
              <Select 
                value={site.pixelTag.tagInstalled === null ? '' : site.pixelTag.tagInstalled.toString()}
                onValueChange={(v) => updatePixelTag('tagInstalled', v === '' ? null : v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <EvidenceUpload 
            label="Print do Tag Assistant / GTM"
            description="Evidência da instalação"
          />
        </SectionCard>
      </motion.div>

      {/* SEO Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard icon={Search} title="SEO (Ubersuggest)" description="Métricas de busca orgânica">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Keywords Orgânicas</Label>
              <Input 
                type="number"
                placeholder="Ex: 450"
                value={site.seo.organicKeywords ?? ''}
                onChange={(e) => updateSeo('organicKeywords', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tráfego Orgânico</Label>
              <Input 
                type="number"
                placeholder="Ex: 1200"
                value={site.seo.organicTraffic ?? ''}
                onChange={(e) => updateSeo('organicTraffic', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Domain Authority</Label>
              <Input 
                type="number"
                placeholder="Ex: 35"
                value={site.seo.domainAuthority ?? ''}
                onChange={(e) => updateSeo('domainAuthority', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Backlinks</Label>
              <Input 
                type="number"
                placeholder="Ex: 120"
                value={site.seo.backlinks ?? ''}
                onChange={(e) => updateSeo('backlinks', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
          <EvidenceUpload 
            label="Print do Ubersuggest"
            description="Screenshot das métricas SEO"
          />
        </SectionCard>
      </motion.div>

      {/* Checklist Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SectionCard icon={CheckSquare} title="Checklist de Credibilidade" description="Avaliação de usabilidade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'credibleDesign', label: 'Design que gera credibilidade', hint: 'Referência Nielsen' },
              { key: 'buttonsWorking', label: 'Botões funcionando', hint: 'Teste de navegação' },
              { key: 'socialAccessible', label: 'Redes sociais acessíveis', hint: '56% procuram redes sociais' },
              { key: 'ctaFirstPage', label: 'CTA + Botão na primeira página', hint: 'Acima da dobra' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Select 
                  value={site.checklist[item.key as keyof typeof site.checklist] === null ? '' : site.checklist[item.key as keyof typeof site.checklist]!.toString()}
                  onValueChange={(v) => updateChecklist(item.key as keyof typeof site.checklist, v === '' ? null : v === 'true')}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      {/* Observations & Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <SectionCard icon={Globe} title="Observações" description="Notas do auditor">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recomendações</Label>
              <div className="space-y-2">
                {(site.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={rec}
                      onChange={(e) => {
                        const updated = [...(site.recommendations || [])];
                        updated[i] = e.target.value;
                        updateSection('site', { recommendations: updated });
                      }}
                      placeholder={`Recomendação ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateSection('site', { recommendations: (site.recommendations || []).filter((_, idx) => idx !== i) })}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => updateSection('site', { recommendations: [...(site.recommendations || []), ''] })}
                >
                  <Plus className="w-4 h-4" /> Adicionar recomendação
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prioridade do problema</Label>
              <Select 
                value={site.priority}
                onValueChange={(v: 'low' | 'medium' | 'high' | 'urgent') => updateSection('site', { priority: v })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AuditorNote
              value={site.observations}
              onChange={(v) => updateSection('site', { observations: v })}
              placeholder="Adicione observações sobre o site..."
              onAIComplement={onAIComplement}
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
