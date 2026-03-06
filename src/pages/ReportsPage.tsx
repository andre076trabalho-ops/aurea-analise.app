import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreBadge } from '@/components/ui/score-badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Report, Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Rascunho', icon: FileText, color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'bg-info/20 text-info' },
  review: { label: 'Em Revisão', icon: AlertCircle, color: 'bg-warning/20 text-warning' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'bg-success/20 text-success' },
};

const ReportCard = ({ 
  report, 
  clientName,
  onDelete 
}: { 
  report: Report; 
  clientName: string;
  onDelete: () => void;
}) => {
  const status = statusConfig[report.status];
  const StatusIcon = status.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden card-interactive"
    >
      {/* Header with status */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <Badge className={cn("gap-1.5", status.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/reports/${report.id}`}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/reports/${report.id}/preview`}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-error">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate">
              {report.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{clientName}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(report.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <ScoreBadge score={report.overallScore} size="md" showLabel />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-secondary/30 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Por: {report.owner}
        </span>
        <Link to={`/reports/${report.id}`}>
          <Button size="sm">
            Abrir
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const { reports, clients, addReport, deleteReport } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    owner: '',
  });

  const filteredReports = reports.filter(r => {
    const client = clients.find(c => c.id === r.clientId);
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (client?.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = () => {
    const selectedClient = clients.find(c => c.id === formData.clientId);
    const now = new Date();
    const autoTitle = `Auditoria Digital - ${selectedClient?.name || 'Cliente'} - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    const newReport: Report = {
      id: Date.now().toString(),
      clientId: formData.clientId,
      title: autoTitle,
      owner: formData.owner,
      date: now,
      status: 'draft',
      overallScore: 0,
      createdAt: now,
    };
    addReport(newReport);
    setIsDialogOpen(false);
    setFormData({ clientId: '', owner: '' });
    navigate(`/reports/${newReport.id}`);
  };

  return (
    <MainLayout>
      <Header 
        title="Relatórios" 
        subtitle={`${reports.length} relatórios criados`}
      />
      
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar relatórios..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="review">Em Revisão</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Relatório</DialogTitle>
                <DialogDescription>
                  Crie um novo relatório de auditoria para um cliente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Responsável</Label>
                  <Input 
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.clientId}
                >
                  Criar Relatório
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const client = clients.find(c => c.id === report.clientId);
            return (
              <ReportCard 
                key={report.id} 
                report={report}
                clientName={client?.name || 'Cliente'}
                onDelete={() => deleteReport(report.id)}
              />
            );
          })}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {search || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros' 
                : 'Comece criando seu primeiro relatório'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Criar Relatório
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
