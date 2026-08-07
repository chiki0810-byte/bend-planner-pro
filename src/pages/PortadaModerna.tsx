import { useNavigate } from "react-router-dom";
import { Ruler, Settings2, Bot, FolderClock, ArrowRight } from "lucide-react";
import "./PortadaModerna.css";

const accesos = [
  {
    ruta: "/calculadora",
    titulo: "Calculadora",
    descripcion: "Cálculo de desarrollos y pliegues",
    Icono: Ruler,
  },
  {
    ruta: "/plegado-pro",
    titulo: "Plegado Pro",
    descripcion: "Cónicos, canales y validación",
    Icono: Settings2,
  },
  {
    ruta: "/asistente-ia",
    titulo: "Asistente IA",
    descripcion: "Ayuda técnica en línea",
    Icono: Bot,
  },
  {
    ruta: "/historial",
    titulo: "Historial",
    descripcion: "Piezas y trabajos guardados",
    Icono: FolderClock,
  },
];

function PortadaModerna() {
  const navegar = useNavigate();

  return (
    <div className="portada-contenedor">
      <main className="portada-tarjeta">
        <header className="portada-encabezado">
          <svg
            className="portada-ilustracion"
            viewBox="0 0 120 56"
            role="img"
            aria-label="Esquema de chapa plegada"
          >
            <path
              d="M6 44 L34 44 L58 18 L86 18 L114 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 50 L114 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 5"
              opacity="0.5"
            />
            <circle cx="34" cy="44" r="3" fill="currentColor" />
            <circle cx="58" cy="18" r="3" fill="currentColor" />
            <circle cx="86" cy="18" r="3" fill="currentColor" />
          </svg>
          <h1>Bend Planner Pro</h1>
          <p>
            Suite profesional para cálculo y planificación de plegado de chapa.
          </p>
        </header>

        <nav className="portada-accesos" aria-label="Accesos rápidos">
          {accesos.map(({ ruta, titulo, descripcion, Icono }) => (
            <button
              key={ruta}
              type="button"
              className="portada-acceso"
              onClick={() => navegar(ruta)}
            >
              <span className="portada-acceso-icono">
                <Icono size={22} strokeWidth={1.8} />
              </span>
              <span className="portada-acceso-texto">
                <strong>{titulo}</strong>
                <small>{descripcion}</small>
              </span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="portada-boton-principal"
          onClick={() => navegar("/menu-principal")}
        >
          Comenzar
          <ArrowRight size={20} strokeWidth={2.2} />
        </button>
      </main>
    </div>
  );
}

export default PortadaModerna;
