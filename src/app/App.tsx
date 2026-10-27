import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import SharedDiagnosticReportPage from "@/features/diagnostics/pages/SharedDiagnosticReportPage";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import { HomePage } from "@/features/home";
import GeoAeoDashboard from "@/features/geo-aeo/pages/GeoAeoDashboard";
import GeoAdmin from "@/features/geo-aeo/pages/GeoAdmin";
import FinancialCalculator from "@/features/financial-calculator/pages/FinancialCalculator";
import Reports from "@/features/reports/pages/Reports";
import AdminPage from "@/features/admin/pages/AdminPage";
import AdminLoginPage from "@/features/admin/pages/AdminLoginPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasInlineThemeToggle } from "@/components/app-header-routes";
import { captureCampaignTracking } from "@/features/diagnostics/model/campaign-tracking";

const queryClient = new QueryClient();

const CampaignTrackingCapture = () => {
  const location = useLocation();

  useEffect(() => {
    captureCampaignTracking({
      search: location.search,
      href: window.location.href,
    });
  }, [location.pathname, location.search]);

  return null;
};

// Pages with <AppHeader /> already carry the toggle in the header.
const FloatingThemeToggle = () => {
  const { pathname } = useLocation();
  return hasInlineThemeToggle(pathname) ? null : <ThemeToggle />;
};

// Old demo links (/?demo=1) predate the home page; keep them working.
const RootRoute = () => {
  const { search } = useLocation();
  return new URLSearchParams(search).get("demo") === "1" ? (
    <Navigate to={`/diagnostico${search}`} replace />
  ) : (
    <HomePage />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DiagnosisProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CampaignTrackingCapture />
            <Routes>
              <Route
                path="/diagnostico/:reportId"
                element={<SharedDiagnosticReportPage />}
              />
              <Route path="/" element={<RootRoute />} />
              <Route path="/diagnostico" element={<DiagnosticPage />} />
              <Route path="/geo-aeo" element={<GeoAeoDashboard />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/geo-admin" element={<GeoAdmin />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/calculadora-financeira" element={<FinancialCalculator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingThemeToggle />
          </BrowserRouter>
        </TooltipProvider>
      </DiagnosisProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
