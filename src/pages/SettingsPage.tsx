import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, User, Bell, Shield, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <MainLayout>
      <Header 
        title="Configurações" 
        subtitle="Gerencie suas preferências"
      />
      
      <div className="p-6 max-w-3xl space-y-6">
        {/* Profile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Perfil</h3>
              <p className="text-sm text-muted-foreground">Suas informações pessoais</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input defaultValue="João Silva" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="joao@empresa.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input defaultValue="Minha Agência Digital" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input defaultValue="Consultor de Marketing" />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notificações</h3>
              <p className="text-sm text-muted-foreground">Configure seus alertas</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Relatório concluído</p>
                <p className="text-sm text-muted-foreground">Receba notificação quando um relatório for finalizado</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Lembretes de revisão</p>
                <p className="text-sm text-muted-foreground">Lembre-me de revisar relatórios pendentes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Atualizações do sistema</p>
                <p className="text-sm text-muted-foreground">Novidades e melhorias do app</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>

        {/* Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Exportação</h3>
              <p className="text-sm text-muted-foreground">Configurações de PDF</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Incluir número de páginas</p>
                <p className="text-sm text-muted-foreground">Adicionar "Página X de Y" no rodapé</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Incluir data de geração</p>
                <p className="text-sm text-muted-foreground">Adicionar data no rodapé do PDF</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Compressão de imagens</p>
                <p className="text-sm text-muted-foreground">Reduzir tamanho do arquivo PDF</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </motion.div>

        {/* Save */}
        <div className="flex justify-end">
          <Button>Salvar Configurações</Button>
        </div>
      </div>
    </MainLayout>
  );
}
