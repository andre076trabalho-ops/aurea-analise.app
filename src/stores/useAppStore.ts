import { create } from 'zustand';
import { Client, Report, BrandKit, ReportSections } from '@/types';

interface AppState {
  // Clients
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Reports
  reports: Report[];
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  deleteReport: (id: string) => void;

  // Current Report Sections
  currentReportSections: ReportSections | null;
  setCurrentReportSections: (sections: ReportSections) => void;
  updateSection: <K extends keyof ReportSections>(
    sectionKey: K, 
    data: Partial<ReportSections[K]>
  ) => void;

  // Brand Kit
  brandKit: BrandKit;
  updateBrandKit: (kit: Partial<BrandKit>) => void;
}

// Default brand kit
const defaultBrandKit: BrandKit = {
  id: '1',
  primaryColor: '#10b981',
  secondaryColor: '#1e293b',
  neutralColor: '#64748b',
  font: 'Inter',
  style: 'premium',
};

// Sample data
const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Ltda',
    niche: 'Tecnologia',
    contact: 'contato@techsolutions.com',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Clínica Bem Estar',
    niche: 'Saúde',
    contact: 'atendimento@clinicabemestar.com',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Restaurante Sabor & Arte',
    niche: 'Gastronomia',
    contact: 'reservas@saborarte.com',
    createdAt: new Date('2024-02-20'),
  },
];

const sampleReports: Report[] = [
  {
    id: '1',
    clientId: '1',
    title: 'Auditoria Digital - Q1 2024',
    date: new Date('2024-03-01'),
    owner: 'João Silva',
    status: 'completed',
    overallScore: 72,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: '2',
    clientId: '2',
    title: 'Análise de Presença Digital',
    date: new Date('2024-03-15'),
    owner: 'João Silva',
    status: 'in_progress',
    overallScore: 58,
    createdAt: new Date('2024-03-15'),
  },
];

export const useAppStore = create<AppState>((set) => ({
  // Clients
  clients: sampleClients,
  addClient: (client) => set((state) => ({ 
    clients: [...state.clients, client] 
  })),
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map((c) => 
      c.id === id ? { ...c, ...updates } : c
    ),
  })),
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== id),
  })),

  // Reports
  reports: sampleReports,
  addReport: (report) => set((state) => ({ 
    reports: [...state.reports, report] 
  })),
  updateReport: (id, updates) => set((state) => ({
    reports: state.reports.map((r) => 
      r.id === id ? { ...r, ...updates } : r
    ),
  })),
  deleteReport: (id) => set((state) => ({
    reports: state.reports.filter((r) => r.id !== id),
  })),

  // Current Report Sections
  currentReportSections: null,
  setCurrentReportSections: (sections) => set({ currentReportSections: sections }),
  updateSection: (sectionKey, data) => set((state) => {
    if (!state.currentReportSections) return state;
    return {
      currentReportSections: {
        ...state.currentReportSections,
        [sectionKey]: {
          ...state.currentReportSections[sectionKey],
          ...data,
        },
      },
    };
  }),

  // Brand Kit
  brandKit: defaultBrandKit,
  updateBrandKit: (updates) => set((state) => ({
    brandKit: { ...state.brandKit, ...updates },
  })),
}));
