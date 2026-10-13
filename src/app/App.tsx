import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import GeoAeoDashboard from "@/features/geo-aeo/pages/GeoAeoDashboard";
import GeoAdmin from "@/features/geo-aeo/pages/GeoAdmin";
import FinancialCalculator from "@/features/financial-calculator/pages/FinancialCalculator";
import Reports from "@/features/reports/pages/Reports";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DiagnosisProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DiagnosticPage />} />
              <Route path="/diagnostico" element={<DiagnosticPage />} />
              <Route path="/geo-aeo" element={<GeoAeoDashboard />} />
              <Route path="/geo-admin" element={<GeoAdmin />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/calculadora-financeira" element={<FinancialCalculator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ThemeToggle />
          </BrowserRouter>
        </TooltipProvider>
      </DiagnosisProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
