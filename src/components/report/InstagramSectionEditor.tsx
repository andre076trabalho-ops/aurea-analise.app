import { useAppStore } from '@/stores/useAppStore';
import { SectionCard } from '@/components/ui/section-card';
import { EvidenceUpload } from '@/components/ui/evidence-upload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MultiLinkInput } from '@/components/ui/link-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Instagram, User, FileText, Star, Pin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

type OkNok = 'ok' | 'nok' | null;

const OkNokSelect = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: OkNok; 
  onChange: (v: OkNok) => void;
  label: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
    <span className="text-sm text-foreground">{label}</span>
    <Select 
      value={value ?? ''} 
      onValueChange={(v) => onChange(v === '' ? null : v as OkNok)}
    >
      <SelectTrigger className="w-20">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ok">Ok</SelectItem>
        <SelectItem value="nok">Nok</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export function InstagramSectionEditor() {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { instagram } = currentReportSections;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={User} title="Análise do Perfil" description="Informações básicas do Instagram">
          <div className="space-y-4">
            <MultiLinkInput
              label="Links do Instagram"
              placeholder="https://instagram.com/usuario"
              values={instagram.instagramUrls ?? ['']}
              onChange={(vals) => updateSection('instagram', { instagramUrls: vals })}
            />
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <span className="font-medium text-foreground">Empresa tem perfil próprio?</span>
              <Select 
                value={instagram.profile.hasOwnProfile === null ? '' : instagram.profile.hasOwnProfile.toString()}
                onValueChange={(v) => updateSection('instagram', {
                  profile: { ...instagram.profile, hasOwnProfile: v === '' ? null : v === 'true' }
                })}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <OkNokSelect 
                label="Arroba" 
                value={instagram.profile.handle} 
                onChange={(v) => updateSection('instagram', { profile: { ...instagram.profile, handle: v } })}
              />
              <OkNokSelect 
                label="Nome" 
                value={instagram.profile.name} 
                onChange={(v) => updateSection('instagram', { profile: { ...instagram.profile, name: v } })}
              />
              <OkNokSelect 
                label="Foto do Perfil" 
                value={instagram.profile.profilePhoto} 
                onChange={(v) => updateSection('instagram', { profile: { ...instagram.profile, profilePhoto: v } })}
              />
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Bio Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard icon={FileText} title="Bio" description="Qualidade da biografia">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <OkNokSelect 
              label="O que faz" 
              value={instagram.bio.whatDoes} 
              onChange={(v) => updateSection('instagram', { bio: { ...instagram.bio, whatDoes: v } })}
            />
            <OkNokSelect 
              label="Onde atua" 
              value={instagram.bio.whereOperates} 
              onChange={(v) => updateSection('instagram', { bio: { ...instagram.bio, whereOperates: v } })}
            />
            <OkNokSelect 
              label="Autoridade" 
              value={instagram.bio.authority} 
              onChange={(v) => updateSection('instagram', { bio: { ...instagram.bio, authority: v } })}
            />
            <OkNokSelect 
              label="CTA" 
              value={instagram.bio.cta} 
              onChange={(v) => updateSection('instagram', { bio: { ...instagram.bio, cta: v } })}
            />
            <OkNokSelect 
              label="Link na bio" 
              value={instagram.bio.linkInBio} 
              onChange={(v) => updateSection('instagram', { bio: { ...instagram.bio, linkInBio: v } })}
            />
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <span className="text-sm text-foreground">Link com rastreamento (UTM)?</span>
              <Select 
                value={instagram.bio.linkTracking === null ? '' : instagram.bio.linkTracking.toString()}
                onValueChange={(v) => updateSection('instagram', { 
                  bio: { ...instagram.bio, linkTracking: v === '' ? null : v === 'true' } 
                })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Highlights Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard icon={Star} title="Destaques" description="Stories em destaque">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <OkNokSelect 
              label="Quem sou eu" 
              value={instagram.highlights.whoAmI} 
              onChange={(v) => updateSection('instagram', { highlights: { ...instagram.highlights, whoAmI: v } })}
            />
            <OkNokSelect 
              label="Prova social" 
              value={instagram.highlights.socialProof} 
              onChange={(v) => updateSection('instagram', { highlights: { ...instagram.highlights, socialProof: v } })}
            />
            <OkNokSelect 
              label="Autoridade" 
              value={instagram.highlights.authority} 
              onChange={(v) => updateSection('instagram', { highlights: { ...instagram.highlights, authority: v } })}
            />
            <OkNokSelect 
              label="Diferencial" 
              value={instagram.highlights.differential} 
              onChange={(v) => updateSection('instagram', { highlights: { ...instagram.highlights, differential: v } })}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* Pinned Posts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SectionCard icon={Pin} title="Fixados" description="Posts fixados no perfil">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <OkNokSelect 
              label="Quem sou eu" 
              value={instagram.pinned.whoAmI} 
              onChange={(v) => updateSection('instagram', { pinned: { ...instagram.pinned, whoAmI: v } })}
            />
            <OkNokSelect 
              label="Prova Social" 
              value={instagram.pinned.socialProof} 
              onChange={(v) => updateSection('instagram', { pinned: { ...instagram.pinned, socialProof: v } })}
            />
            <OkNokSelect 
              label="Serviços ou Método" 
              value={instagram.pinned.servicesOrMethod} 
              onChange={(v) => updateSection('instagram', { pinned: { ...instagram.pinned, servicesOrMethod: v } })}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* Content Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <SectionCard icon={Calendar} title="Conteúdo" description="Frequência de postagens">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Frequência do Feed</Label>
              <Select 
                value={instagram.content.feedFrequency}
                onValueChange={(v) => updateSection('instagram', { content: { ...instagram.content, feedFrequency: v } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="3x_week">3x semana</SelectItem>
                  <SelectItem value="1x_week">1x semana</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência de Stories</Label>
              <Select 
                value={instagram.content.storiesFrequency}
                onValueChange={(v) => updateSection('instagram', { content: { ...instagram.content, storiesFrequency: v } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="3-5x_week">3-5x semana</SelectItem>
                  <SelectItem value="rare">Raro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Evidence & Observations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <SectionCard icon={Instagram} title="Evidências e Observações" description="Prints e notas">
          <div className="space-y-4">
            <EvidenceUpload 
              label="Print do perfil"
              description="Captura do perfil do Instagram"
            />
            <div className="space-y-2">
              <Label>Observações do auditor</Label>
              <Textarea 
                placeholder="Adicione observações sobre o Instagram..."
                value={instagram.observations}
                onChange={(e) => updateSection('instagram', { observations: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
