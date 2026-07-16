import React, { useState } from "react";

const CLAVE_MAESTRA = "victor2026";

const LoginAcceso: React.FC<{ onAccesoCorrecto: () => void }> = ({ onAccesoCorrecto }) => {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const validar = () => {
    if (clave.trim() === CLAVE_MAESTRA) {
      setError("");
      onAccesoCorrecto();
    } else {
      setError("Clave incorrecta");
    }
  };

  return (
    <div style={fondoMetalico}>
      <div style={card}>
        <h2 style={titulo}>Acceso restringido</h2>
        <p style={subtitulo}>Introduce la clave para entrar</p>
        <input
          type="password"
          placeholder="Clave de acceso"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          style={input}
        />
        {error && <div style={errorMsg}>{error}</div>}
        <button style={btn} onClick={validar}>
          Entrar
        </button>
      </div>
    </div>
  );
};

export default LoginAcceso;

// 🎨 Fondo metálico industrial
const fondoMetalico: React.CSSProperties = {
  width: "100%",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #b5b5b5, #e0e0e0, #9d9d9d)",
  backgroundSize: "400% 400%",
};

// Tarjeta elegante
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  textAlign: "center",
  maxWidth: "420px",
};

// Estilos
const titulo = {
  margin: "0 0 12px 0",
  fontSize: "28px",
  fontWeight: 700,
  color: "#333",
};

const subtitulo = {
  margin: "0 0 24px 0",
  fontSize: "16px",
  color: "#555",
};

const input = {
  width: "100%",
  padding: "12px",
  fontSize: "16px",
  marginBottom: "16px",
  borderRadius: "6px",
  border: "1px solid #aaa",
};

const btn = {
  padding: "12px 20px",
  fontSize: "18px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  width: "100%",
};

const errorMsg = {
  color: "red",
  marginBottom: "12px",
};
