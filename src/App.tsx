import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ReportsPage from "./pages/ReportsPage";
import ReportEditorPage from "./pages/ReportEditorPage";
import ReportPreviewPage from "./pages/ReportPreviewPage";
import BrandKitPage from "./pages/BrandKitPage";
import SettingsPage from "./pages/SettingsPage";
import ClientLandingPage from "./pages/ClientLandingPage";
import ClientLandingPage2 from "./pages/ClientLandingPage2";
import DynamicLandingPage from "./pages/DynamicLandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/new" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportEditorPage />} />
          <Route path="/reports/:id/preview" element={<ReportPreviewPage />} />
          <Route path="/r/:reportId" element={<DynamicLandingPage />} />
          <Route path="/brand-kit" element={<BrandKitPage />} />
          <Route path="/clinica-bem-estar" element={<ClientLandingPage />} />
          <Route path="/clinica-bem-estar-2" element={<ClientLandingPage2 />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
