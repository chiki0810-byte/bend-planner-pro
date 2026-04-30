import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AppLayout from "./components/AppLayout";
import CalculadoraPage from "./pages/CalculadoraPage";
import FichaPiezaRapidaPage from "./pages/FichaPiezaRapidaPage";
import RematesPage from "./pages/RematesPage";
import ValidacionPage from "./pages/ValidacionPage";
import HistorialPage from "./pages/HistorialPage";
import MaterialesPage from "./pages/MaterialesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import NotFound from "./pages/NotFound";
import { AppStateProvider } from "./state/AppStateContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppStateProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<AppLayout />}>
              <Route path="/calculadora" element={<CalculadoraPage />} />
              <Route path="/fichapiezarapida" element={<FichaPiezaRapidaPage />} />
              <Route path="/remates" element={<RematesPage />} />
              <Route path="/validacion" element={<ValidacionPage />} />
              <Route path="/historial" element={<HistorialPage />} />
              <Route path="/materiales" element={<MaterialesPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
