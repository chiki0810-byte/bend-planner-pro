import { useNavigate } from "react-router-dom";

function PortadaModerna() {
  const navegar = useNavigate();

  return (
    <div className="portada-contenedor">
      <div className="portada-tarjeta">
        <h1 className="portada-titulo">Sheet Metal Buddy</h1>
        <p className="portada-subtitulo">
          Plataforma técnica para visualización y simulación de chapa
        </p>
        <button
          className="portada-boton"
          onClick={() => navegar("/login")}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

export default PortadaModerna;
