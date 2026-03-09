import { useAppStore } from '@/stores/useAppStore';
import { SectionCard } from '@/components/ui/section-card';
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
import { MapPin, Star, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function GMNSectionEditor({ onAIComplement }: { onAIComplement?: () => Promise<void> }) {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { gmn } = currentReportSections;

  const updateChecklist = (field: keyof typeof gmn.checklist, value: boolean | null) => {
    updateSection('gmn', {
      checklist: { ...gmn.checklist, [field]: value }
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={Star} title="Métricas do GMN" description="Avaliações e reputação">
          <LinkInput
            label="Link do Google Meu Negócio"
            placeholder="https://g.page/sua-empresa"
            value={gmn.gmnUrl ?? ''}
            onChange={(v) => updateSection('gmn', { gmnUrl: v })}
            className="mb-6"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Número de Avaliações</Label>
              <Input
                type="number"
                placeholder="Ex: 145"
                value={gmn.reviewCount ?? ''}
                onChange={(e) => updateSection('gmn', { reviewCount: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota Média (estrelas)</Label>
              <Input
                type="number"
                step="0.1"
                min={1}
                max={5}
                placeholder="Ex: 4.7"
                value={gmn.averageRating ?? ''}
                onChange={(e) => updateSection('gmn', { averageRating: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Checklist Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard icon={CheckSquare} title="Checklist GMN" description="Critérios de qualidade da ficha">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'napConsistent', label: 'NAP consistente', hint: 'Nome, endereço e telefone' },
              { key: 'hoursUpdated', label: 'Horário atualizado', hint: 'Horário de funcionamento correto' },
              { key: 'relevantCategories', label: 'Categorias relevantes', hint: 'Categorias do negócio' },
              { key: 'photosVideosUpdated', label: 'Fotos e vídeos atualizados', hint: 'Mídia recente' },
              { key: 'reviewsManaged', label: 'Avaliações gerenciadas', hint: 'Respostas às avaliações' },
              { key: 'regularPosts', label: 'Posts regulares', hint: 'Publicações no GMN' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Select 
                  value={gmn.checklist[item.key as keyof typeof gmn.checklist] === null ? '' : gmn.checklist[item.key as keyof typeof gmn.checklist]!.toString()}
                  onValueChange={(v) => updateChecklist(item.key as keyof typeof gmn.checklist, v === '' ? null : v === 'true')}
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

      {/* Observations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard icon={MapPin} title="Observações" description="Notas do auditor">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recomendações</Label>
              <div className="space-y-2">
                {(gmn.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={rec}
                      onChange={(e) => {
                        const updated = [...(gmn.recommendations || [])];
                        updated[i] = e.target.value;
                        updateSection('gmn', { recommendations: updated });
                      }}
                      placeholder={`Recomendação ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateSection('gmn', { recommendations: (gmn.recommendations || []).filter((_, idx) => idx !== i) })}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => updateSection('gmn', { recommendations: [...(gmn.recommendations || []), ''] })}
                >
                  <Plus className="w-4 h-4" /> Adicionar recomendação
                </Button>
              </div>
            </div>
            <AuditorNote
              value={gmn.observations}
              onChange={(v) => updateSection('gmn', { observations: v })}
              placeholder="Adicione observações sobre o Google Meu Negócio..."
              onAIComplement={onAIComplement}
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
