import React, { useState } from "react";

/**
 * Módulo de acceso con clave:
 * - Clave maestra definida por ti
 * - Bloquea el acceso a /chapa si no es correcta
 * - Preparado para integrarse con la portada
 */

const CLAVE_MAESTRA = "victor2026"; // <-- cámbiala cuando quieras

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
    <div style={container}>
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
  fontSize: "28px",
  fontWeight: 700,
  color: "#333",
};

const subtitulo: React.CSSProperties = {
  margin: "0 0 24px 0",
  fontSize: "16px",
  color: "#555",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  fontSize: "16px",
  marginBottom: "16px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const btn: React.CSSProperties = {
  padding: "12px 20px",
  fontSize: "18px",
  background: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  width: "100%",
};

const errorMsg: React.CSSProperties = {
  color: "red",
  marginBottom: "12px",
};
