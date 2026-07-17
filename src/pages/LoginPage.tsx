import React from "react";
import { useNavigate } from "react-router-dom";
import LoginAcceso from "../components/LoginAcceso";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  return <LoginAcceso onAccesoCorrecto={() => navigate("/chapa")} />;
};

export default LoginPage;
