import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, Report, BrandKit, ReportSections, ReportBranding } from '@/types';
import {
  calculateSiteScore,
  calculateInstagramScore,
  calculateGMNScore,
  calculatePaidTrafficScore,
  calculateCommercialScore,
} from '@/lib/scoring';
import { supabase } from '@/integrations/supabase/client';

const DB_KEY = 'main';
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(getState: () => object) {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      const s = getState() as any;
      const data = {
        clients: s.clients,
        reports: s.reports,
        allReportSections: s.allReportSections,
        allReportBranding: s.allReportBranding,
        brandKit: s.brandKit,
      };
      await (supabase as any)
        .from('app_storage')
        .upsert({ id: DB_KEY, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    } catch { /* localStorage still works */ }
  }, 1500);
}

export async function loadRemoteState(): Promise<object | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('app_storage')
      .select('data')
      .eq('id', DB_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}

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

  // All Report Sections (persisted by report ID)
  allReportSections: Record<string, ReportSections>;
  saveReportSections: (reportId: string, sections: ReportSections) => void;
  getReportSections: (reportId: string) => ReportSections | null;

  // Current Report Sections (active editing)
  currentReportId: string | null;
  currentReportSections: ReportSections | null;
  setCurrentReport: (reportId: string, sections: ReportSections) => void;
  setCurrentReportSections: (sections: ReportSections) => void;
  updateSection: <K extends keyof ReportSections>(
    sectionKey: K, 
    data: Partial<ReportSections[K]>
  ) => void;

  // Report Branding (per-report override, keyed by report ID)
  allReportBranding: Record<string, ReportBranding>;
  reportBranding: ReportBranding | null;
  setReportBranding: (branding: ReportBranding | null) => void;
  setReportBrandingForId: (reportId: string, branding: ReportBranding) => void;
  getReportBranding: (reportId: string) => ReportBranding | null;

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
    contact: 'contato@techsolutions.com',
    doctorName: 'Dr. João Silva',
    city: 'São Paulo',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Clínica Bem Estar',
    contact: 'atendimento@clinicabemestar.com',
    doctorName: 'Dra. Maria Souza',
    city: 'Rio de Janeiro',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Restaurante Sabor & Arte',
    contact: 'reservas@saborarte.com',
    doctorName: '',
    city: 'Belo Horizonte',
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Clients
      clients: sampleClients,
      addClient: (client) => {
        set((state) => ({ clients: [...state.clients, client] }));
        scheduleSync(get);
      },
      updateClient: (id, updates) => {
        set((state) => ({ clients: state.clients.map((c) => c.id === id ? { ...c, ...updates } : c) }));
        scheduleSync(get);
      },
      deleteClient: (id) => {
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
        scheduleSync(get);
      },

      // Reports
      reports: sampleReports,
      addReport: (report) => {
        set((state) => ({ reports: [...state.reports, report] }));
        scheduleSync(get);
      },
      updateReport: (id, updates) => {
        set((state) => ({ reports: state.reports.map((r) => r.id === id ? { ...r, ...updates } : r) }));
        scheduleSync(get);
      },
      deleteReport: (id) => {
        set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }));
        scheduleSync(get);
      },

      // All Report Sections
      allReportSections: {},
      saveReportSections: (reportId, sections) => {
        set((state) => ({ allReportSections: { ...state.allReportSections, [reportId]: sections } }));
        scheduleSync(get);
      },
      getReportSections: (reportId) => get().allReportSections[reportId] || null,

      // Current Report
      currentReportId: null,
      currentReportSections: null,
      setCurrentReport: (reportId, sections) => set({ 
        currentReportId: reportId, 
        currentReportSections: sections,
      }),
      setCurrentReportSections: (sections) => set({ currentReportSections: sections }),
      updateSection: (sectionKey, data) => set((state) => {
        if (!state.currentReportSections) return state;
        
        const updatedSection = {
          ...state.currentReportSections[sectionKey],
          ...data,
        };

        let newScore = 0;
        switch (sectionKey) {
          case 'site':
            newScore = calculateSiteScore(updatedSection as any);
            break;
          case 'instagram':
            newScore = calculateInstagramScore(updatedSection as any);
            break;
          case 'gmn':
            newScore = calculateGMNScore(updatedSection as any);
            break;
          case 'paidTraffic':
            newScore = calculatePaidTrafficScore(updatedSection as any);
            break;
          case 'commercial':
            newScore = calculateCommercialScore(updatedSection as any);
            break;
        }

        const newSections = {
          ...state.currentReportSections,
          [sectionKey]: {
            ...updatedSection,
            score: newScore,
          },
        };

        // Auto-save to allReportSections
        const reportId = state.currentReportId;
        const allReportSections = reportId 
          ? { ...state.allReportSections, [reportId]: newSections }
          : state.allReportSections;

        scheduleSync(get);
        return {
          currentReportSections: newSections,
          allReportSections,
        };
      }),

      // Report Branding
      allReportBranding: {},
      reportBranding: null,
      setReportBranding: (branding) => set((state) => {
        const reportId = state.currentReportId;
        const allReportBranding = reportId && branding
          ? { ...state.allReportBranding, [reportId]: branding }
          : state.allReportBranding;
        return { reportBranding: branding, allReportBranding };
      }),
      setReportBrandingForId: (reportId, branding) => set((state) => ({
        allReportBranding: { ...state.allReportBranding, [reportId]: branding },
      })),
      getReportBranding: (reportId) => get().allReportBranding[reportId] || null,

      // Brand Kit
      brandKit: defaultBrandKit,
      updateBrandKit: (updates) => {
        set((state) => ({ brandKit: { ...state.brandKit, ...updates } }));
        scheduleSync(get);
      },
    }),
    {
      name: 'aurea-app-storage',
      partialize: (state) => ({
        clients: state.clients,
        reports: state.reports,
        allReportSections: state.allReportSections,
        allReportBranding: state.allReportBranding,
        brandKit: state.brandKit,
      }),
      onRehydrateStorage: () => () => {
        // After localStorage rehydration, try to load a fresher copy from Supabase
        loadRemoteState().then((remote) => {
          if (!remote) return;
          const r = remote as any;
          useAppStore.setState((local) => ({
            clients: r.clients ?? local.clients,
            reports: r.reports ?? local.reports,
            allReportSections: r.allReportSections ?? local.allReportSections,
            allReportBranding: r.allReportBranding ?? local.allReportBranding,
            brandKit: r.brandKit ?? local.brandKit,
          }));
        });
      },
    }
  )
);
