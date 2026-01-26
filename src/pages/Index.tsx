import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { ScoreBadge } from '@/components/ui/score-badge';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  trend?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-2xl p-6 card-interactive"
  >
    <div className="flex items-start justify-between">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  </motion.div>
);

const RecentReportCard = ({ 
  report, 
  clientName 
}: { 
  report: any; 
  clientName: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{report.title}</p>
        <p className="text-sm text-muted-foreground">{clientName}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <ScoreBadge score={report.overallScore} size="sm" />
      <Link to={`/reports/${report.id}`}>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  </motion.div>
);

const Index = () => {
  const { clients, reports } = useAppStore();
  
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const avgScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + r.overallScore, 0) / reports.length)
    : 0;

  return (
    <MainLayout>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral das suas auditorias" 
      />
      
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Bem-vindo ao Audit Report Builder
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Crie relatórios de auditoria profissionais com identidade visual 
                padronizada em minutos.
              </p>
              <div className="flex gap-3 mt-6">
                <Link to="/reports/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Relatório
                  </Button>
                </Link>
                <Link to="/clients">
                  <Button variant="secondary">
                    Gerenciar Clientes
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                <FileText className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Users} 
            label="Total de Clientes" 
            value={clients.length}
          />
          <StatCard 
            icon={FileText} 
            label="Relatórios Criados" 
            value={reports.length}
            trend="+2 este mês"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Score Médio" 
            value={avgScore}
          />
          <StatCard 
            icon={Clock} 
            label="Concluídos" 
            value={completedReports}
          />
        </div>

        {/* Recent Reports */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Relatórios Recentes</h3>
              <p className="text-sm text-muted-foreground">Últimas auditorias realizadas</p>
            </div>
            <Link to="/reports">
              <Button variant="ghost" className="gap-2">
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {reports.slice(0, 5).map((report, index) => {
              const client = clients.find(c => c.id === report.clientId);
              return (
                <RecentReportCard 
                  key={report.id} 
                  report={report} 
                  clientName={client?.name || 'Cliente'} 
                />
              );
            })}
            
            {reports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum relatório criado ainda</p>
                <Link to="/reports/new">
                  <Button className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Relatório
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
