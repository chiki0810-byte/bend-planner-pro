import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Calculator, Factory, FolderOpen, Layers, Settings, Home, ArrowLeft, FileText, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/fichapiezarapida", label: "Ficha", icon: FileText },
  { to: "/remates", label: "Remates", icon: Scissors },
  { to: "/validacion", label: "Validación", icon: Factory },
  { to: "/historial", label: "Historial", icon: FolderOpen },
  { to: "/materiales", label: "Materiales", icon: Layers },
  { to: "/configuracion", label: "Ajustes", icon: Settings },
];

const AppLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-0 md:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[hsl(218_40%_8%)] text-sky-100 flex-col border-r border-sky-500/20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-5 border-b border-sky-500/20 hover:bg-sky-500/10 transition"
        >
          <Home className="w-5 h-5 text-sky-400" />
          <span className="font-bold tracking-wide">Plegado</span>
        </button>
        <nav className="flex-1 p-3 space-y-1">
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
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-[hsl(218_40%_8%)] text-sky-100 border-b border-sky-500/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-sky-200 hover:bg-sky-500/10 hover:text-sky-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Inicio
        </Button>
        <span className="font-bold text-sm tracking-wider">CALCULADORA DE PLEGADO</span>
        <span className="w-12" />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 grid grid-cols-7 bg-[hsl(218_40%_8%)] border-t border-sky-500/20 text-sky-100">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold tracking-wide ${
                isActive ? "text-sky-300" : "text-sky-100/60"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
