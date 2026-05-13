import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Calculator,
  Cpu,
  Home,
  ArrowLeft,
  Sparkles,
  Workflow,
  FolderClock,
  LayoutTemplate,
  Layers3,
  SlidersHorizontal,
  Menu,
  GitBranch,
  FileText,
  ShieldCheck,
  ListOrdered,
  Scissors,
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/validacion", label: "Validación por Máquina", icon: Cpu },
  { to: "/secuencia", label: "Secuencia", icon: Workflow },
  { to: "/pliegues-punta", label: "Pliegues por Punta", icon: GitBranch },
  { to: "/resultado-pieza", label: "Resultado de Pieza", icon: FileText },
  { to: "/validacion-maquina", label: "Validación de Máquina", icon: ShieldCheck },
  { to: "/sugeridor-vueltas", label: "Sugeridor de Vueltas", icon: ListOrdered },
  { to: "/historial", label: "Historial", icon: FolderClock },
  { to: "/plantillas", label: "Plantillas", icon: LayoutTemplate },
  { to: "/materiales", label: "Materiales", icon: Layers3 },
  { to: "/configuracion", label: "Ajustes", icon: SlidersHorizontal },
];

// Bottom bar reducido para móvil (máx 3) — el resto vive en el drawer
const mobileBottomItems = [
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/asistente-ia", label: "Asistente", icon: Sparkles },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 md:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[hsl(218_40%_8%)] text-sky-100 flex-col border-r border-sky-500/20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-5 border-b border-sky-500/20 hover:bg-sky-500/10 transition"
        >
          <Home className="w-5 h-5 text-sky-400" />
          <span className="font-bold tracking-wide">Plegado</span>
        </button>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-500/20 text-sky-200 shadow-[inset_0_0_0_1px_hsl(210_100%_60%/0.4)]"
                    : "text-sky-100/70 hover:bg-sky-500/10 hover:text-sky-100"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-[10px] text-sky-400/50 uppercase tracking-widest text-center">
          Offline · v1.0
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-3 h-14 bg-[hsl(218_40%_8%)] text-sky-100 border-b border-sky-500/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-sky-200 hover:bg-sky-500/10 hover:text-sky-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Inicio
        </Button>
        <span className="font-bold text-[13px] tracking-wider">PLEGADO</span>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-sky-200 hover:bg-sky-500/10 hover:text-sky-100"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-[hsl(218_40%_8%)] text-sky-100 border-l border-sky-500/20 p-0 w-72"
          >
            <SheetHeader className="px-5 py-4 border-b border-sky-500/20">
              <SheetTitle className="text-sky-200 tracking-wide">Menú</SheetTitle>
            </SheetHeader>
            <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
              {navItems.map(({ to, label, icon: Icon }) => (
                <SheetClose asChild key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-sky-500/20 text-sky-200 shadow-[inset_0_0_0_1px_hsl(210_100%_60%/0.4)]"
                          : "text-sky-100/70 hover:bg-sky-500/10 hover:text-sky-100"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                </SheetClose>
              ))}
              <div className="pt-3 text-[10px] text-sky-400/50 uppercase tracking-widest text-center">
                Offline · v1.0
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) — reducido a 3 accesos */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 grid grid-cols-3 bg-[hsl(218_40%_8%)] border-t border-sky-500/20 text-sky-100">
        {mobileBottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold tracking-wide ${
                isActive ? "text-sky-300" : "text-sky-100/70"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold tracking-wide text-sky-100/70"
        >
          <Menu className="w-5 h-5" />
          Menú
        </button>
      </nav>
    </div>
  );
};

export default AppLayout;
