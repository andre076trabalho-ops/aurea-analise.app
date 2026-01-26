import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Building2,
  Mail,
  Tag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { Client } from '@/types';

const ClientCard = ({ 
  client, 
  onEdit, 
  onDelete 
}: { 
  client: Client; 
  onEdit: () => void; 
  onDelete: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-card border border-border rounded-2xl p-6 card-interactive"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={client.name} 
            className="w-14 h-14 rounded-xl object-cover border border-border"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground text-lg">{client.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{client.niche}</span>
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-error">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        <span>{client.contact}</span>
      </div>
    </div>
  </motion.div>
);

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    contact: '',
    logoUrl: '',
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.niche.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        niche: client.niche,
        contact: client.contact,
        logoUrl: client.logoUrl || '',
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', niche: '', contact: '', logoUrl: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient({
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      });
    }
    setIsDialogOpen(false);
    setFormData({ name: '', niche: '', contact: '', logoUrl: '' });
  };

  return (
    <MainLayout>
      <Header 
        title="Clientes" 
        subtitle={`${clients.length} clientes cadastrados`}
      />
      
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar clientes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient 
                    ? 'Atualize as informações do cliente' 
                    : 'Adicione um novo cliente para criar relatórios'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Tech Solutions Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niche">Segmento/Nicho</Label>
                  <Input 
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="Ex: Tecnologia, Saúde, Gastronomia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input 
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Email ou telefone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">URL do Logo (opcional)</Label>
                  <Input 
                    id="logo"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingClient ? 'Salvar' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client}
              onEdit={() => handleOpenDialog(client)}
              onDelete={() => deleteClient(client.id)}
            />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {search ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro cliente'}
            </p>
            {!search && (
              <Button className="mt-4 gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Adicionar Cliente
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
