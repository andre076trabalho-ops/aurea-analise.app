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
import { Briefcase, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function CommercialSectionEditor() {
  const { currentReportSections, updateSection } = useAppStore();
  
  if (!currentReportSections) return null;
  
  const { commercial } = currentReportSections;

  return (
    <div className="space-y-6">
      {/* Response Time Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionCard icon={Clock} title="Tempo de Resposta" description="Velocidade de atendimento ao lead">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Lead Response Time</Label>
              <Select 
                value={commercial.leadResponseTime}
                onValueChange={(v) => updateSection('commercial', { leadResponseTime: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tempo médio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">Até 5 minutos</SelectItem>
                  <SelectItem value="30min">5-30 minutos</SelectItem>
                  <SelectItem value="1h">30min - 1 hora</SelectItem>
                  <SelectItem value="2h">1-2 horas</SelectItem>
                  <SelectItem value="24h">2-24 horas</SelectItem>
                  <SelectItem value="24h+">Mais de 24 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leads respondidos em até 5 min têm 21x mais chance de conversão
              </p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Follow-ups Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard icon={RefreshCw} title="Follow-ups" description="Cadência de acompanhamento">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Quantidade de Follow-ups</Label>
              <Select 
                value={commercial.followUps}
                onValueChange={(v) => updateSection('commercial', { followUps: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nenhum (0)</SelectItem>
                  <SelectItem value="1">1 follow-up</SelectItem>
                  <SelectItem value="2-3">2-3 follow-ups</SelectItem>
                  <SelectItem value="4+">4+ follow-ups</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                80% das vendas acontecem entre o 5º e 12º follow-up
              </p>
            </div>
            <div className="space-y-2">
              <Label>Observação sobre Follow-ups</Label>
              <Input 
                placeholder="Ex: Follow-ups por WhatsApp, sem script..."
                value={commercial.followUpObservation}
                onChange={(e) => updateSection('commercial', { followUpObservation: e.target.value })}
              />
            </div>
          </div>
          
          <EvidenceUpload 
            label="Print do CRM / WhatsApp"
            description="Evidência do processo comercial (opcional)"
          />
        </SectionCard>
      </motion.div>

      {/* Observations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard icon={Briefcase} title="Observações" description="Notas do auditor">
          <div className="space-y-2">
            <Label>Observações do auditor</Label>
            <Textarea 
              placeholder="Adicione observações sobre o processo comercial..."
              value={commercial.observations}
              onChange={(e) => updateSection('commercial', { observations: e.target.value })}
              rows={4}
            />
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
