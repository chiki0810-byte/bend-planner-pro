import { useNavigate } from "react-router-dom";
import "./VisorChapa.css";

function VisorChapa() {
  const navegar = useNavigate();

  return (
    <div className="visor-chapa">
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
