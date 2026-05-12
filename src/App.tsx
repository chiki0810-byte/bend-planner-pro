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
import HistorialRematesPage from "./pages/HistorialRematesPage";
import DetalleRematePage from "./pages/DetalleRematePage";
import ValidacionPage from "./pages/ValidacionPage";
import HistorialPage from "./pages/HistorialPage";
import MaterialesPage from "./pages/MaterialesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import AsistenteIAPage from "./pages/AsistenteIAPage";
import SecuenciaPlegadoPage from "./pages/SecuenciaPlegadoPage";
import PlegadoProPage from "./pages/PlegadoProPage";
import PlantillasPage from "./pages/PlantillasPage";
import PlieguesPorPuntaPage from "./pages/PlieguesPorPuntaPage";
import ResultadoPiezaPage from "./pages/ResultadoPiezaPage";
import NotFound from "./pages/NotFound";
import { AppStateProvider } from "./state/AppStateContext";
import { RematesProvider } from "./state/RematesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppStateProvider>
          <RematesProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route element={<AppLayout />}>
                <Route path="/calculadora" element={<CalculadoraPage />} />
                <Route path="/fichapiezarapida" element={<FichaPiezaRapidaPage />} />
                <Route path="/remates" element={<RematesPage />} />
                <Route path="/historial-remates" element={<HistorialRematesPage />} />
                <Route path="/historial-remates/:id" element={<DetalleRematePage />} />
                <Route path="/validacion" element={<ValidacionPage />} />
                <Route path="/historial" element={<HistorialPage />} />
                <Route path="/materiales" element={<MaterialesPage />} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/asistente-ia" element={<AsistenteIAPage />} />
                <Route path="/secuencia" element={<SecuenciaPlegadoPage />} />
                <Route path="/plegado-pro" element={<PlegadoProPage />} />
                <Route path="/plantillas" element={<PlantillasPage />} />
                <Route path="/pliegues-punta" element={<PlieguesPorPuntaPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RematesProvider>
        </AppStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
