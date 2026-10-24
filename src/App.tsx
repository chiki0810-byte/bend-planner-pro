import { lazy, Suspense } from "react";
import "./Responsive.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
const PortadaApp = lazy(() => import("./pages/PortadaApp"));
const PortadaModerna = lazy(() => import("./pages/PortadaModerna"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MenuPrincipal = lazy(() => import("./components/MenuPrincipal"));
import AppLayout from "./components/AppLayout";
const CalculadoraPage = lazy(() => import("./pages/CalculadoraPage"));
const FichaPiezaRapidaPage = lazy(() => import("./pages/FichaPiezaRapidaPage"));
const RematesPage = lazy(() => import("./pages/RematesPage"));
const HistorialRematesPage = lazy(() => import("./pages/HistorialRematesPage"));
const DetalleRematePage = lazy(() => import("./pages/DetalleRematePage"));
const ValidacionPage = lazy(() => import("./pages/ValidacionPage"));
const HistorialPage = lazy(() => import("./pages/HistorialPage"));
const MaterialesPage = lazy(() => import("./pages/MaterialesPage"));
const ConfiguracionPage = lazy(() => import("./pages/ConfiguracionPage"));
const AsistenteIAPage = lazy(() => import("./pages/AsistenteIAPage"));
const SecuenciaPlegadoPage = lazy(() => import("./pages/SecuenciaPlegadoPage"));
const PlegadoProPage = lazy(() => import("./pages/PlegadoProPage"));
const PlantillasPage = lazy(() => import("./pages/PlantillasPage"));
const PlieguesPorPuntaPage = lazy(() => import("./pages/PlieguesPorPuntaPage"));
const ResultadoPiezaPage = lazy(() => import("./pages/ResultadoPiezaPage"));
const ValidacionMaquinaPage = lazy(() => import("./pages/ValidacionMaquinaPage"));
const SugeridorVueltasPage = lazy(() => import("./pages/SugeridorVueltasPage"));
const RematesDesigualesPage = lazy(() => import("./pages/RematesDesigualesPage"));
const ChapaSVGPage = lazy(() => import("./pages/ChapaSVGPage"));
const ChapaLayout = lazy(() => import("./pages/ChapaLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
            <Suspense fallback={<div role="status" className="min-h-screen grid place-items-center text-sm text-muted-foreground">Cargando módulo…</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/portada-moderna" replace />} />
                <Route path="/portada-moderna" element={<PortadaModerna />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/menu-principal" element={<MenuPrincipal />} />
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
                  <Route path="/chapa" element={<ChapaLayout />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RematesProvider>
        </AppStateProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
