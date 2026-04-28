import { useNavigate } from "react-router-dom";
import { ArrowRight, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-portada.jpg";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(218_40%_6%)] text-white">
      <img
        src={hero}
        alt="Plegadora industrial futurista para cálculo de plegado de chapa"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(218_60%_4%/0.3)] via-[hsl(218_60%_4%/0.55)] to-[hsl(218_70%_3%/0.95)]" />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210_100%_70%/0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(210_100%_70%/0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-10 text-center">
        <div className="flex items-center gap-2 text-sky-300 tracking-[0.3em] text-xs uppercase">
          <Cpu className="w-4 h-4" />
          Sheet Metal · v1.0
        </div>

        <div className="space-y-5 max-w-2xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] drop-shadow-[0_0_30px_hsl(210_100%_60%/0.6)]">
            Calculadora<br />de Plegado
          </h1>
          <p className="text-sky-200 text-base sm:text-lg font-light tracking-wide">
            Simulación real según máquinas del taller
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] sm:text-xs text-sky-300/80 uppercase tracking-widest pt-2">
            <span className="px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/5">Stefa 8 m</span>
            <span className="px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/5">Jordi 180 t</span>
            <span className="px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/5">Prensa 6 m</span>
            <span className="px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/5">100% Offline</span>
          </div>
        </div>

        <Button
          onClick={() => navigate("/calculadora")}
          size="lg"
          className="group h-16 px-12 text-lg font-bold uppercase tracking-widest rounded-xl bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 border border-sky-300/60 shadow-[0_0_40px_hsl(210_100%_50%/0.6)] transition-all"
        >
          Entrar
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
