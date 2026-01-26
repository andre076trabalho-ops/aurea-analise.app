import { useAppStore } from '@/stores/useAppStore';
import { SectionCard } from '@/components/ui/section-card';
import { EvidenceUpload } from '@/components/ui/evidence-upload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Chrome, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';

export function PaidTrafficSectionEditor() {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { paidTraffic } = currentReportSections;

  return (
    <div className="space-y-6">
      {/* Google Ads Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={Chrome} title="Google Ads" description="Canal de intenção de compra">
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
        <SectionCard icon={Facebook} title="Facebook/Meta Ads" description="Canal de autoridade e brand lift">
          <div className="mb-4 p-4 bg-info/10 border border-info/20 rounded-xl">
            <p className="text-sm text-foreground">
              <strong>Facebook Ads:</strong> Canal de autoridade e Brand Lift. 
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
          <div className="space-y-2">
            <Label>Observações do auditor</Label>
            <Textarea 
              placeholder="Adicione observações sobre tráfego pago..."
              value={paidTraffic.observations}
              onChange={(e) => updateSection('paidTraffic', { observations: e.target.value })}
              rows={4}
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
