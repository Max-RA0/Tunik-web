import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InicioSesion.css";

const REGISTER_PATH = "/registrarse";
const API_BASE = "https://tunik-api.onrender.com";

const InicioSesion = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    // ✅ ya no usamos ACL
    localStorage.removeItem("acl");
  };

  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const normalizeRoleName = (rol) => {
    const r = String(rol || "").trim().toLowerCase();
    if (r === "administrador") return "administrador";
    if (r === "cliente") return "cliente";
    return r; // por si llega distinto
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
      });

      const data = await safeJson(response);

      if (!data?.ok) {
        setMensaje(`❌ ${data?.msg || "Credenciales inválidas"}`);
        return;
      }

      // ✅ limpia lo viejo antes de guardar lo nuevo
      clearAuth();

      // ✅ guarda token si tu backend lo envía
      if (data.token) localStorage.setItem("token", data.token);

      // ✅ guarda usuario (importante que venga usuario.rol)
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      // ✅ redirección por rol
      const rol = normalizeRoleName(data?.usuario?.rol);

      if (rol === "cliente") {
        navigate("/landing", { replace: true });
      } else {
        // default: admin (o lo que sea distinto de cliente)
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setMensaje("⚠️ Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Correo:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              placeholder="********"
            />
          </div>

          <button type="submit" className="btn-login">
            Ingresar
          </button>

          <p className="olvide-pass" onClick={() => navigate("/recuperar-contrasena")}>
            ¿Olvidaste tu contraseña?
          </p>

          <p className="olvide-pass" onClick={() => navigate(REGISTER_PATH)}>
            ¿No tienes cuenta? Regístrate
          </p>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </div>
  );
};

export default InicioSesion;
