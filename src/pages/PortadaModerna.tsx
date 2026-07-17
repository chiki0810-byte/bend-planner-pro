import React from "react";
import { useNavigate } from "react-router-dom";

const PortadaModerna: React.FC = () => {
  const navegar = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#F4F4F7",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
          width: "90%",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
            color: "#1E1E1E",
          }}
        >
          Sheet Metal Buddy
        </h1>

        <p
          style={{
            fontSize: "18px",
            marginBottom: "30px",
            color: "#555",
          }}
        >
          Sistema técnico para visualización y simulación de chapa
        </p>

        <button
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "20px",
            borderRadius: "10px",
            backgroundColor: "#1E88E5",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0px 3px 8px rgba(0,0,0,0.2)",
          }}
          onClick={() => navegar("/login")}
        >
          Entrar
        </button>
      </div>
    </div>
  );
};

export default PortadaModerna;
