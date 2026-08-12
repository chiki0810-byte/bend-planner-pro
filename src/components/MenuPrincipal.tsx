import { useNavigate } from "react-router-dom";
import "./MenuPrincipal.css";

function MenuPrincipal() {
  const navegar = useNavigate();

  return (
    <div className="menu-principal">
      <button onClick={() => navegar("/portada-moderna")}>Portada</button>
      <button onClick={() => navegar("/login")}>Login</button>
      <button onClick={() => navegar("/chapa")}>Chapa</button>
    </div>
  );
}

export default MenuPrincipal;
