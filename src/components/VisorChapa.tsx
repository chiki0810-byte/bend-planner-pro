import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./VisorChapa.css";

function VisorChapa() {
  const navegar = useNavigate();
  const [esCompacto, setEsCompacto] = useState(window.innerWidth < 480);

  useEffect(() => {
    const manejarResize = () => setEsCompacto(window.innerWidth < 480);
    window.addEventListener("resize", manejarResize);
    return () => window.removeEventListener("resize", manejarResize);
  }, []);

  return (
    <div className={`visor-chapa ${esCompacto ? "visor-chapa-compacto" : ""}`}>
      <div className={`visor-area ${esCompacto ? "visor-interno-compacto" : ""}`}>
        <div className={`visor-contenido ${esCompacto ? "visor-layout-movil" : ""}`}>
          <section className="visor-seccion visor-secuencia">
            <h3>Secuencia de pliegues</h3>
            <p>Orden de plegado</p>
          </section>
          <section className="visor-seccion visor-estadisticas">
            <h3>Estadísticas</h3>
            <p>Resumen de la pieza</p>
          </section>
          <section className="visor-seccion visor-controles">
            <h3>Controles</h3>
            <p>Ajustes del visor</p>
          </section>
        </div>
      </div>
      <button onClick={() => navegar("/menu-principal")}>
        Volver al menú principal
      </button>
    </div>
  );
}

export default VisorChapa;
