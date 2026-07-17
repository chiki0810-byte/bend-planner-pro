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
        backgroundColor: "#EFEFF3",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "18px",
          boxShadow: "0px 6px 18px rgba(0,0,0,0.15)",
          width: "90%",
          maxWidth: "430px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "34px",
            marginBottom: "12px",
            color: "#222",
          }}
        >
          Sheet Metal Buddy
        </h1>

        <p
          style={{
            fontSize: "19px",
            marginBottom: "32px",
            color: "#666",
          }}
        >
          Plataforma técnica para visualización y simulación de chapa
        </p>

        <button
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "20px",
            borderRadius: "12px",
            backgroundColor: "#1E88E5",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.25)",
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
