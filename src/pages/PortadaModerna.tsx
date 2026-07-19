import { useNavigate } from "react-router-dom";
import "./PortadaModerna.css";

function PortadaModerna() {
  const navegar = useNavigate();

  return (
    <div className="portada-contenedor">
      <div className="portada-tarjeta">
        <h1>Sheet Metal Buddy</h1>
        <p>Plataforma técnica para visualización y simulación de chapa</p>
        <button onClick={() => navegar("/menu-principal")}>Entrar</button>
      </div>
    </div>
  );
}

export default PortadaModerna;
