import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Portada principal de la app Sheet Metal.
 * - Diseño industrial limpio
 * - Botón grande para entrar a /chapa
 * - Preparada para integrar acceso con clave
 */

const PortadaApp: React.FC = () => {
  const navigate = useNavigate();

  const entrar = () => {
    navigate("/chapa");
  };

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={titulo}>Sheet Metal</h1>
        <p style={subtitulo}>
          Sistema técnico para visualización, validación y simulación de pliegues de chapa.
        </p>

        <button style={btnEntrar} onClick={entrar}>
          Entrar a la aplicación
        </button>
      </div>
    </div>
  );
};

export default PortadaApp;

const container: React.CSSProperties = {
  width: "100%",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#e5e5e5",
};

const card: React.CSSProperties = {
  background: "white",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  textAlign: "center",
  maxWidth: "420px",
};

const titulo: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "32px",
  fontWeight: 700,
  color: "#333",
};

const subtitulo: React.CSSProperties = {
  margin: "0 0 24px 0",
  fontSize: "16px",
  color: "#555",
};

const btnEntrar: React.CSSProperties = {
  padding: "12px 20px",
  fontSize: "18px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  width: "100%",
};
