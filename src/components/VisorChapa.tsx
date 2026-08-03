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
      <div className="visor-area">
        <p>Datos del visor</p>
      </div>
      <button onClick={() => navegar("/menu-principal")}>
        Volver al menú principal
      </button>
    </div>
  );
}

export default VisorChapa;
