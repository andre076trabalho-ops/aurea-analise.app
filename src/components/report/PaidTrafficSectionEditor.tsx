import { useAppStore } from '@/stores/useAppStore';
import { SectionCard } from '@/components/ui/section-card';
import { EvidenceUpload } from '@/components/ui/evidence-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuditorNote } from '@/components/ui/auditor-note';
import { LinkInput } from '@/components/ui/link-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Chrome, Facebook, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function PaidTrafficSectionEditor({ onAIComplement }: { onAIComplement?: () => Promise<void> }) {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { paidTraffic } = currentReportSections;

  return (
    <div className="space-y-6">
      {/* Google Ads Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={Chrome} title="Google Ads" description="Canal de intenção de compra">
          <LinkInput
            label="Link do Google Ads / Transparency"
            placeholder="https://adstransparency.google.com/..."
            value={paidTraffic.googleAdsUrl ?? ''}
            onChange={(v) => updateSection('paidTraffic', { googleAdsUrl: v })}
            className="mb-4"
          />
          <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-xl">
            <p className="text-sm text-foreground">
              <strong>Google Ads:</strong> Canal de intenção — usuários pesquisam ativamente por soluções. 
              Alta taxa de conversão quando bem segmentado.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Está veiculando anúncios?</Label>
              <Select 
                value={paidTraffic.googleAds.isAdvertising === null ? '' : paidTraffic.googleAds.isAdvertising.toString()}
                onValueChange={(v) => updateSection('paidTraffic', {
                  googleAds: { ...paidTraffic.googleAds, isAdvertising: v === '' ? null : v === 'true' }
                })}
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
              <Label>Quantidade de campanhas</Label>
              <Input 
                type="number"
                placeholder="Ex: 3"
                value={paidTraffic.googleAds.campaignCount ?? ''}
                onChange={(e) => updateSection('paidTraffic', {
                  googleAds: { ...paidTraffic.googleAds, campaignCount: e.target.value ? Number(e.target.value) : null }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Criativos em vídeo?</Label>
              <Select 
                value={paidTraffic.googleAds.hasVideoCreatives === null ? '' : paidTraffic.googleAds.hasVideoCreatives.toString()}
                onValueChange={(v) => updateSection('paidTraffic', {
                  googleAds: { ...paidTraffic.googleAds, hasVideoCreatives: v === '' ? null : v === 'true' }
                })}
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
            label="Print do Google Ads"
            description="Evidência de anúncios ativos"
          />
        </SectionCard>
      </motion.div>

      {/* Facebook Ads Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard icon={Facebook} title="Facebook/Meta Ads" description="Canal de posicionamento e brand lift">
          <LinkInput
            label="Link do Meta Ads Library"
            placeholder="https://www.facebook.com/ads/library/..."
            value={paidTraffic.facebookAdsUrl ?? ''}
            onChange={(v) => updateSection('paidTraffic', { facebookAdsUrl: v })}
            className="mb-4"
          />
          <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-xl">
            <p className="text-sm text-foreground">
              <strong>Facebook Ads:</strong> Canal de posicionamento e Brand Lift.
              Estudo Nielsen: anúncios vistos 8x/mês aumentam lembrança de marca em 74%.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Está veiculando anúncios?</Label>
              <Select 
                value={paidTraffic.facebookAds.isAdvertising === null ? '' : paidTraffic.facebookAds.isAdvertising.toString()}
                onValueChange={(v) => updateSection('paidTraffic', {
                  facebookAds: { ...paidTraffic.facebookAds, isAdvertising: v === '' ? null : v === 'true' }
                })}
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
              <Label>Quantidade de campanhas</Label>
              <Input 
                type="number"
                placeholder="Ex: 5"
                value={paidTraffic.facebookAds.campaignCount ?? ''}
                onChange={(e) => updateSection('paidTraffic', {
                  facebookAds: { ...paidTraffic.facebookAds, campaignCount: e.target.value ? Number(e.target.value) : null }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Criativos em vídeo?</Label>
              <Select 
                value={paidTraffic.facebookAds.hasVideoCreatives === null ? '' : paidTraffic.facebookAds.hasVideoCreatives.toString()}
                onValueChange={(v) => updateSection('paidTraffic', {
                  facebookAds: { ...paidTraffic.facebookAds, hasVideoCreatives: v === '' ? null : v === 'true' }
                })}
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
            label="Print do Facebook Ads Library"
            description="Evidência de anúncios ativos"
          />
        </SectionCard>
      </motion.div>

      {/* Observations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard icon={Megaphone} title="Observações" description="Notas do auditor">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recomendações</Label>
              <div className="space-y-2">
                {(paidTraffic.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={rec}
                      onChange={(e) => {
                        const updated = [...(paidTraffic.recommendations || [])];
                        updated[i] = e.target.value;
                        updateSection('paidTraffic', { recommendations: updated });
                      }}
                      placeholder={`Recomendação ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateSection('paidTraffic', { recommendations: (paidTraffic.recommendations || []).filter((_, idx) => idx !== i) })}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => updateSection('paidTraffic', { recommendations: [...(paidTraffic.recommendations || []), ''] })}
                >
                  <Plus className="w-4 h-4" /> Adicionar recomendação
                </Button>
              </div>
            </div>
            <AuditorNote
              value={paidTraffic.observations}
              onChange={(v) => updateSection('paidTraffic', { observations: v })}
              placeholder="Adicione observações sobre tráfego pago..."
              onAIComplement={onAIComplement}
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
