import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PortadaApp from "./pages/PortadaApp";
import PortadaModerna from "./pages/PortadaModerna";
import LoginPage from "./pages/LoginPage";
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
import ValidacionMaquinaPage from "./pages/ValidacionMaquinaPage";
import SugeridorVueltasPage from "./pages/SugeridorVueltasPage";
import RematesDesigualesPage from "./pages/RematesDesigualesPage";
import ChapaSVGPage from "./pages/ChapaSVGPage";
import ChapaLayout from "./pages/ChapaLayout";
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
              <Route path="/" element={<Navigate to="/portada-moderna" replace />} />
              <Route path="/portada-moderna" element={<PortadaModerna />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/portada-antigua" element={<PortadaApp />} />
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
                <Route path="/resultado-pieza" element={<ResultadoPiezaPage />} />
                <Route path="/validacion-maquina" element={<ValidacionMaquinaPage />} />
                <Route path="/sugeridor-vueltas" element={<SugeridorVueltasPage />} />
                <Route path="/remates-desiguales" element={<RematesDesigualesPage />} />
                <Route path="/chapa-svg" element={<ChapaSVGPage />} />
              </Route>
              <Route path="/chapa" element={<ChapaLayout />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RematesProvider>
        </AppStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
